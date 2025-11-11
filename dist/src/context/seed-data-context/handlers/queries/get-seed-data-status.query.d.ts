import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { QuestionGroup } from '@domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '@domain/sub/evaluation-question/evaluation-question.entity';
import { QuestionGroupMapping } from '@domain/sub/question-group-mapping/question-group-mapping.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { EvaluationResponse } from '@domain/sub/evaluation-response/evaluation-response.entity';
export declare class GetSeedDataStatusQuery {
}
export interface SeedDataStatus {
    hasData: boolean;
    entityCounts: Record<string, number>;
}
export declare class GetSeedDataStatusHandler implements IQueryHandler<GetSeedDataStatusQuery, SeedDataStatus> {
    private readonly departmentRepository;
    private readonly employeeRepository;
    private readonly projectRepository;
    private readonly wbsItemRepository;
    private readonly periodRepository;
    private readonly mappingRepository;
    private readonly projectAssignmentRepository;
    private readonly wbsAssignmentRepository;
    private readonly wbsCriteriaRepository;
    private readonly evaluationLineRepository;
    private readonly evaluationLineMappingRepository;
    private readonly deliverableRepository;
    private readonly questionGroupRepository;
    private readonly evaluationQuestionRepository;
    private readonly questionGroupMappingRepository;
    private readonly wbsSelfEvaluationRepository;
    private readonly downwardEvaluationRepository;
    private readonly peerEvaluationRepository;
    private readonly finalEvaluationRepository;
    private readonly evaluationResponseRepository;
    private readonly logger;
    constructor(departmentRepository: Repository<Department>, employeeRepository: Repository<Employee>, projectRepository: Repository<Project>, wbsItemRepository: Repository<WbsItem>, periodRepository: Repository<EvaluationPeriod>, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, projectAssignmentRepository: Repository<EvaluationProjectAssignment>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, wbsCriteriaRepository: Repository<WbsEvaluationCriteria>, evaluationLineRepository: Repository<EvaluationLine>, evaluationLineMappingRepository: Repository<EvaluationLineMapping>, deliverableRepository: Repository<Deliverable>, questionGroupRepository: Repository<QuestionGroup>, evaluationQuestionRepository: Repository<EvaluationQuestion>, questionGroupMappingRepository: Repository<QuestionGroupMapping>, wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>, downwardEvaluationRepository: Repository<DownwardEvaluation>, peerEvaluationRepository: Repository<PeerEvaluation>, finalEvaluationRepository: Repository<FinalEvaluation>, evaluationResponseRepository: Repository<EvaluationResponse>);
    execute(query: GetSeedDataStatusQuery): Promise<SeedDataStatus>;
}
