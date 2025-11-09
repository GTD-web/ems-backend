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
exports.QUERY_HANDLERS = exports.COMMAND_HANDLERS = void 0;
__exportStar(require("./question-group"), exports);
__exportStar(require("./evaluation-question"), exports);
__exportStar(require("./question-group-mapping"), exports);
__exportStar(require("./evaluation-response"), exports);
const question_group_1 = require("./question-group");
const evaluation_question_1 = require("./evaluation-question");
const question_group_mapping_1 = require("./question-group-mapping");
const evaluation_response_1 = require("./evaluation-response");
exports.COMMAND_HANDLERS = [
    ...question_group_1.QUESTION_GROUP_COMMAND_HANDLERS,
    ...evaluation_question_1.EVALUATION_QUESTION_COMMAND_HANDLERS,
    ...question_group_mapping_1.QUESTION_GROUP_MAPPING_COMMAND_HANDLERS,
    ...evaluation_response_1.EVALUATION_RESPONSE_COMMAND_HANDLERS,
];
exports.QUERY_HANDLERS = [
    ...question_group_1.QUESTION_GROUP_QUERY_HANDLERS,
    ...evaluation_question_1.EVALUATION_QUESTION_QUERY_HANDLERS,
    ...question_group_mapping_1.QUESTION_GROUP_MAPPING_QUERY_HANDLERS,
    ...evaluation_response_1.EVALUATION_RESPONSE_QUERY_HANDLERS,
];
//# sourceMappingURL=index.js.map