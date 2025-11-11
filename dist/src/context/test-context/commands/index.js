"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMAND_HANDLERS = void 0;
__exportStar(require("./create-complete-test-environment.handler"), exports);
__exportStar(require("./create-test-question-groups.handler"), exports);
__exportStar(require("./create-test-questions.handler"), exports);
__exportStar(require("./map-questions-to-group.handler"), exports);
__exportStar(require("./cleanup-test-data.handler"), exports);
__exportStar(require("./cleanup-evaluation-question-data.handler"), exports);
const create_complete_test_environment_handler_1 = require("./create-complete-test-environment.handler");
const create_test_question_groups_handler_1 = require("./create-test-question-groups.handler");
const create_test_questions_handler_1 = require("./create-test-questions.handler");
const map_questions_to_group_handler_1 = require("./map-questions-to-group.handler");
const cleanup_test_data_handler_1 = require("./cleanup-test-data.handler");
const cleanup_evaluation_question_data_handler_1 = require("./cleanup-evaluation-question-data.handler");
exports.COMMAND_HANDLERS = [
    create_complete_test_environment_handler_1.CreateCompleteTestEnvironmentHandler,
    create_test_question_groups_handler_1.CreateTestQuestionGroupsHandler,
    create_test_questions_handler_1.CreateTestQuestionsHandler,
    map_questions_to_group_handler_1.MapQuestionsToGroupHandler,
    cleanup_test_data_handler_1.CleanupTestDataHandler,
    cleanup_evaluation_question_data_handler_1.CleanupEvaluationQuestionDataHandler,
];
//# sourceMappingURL=index.js.map