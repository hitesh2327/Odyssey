import { EvaluationPrompt } from '../../../src/prompts/evaluation.prompt';
import { QuestionPromptTemplate } from '../../../src/prompts/question.prompt';
import { ResumeParserPromptTemplate } from '../../../src/prompts/resume-parser.prompt';
import { StreamAssistance } from '../../../src/prompts/stream.assistance.prompt';

describe('Prompts', () => {
  describe('EvaluationPrompt', () => {
    it('should build system prompt correctly', () => {
      const prompt = EvaluationPrompt.systemPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain('valid JSON');
    });

    it('should build user prompt correctly', () => {
      const prompt = EvaluationPrompt.userPrompt({
        topic: 'React',
        difficulty: 'Hard',
        question: 'What is suspense?',
        answer: 'It suspends',
      });
      expect(prompt).toContain('Topic: React');
      expect(prompt).toContain('Difficulty: Hard');
      expect(prompt).toContain('Question: What is suspense?');
      expect(prompt).toContain("Candidate's Answer: It suspends");
    });
  });

  describe('QuestionPromptTemplate', () => {
    it('should build correctly with provided inputs', () => {
      const prompt = QuestionPromptTemplate.build({
        topicName: 'Node.js',
        difficulty: 'Medium',
        count: 5,
      });
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain('Node.js');
      expect(prompt).toContain('Medium');
      expect(prompt).toContain('exactly 5');
    });
  });

  describe('ResumeParserPromptTemplate', () => {
    it('should build correctly with provided resume text and topics', () => {
      const prompt = ResumeParserPromptTemplate.build({
        resumeText: 'Experience: Software Engineer at Google',
        availableTopics: ['React', 'Node.js', 'PostgreSQL'],
      });
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain('Experience: Software Engineer at Google');
      expect(prompt).toContain('React, Node.js, PostgreSQL');
      expect(prompt).toContain('role');
      expect(prompt).toContain('matchedTopics');
    });
  });

  describe('StreamAssistance', () => {
    it('should build system prompt correctly', () => {
      const prompt = StreamAssistance.systemPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain('strict technical interviewer');
      expect(prompt).toContain('### 💡 Hint');
    });

    it('should build user prompt correctly', () => {
      const prompt = StreamAssistance.userPrompt({
        text: 'How does event loop work?',
        difficulty: 'Medium',
        name: 'Node.js',
      });
      expect(prompt).toContain('Question:\nHow does event loop work?');
      expect(prompt).toContain('Difficulty:\nMedium');
      expect(prompt).toContain('Topic:\nNode.js');
    });
  });
});
