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
exports.QUESTION_GROUP_MAPPING_QUERY_HANDLERS = void 0;
__exportStar(require("./get-group-questions.handler"), exports);
__exportStar(require("./get-question-groups-by-question.handler"), exports);
const get_group_questions_handler_1 = require("./get-group-questions.handler");
const get_question_groups_by_question_handler_1 = require("./get-question-groups-by-question.handler");
exports.QUESTION_GROUP_MAPPING_QUERY_HANDLERS = [
    get_group_questions_handler_1.GetGroupQuestionsHandler,
    get_question_groups_by_question_handler_1.GetQuestionGroupsByQuestionHandler,
];
//# sourceMappingURL=index.js.map