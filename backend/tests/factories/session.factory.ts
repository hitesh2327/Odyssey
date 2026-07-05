export const sessionFactory = {
  valid: (topicIds: string[]) => ({ topicIds, difficulty: 'INTERMEDIATE' }),
  withBeginner: (topicIds: string[]) => ({ topicIds, difficulty: 'BEGINNER' }),
  withTooManyTopics: (topicIds: string[]) => ({ topicIds, difficulty: 'INTERMEDIATE' }),
  withInvalidDifficulty: (topicIds: string[]) => ({ topicIds, difficulty: 'EXPERT' }),
  withDuplicateTopics: (topicId: string) => ({
    topicIds: [topicId, topicId], difficulty: 'INTERMEDIATE'
  }),
};
