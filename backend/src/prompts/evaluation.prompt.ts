export interface EvaluationInput {
  topic: string;
  difficulty: string;
  question: string;
  answer: string;
}

export class EvaluationPrompt {
  static systemPrompt() {
    return `You are an expert technical interviewer evaluating a candidate's answer.
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
  }

  static userPrompt({ topic, difficulty, question, answer }: EvaluationInput): string {
    return `Topic: ${topic}
Difficulty: ${difficulty}
Question: ${question}
Candidate's Answer: ${answer}`;
  }
}
