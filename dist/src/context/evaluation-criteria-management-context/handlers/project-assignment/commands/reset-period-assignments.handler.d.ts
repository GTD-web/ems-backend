import { ICommandHandler } from '@nestjs/cqrs';
import { DataSource, Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
export interface ResetPeriodAssignmentsResult {
    periodId: string;
    deletedCounts: {
        peerEvaluationQuestionMappings: number;
        peerEvaluations: number;
        downwardEvaluations: number;
        selfEvaluations: number;
        wbsAssignments: number;
        projectAssignments: number;
        evaluationLineMappings: number;
        deliverableMappings: number;
    };
    message: string;
}
export declare class ResetPeriodAssignmentsCommand {
    readonly periodId: string;
    readonly resetBy: string;
    constructor(periodId: string, resetBy: string);
}
export declare class ResetPeriodAssignmentsHandler implements ICommandHandler<ResetPeriodAssignmentsCommand> {
    private readonly dataSource;
    private readonly projectAssignmentRepository;
    private readonly projectAssignmentService;
    private readonly wbsAssignmentService;
    private readonly selfEvaluationService;
    private readonly downwardEvaluationService;
    private readonly peerEvaluationService;
    private readonly evaluationLineMappingService;
    private readonly deliverableService;
    private readonly peerEvaluationQuestionMappingService;
    private readonly logger;
    constructor(dataSource: DataSource, projectAssignmentRepository: Repository<EvaluationProjectAssignment>, projectAssignmentService: EvaluationProjectAssignmentService, wbsAssignmentService: EvaluationWbsAssignmentService, selfEvaluationService: WbsSelfEvaluationService, downwardEvaluationService: DownwardEvaluationService, peerEvaluationService: PeerEvaluationService, evaluationLineMappingService: EvaluationLineMappingService, deliverableService: DeliverableService, peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService);
    execute(command: ResetPeriodAssignmentsCommand): Promise<ResetPeriodAssignmentsResult>;
}
