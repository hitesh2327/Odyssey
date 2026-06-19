export interface QuestionPromptInput {
  topicName: string;
  difficulty: string;
  count: number;
}

export class QuestionPromptTemplate {
  static build({ topicName, difficulty, count }: QuestionPromptInput): string {
    return `
Generate exactly ${count} technical interview questions for the topic "${topicName}" at "${difficulty}" difficulty level.

Return your response as a JSON object matching this schema:

{
  "questions": [
    {
      "order": 1,
      "question": "Question text here..."
    }
  ]
}

Do not include any extra text.

Return only valid JSON.
`;
  }
}
