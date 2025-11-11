"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationResponseTypeLabels = exports.EvaluationResponseType = void 0;
var EvaluationResponseType;
(function (EvaluationResponseType) {
    EvaluationResponseType["SELF"] = "self";
    EvaluationResponseType["PEER"] = "peer";
    EvaluationResponseType["ADDITIONAL"] = "additional";
    EvaluationResponseType["DOWNWARD"] = "downward";
})(EvaluationResponseType || (exports.EvaluationResponseType = EvaluationResponseType = {}));
exports.EvaluationResponseTypeLabels = {
    [EvaluationResponseType.SELF]: '자기평가',
    [EvaluationResponseType.PEER]: '동료평가',
    [EvaluationResponseType.ADDITIONAL]: '추가평가',
    [EvaluationResponseType.DOWNWARD]: '하향평가',
};
//# sourceMappingURL=evaluation-response.types.js.map