export const answerFactory = {
  valid: (sessionId: string, questionId: string) => ({
    sessionId, questionId,
    userResponse: 'A primary key uniquely identifies each row in a table.'
  }),
  withEmptyResponse: (sessionId: string, questionId: string) => ({
    sessionId, questionId, userResponse: ''
  }),
};
