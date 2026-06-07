import { prisma } from '../../lib/prisma';
import { groq } from '../../lib/groq';
import { config } from '../../config';
import { logger } from '../../lib/logger';

export class EvaluationService {
  public async evaluateSessionBackground(sessionId: string): Promise<void> {
    try {
      const session = await prisma.assessmentSession.findUnique({
        where: { id: sessionId },
        include: {
          topic: true,
          questions: {
            include: { answers: true },
          },
        },
      });

      if (!session) return;

      const questionsWithAnswers = session.questions.filter(
        (q) => q.answers.length > 0
      );

      // 1. Evaluate answers concurrently using Promise.allSettled
      const evaluationPromises = questionsWithAnswers.map(async (q) => {
        const answer = q.answers[0];

        const systemPrompt = `You are an expert technical interviewer evaluating a candidate's answer.
Return your evaluation as a valid JSON object matching this schema:
{
  "score": 85, // An integer between 0 and 100 representing the overall quality, accuracy, and completeness.
  "breakdown": {
    "technicalAccuracy": 18, // out of 20
    "depthOfKnowledge": 16, // out of 20
    "communicationClarity": 17, // out of 20
    "problemSolving": 15, // out of 20
    "bestPractices": 18 // out of 20
  },
  "strengths": ["Clear explanation", "Good use of examples"], // Array of strings
  "improvements": ["Could mention edge cases"], // Array of strings
  "feedback": "Your constructive overall feedback here...",
  "expectedConcepts": ["concept1", "concept2"] // Array of core concepts that should ideally be mentioned.
}
Do not include any extra text. Return only valid JSON.`;

        const userPrompt = `Topic: ${session.topic.name}
Difficulty: ${session.difficulty}
Question: ${q.text}
Candidate's Answer: ${answer.userResponse}`;

        if (!config.GROQ_API_KEY || config.GROQ_API_KEY === 'dummy_key') {
          throw new Error('Groq API Key is missing. Cannot evaluate.');
        }

        const response = await groq.chat.completions.create({
          model: config.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from Groq');

        const parsed = JSON.parse(content);
        
        // Ensure values are correct
        const score = typeof parsed.score === 'number' ? parsed.score : parseInt(parsed.score) || 0;
        const feedback = parsed.feedback || 'No feedback provided.';
        const expectedConcepts = Array.isArray(parsed.expectedConcepts) ? parsed.expectedConcepts : [];
        const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
        const improvements = Array.isArray(parsed.improvements) ? parsed.improvements : [];
        const breakdown = typeof parsed.breakdown === 'object' && parsed.breakdown !== null ? parsed.breakdown : {
          technicalAccuracy: 0,
          depthOfKnowledge: 0,
          communicationClarity: 0,
          problemSolving: 0,
          bestPractices: 0
        };

        try {
        // Save individual answer evaluation
        
        await prisma.answer.update({
          where: { id: answer.id },
          data: {
            score,
            feedback,
            expectedConcepts,
            strengths,
            improvements,
            breakdown,
          },
        });  
        } catch (error) {
          logger.error("Error saving individual answer evaluation: ", error);
          
        }

        return { score, feedback };
      });

      const results = await Promise.allSettled(evaluationPromises);

      const successfulEvaluations = results
        .filter((r): r is PromiseFulfilledResult<{ score: number; feedback: string }> => r.status === 'fulfilled')
        .map((r) => r.value);

      if (successfulEvaluations.length === 0) {
        // All evaluations failed
        await prisma.assessmentSession.update({
          where: { id: sessionId },
          data: { evaluationStatus: 'FAILED' },
        });
        return;
      }

      // Calculate overall score
      const totalScore = successfulEvaluations.reduce((sum, current) => sum + current.score, 0);
      const overallScore = Math.round(totalScore / successfulEvaluations.length);

      // Generate overall feedback
      let overallFeedback = 'Assessment completed.';
      try {
        const summaryPrompt = `You are a senior tech lead. Based on the candidate's performance across ${successfulEvaluations.length} questions, write a short, 2-3 sentence overall performance summary.
The average score is ${overallScore}/100.
Here are the individual feedbacks for context:
${successfulEvaluations.map((e, i) => `Q${i + 1}: ${e.feedback}`).join('\n')}

Provide ONLY the summary text, no extra markdown.`;

        const summaryResponse = await groq.chat.completions.create({
          model: config.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'user', content: summaryPrompt },
          ],
        });

        if (summaryResponse.choices[0]?.message?.content) {
          overallFeedback = summaryResponse.choices[0].message.content.trim();
        }
      } catch (err) {
        logger.error(`Failed to generate overall feedback for session ${sessionId}:`, err);
        overallFeedback = `You scored ${overallScore}/100 based on ${successfulEvaluations.length} successfully evaluated questions.`;
      }

      // Mark session evaluation as COMPLETED
      await prisma.assessmentSession.update({
        where: { id: sessionId },
        data: {
          score: overallScore,
          feedback: overallFeedback,
          evaluationStatus: 'COMPLETED',
        },
      });

    } catch (error) {
      logger.error(`Critical failure in evaluateSessionBackground for session ${sessionId}:`, error);
      await prisma.assessmentSession.update({
        where: { id: sessionId },
        data: { evaluationStatus: 'FAILED' },
      }).catch(() => {});
    }
  }
}

export const evaluationService = new EvaluationService();
