// 커맨드 클래스 export
export * from './create-complete-test-environment.handler';
export * from './create-test-question-groups.handler';
export * from './create-test-questions.handler';
export * from './map-questions-to-group.handler';
export * from './cleanup-test-data.handler';
export * from './cleanup-evaluation-question-data.handler';

// 핸들러 import
import { CreateCompleteTestEnvironmentHandler } from './create-complete-test-environment.handler';
import { CreateTestQuestionGroupsHandler } from './create-test-question-groups.handler';
import { CreateTestQuestionsHandler } from './create-test-questions.handler';
import { MapQuestionsToGroupHandler } from './map-questions-to-group.handler';
import { CleanupTestDataHandler } from './cleanup-test-data.handler';
import { CleanupEvaluationQuestionDataHandler } from './cleanup-evaluation-question-data.handler';

export const COMMAND_HANDLERS = [
  CreateCompleteTestEnvironmentHandler,
  CreateTestQuestionGroupsHandler,
  CreateTestQuestionsHandler,
  MapQuestionsToGroupHandler,
  CleanupTestDataHandler,
  CleanupEvaluationQuestionDataHandler,
];
