"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubGradeType = exports.GradeType = exports.EvaluationPeriodPhase = exports.EvaluationPeriodStatus = void 0;
var EvaluationPeriodStatus;
(function (EvaluationPeriodStatus) {
    EvaluationPeriodStatus["WAITING"] = "waiting";
    EvaluationPeriodStatus["IN_PROGRESS"] = "in-progress";
    EvaluationPeriodStatus["COMPLETED"] = "completed";
})(EvaluationPeriodStatus || (exports.EvaluationPeriodStatus = EvaluationPeriodStatus = {}));
var EvaluationPeriodPhase;
(function (EvaluationPeriodPhase) {
    EvaluationPeriodPhase["WAITING"] = "waiting";
    EvaluationPeriodPhase["EVALUATION_SETUP"] = "evaluation-setup";
    EvaluationPeriodPhase["PERFORMANCE"] = "performance";
    EvaluationPeriodPhase["SELF_EVALUATION"] = "self-evaluation";
    EvaluationPeriodPhase["PEER_EVALUATION"] = "peer-evaluation";
    EvaluationPeriodPhase["CLOSURE"] = "closure";
})(EvaluationPeriodPhase || (exports.EvaluationPeriodPhase = EvaluationPeriodPhase = {}));
var GradeType;
(function (GradeType) {
    GradeType["S"] = "S";
    GradeType["A"] = "A";
    GradeType["B"] = "B";
    GradeType["C"] = "C";
    GradeType["F"] = "F";
})(GradeType || (exports.GradeType = GradeType = {}));
var SubGradeType;
(function (SubGradeType) {
    SubGradeType["PLUS"] = "plus";
    SubGradeType["NONE"] = "none";
    SubGradeType["MINUS"] = "minus";
})(SubGradeType || (exports.SubGradeType = SubGradeType = {}));
//# sourceMappingURL=evaluation-period.types.js.map