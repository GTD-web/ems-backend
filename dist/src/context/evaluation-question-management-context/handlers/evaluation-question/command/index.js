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
exports.EVALUATION_QUESTION_COMMAND_HANDLERS = void 0;
__exportStar(require("./create-evaluation-question.handler"), exports);
__exportStar(require("./update-evaluation-question.handler"), exports);
__exportStar(require("./delete-evaluation-question.handler"), exports);
__exportStar(require("./copy-evaluation-question.handler"), exports);
const create_evaluation_question_handler_1 = require("./create-evaluation-question.handler");
const update_evaluation_question_handler_1 = require("./update-evaluation-question.handler");
const delete_evaluation_question_handler_1 = require("./delete-evaluation-question.handler");
const copy_evaluation_question_handler_1 = require("./copy-evaluation-question.handler");
exports.EVALUATION_QUESTION_COMMAND_HANDLERS = [
    create_evaluation_question_handler_1.CreateEvaluationQuestionHandler,
    update_evaluation_question_handler_1.UpdateEvaluationQuestionHandler,
    delete_evaluation_question_handler_1.DeleteEvaluationQuestionHandler,
    copy_evaluation_question_handler_1.CopyEvaluationQuestionHandler,
];
//# sourceMappingURL=index.js.map