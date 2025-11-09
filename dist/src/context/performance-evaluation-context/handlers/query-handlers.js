"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryHandlers = void 0;
const get_employee_self_evaluations_handler_1 = require("./self-evaluation/queries/get-employee-self-evaluations.handler");
const get_wbs_self_evaluation_detail_handler_1 = require("./self-evaluation/queries/get-wbs-self-evaluation-detail.handler");
const peer_evaluation_1 = require("./peer-evaluation");
const downward_evaluation_1 = require("./downward-evaluation");
const final_evaluation_1 = require("./final-evaluation");
const deliverable_1 = require("./deliverable");
exports.QueryHandlers = [
    get_employee_self_evaluations_handler_1.GetEmployeeSelfEvaluationsHandler,
    get_wbs_self_evaluation_detail_handler_1.GetWbsSelfEvaluationDetailHandler,
    peer_evaluation_1.GetPeerEvaluationListHandler,
    peer_evaluation_1.GetPeerEvaluationDetailHandler,
    peer_evaluation_1.GetEvaluatorAssignedEvaluateesHandler,
    peer_evaluation_1.GetPeerEvaluationQuestionsHandler,
    downward_evaluation_1.GetDownwardEvaluationListHandler,
    downward_evaluation_1.GetDownwardEvaluationDetailHandler,
    final_evaluation_1.GetFinalEvaluationHandler,
    final_evaluation_1.GetFinalEvaluationListHandler,
    final_evaluation_1.GetFinalEvaluationByEmployeePeriodHandler,
    deliverable_1.GetEmployeeDeliverablesHandler,
    deliverable_1.GetWbsDeliverablesHandler,
    deliverable_1.GetDeliverableDetailHandler,
];
//# sourceMappingURL=query-handlers.js.map