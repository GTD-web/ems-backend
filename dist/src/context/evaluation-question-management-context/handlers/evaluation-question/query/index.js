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
exports.EVALUATION_QUESTION_QUERY_HANDLERS = void 0;
__exportStar(require("./get-evaluation-question.handler"), exports);
__exportStar(require("./get-evaluation-questions.handler"), exports);
const get_evaluation_question_handler_1 = require("./get-evaluation-question.handler");
const get_evaluation_questions_handler_1 = require("./get-evaluation-questions.handler");
exports.EVALUATION_QUESTION_QUERY_HANDLERS = [
    get_evaluation_question_handler_1.GetEvaluationQuestionHandler,
    get_evaluation_questions_handler_1.GetEvaluationQuestionsHandler,
];
//# sourceMappingURL=index.js.map