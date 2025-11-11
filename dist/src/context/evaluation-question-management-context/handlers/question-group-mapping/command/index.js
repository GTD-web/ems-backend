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
exports.QUESTION_GROUP_MAPPING_COMMAND_HANDLERS = void 0;
__exportStar(require("./add-question-to-group.handler"), exports);
__exportStar(require("./remove-question-from-group.handler"), exports);
__exportStar(require("./update-question-display-order.handler"), exports);
__exportStar(require("./move-question-up.handler"), exports);
__exportStar(require("./move-question-down.handler"), exports);
__exportStar(require("./add-multiple-questions-to-group.handler"), exports);
__exportStar(require("./reorder-group-questions.handler"), exports);
const add_question_to_group_handler_1 = require("./add-question-to-group.handler");
const remove_question_from_group_handler_1 = require("./remove-question-from-group.handler");
const update_question_display_order_handler_1 = require("./update-question-display-order.handler");
const move_question_up_handler_1 = require("./move-question-up.handler");
const move_question_down_handler_1 = require("./move-question-down.handler");
const add_multiple_questions_to_group_handler_1 = require("./add-multiple-questions-to-group.handler");
const reorder_group_questions_handler_1 = require("./reorder-group-questions.handler");
exports.QUESTION_GROUP_MAPPING_COMMAND_HANDLERS = [
    add_question_to_group_handler_1.AddQuestionToGroupHandler,
    remove_question_from_group_handler_1.RemoveQuestionFromGroupHandler,
    update_question_display_order_handler_1.UpdateQuestionDisplayOrderHandler,
    move_question_up_handler_1.MoveQuestionUpHandler,
    move_question_down_handler_1.MoveQuestionDownHandler,
    add_multiple_questions_to_group_handler_1.AddMultipleQuestionsToGroupHandler,
    reorder_group_questions_handler_1.ReorderGroupQuestionsHandler,
];
//# sourceMappingURL=index.js.map