import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Common Domain
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';

// Core Domain - Phase 2
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';

// Core Domain - Phase 3
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';

// Core Domain - Phase 4
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';

// Core Domain - Phase 5
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';

// Sub Domain - Phase 6
import { QuestionGroup } from '@domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '@domain/sub/evaluation-question/evaluation-question.entity';
import { QuestionGroupMapping } from '@domain/sub/question-group-mapping/question-group-mapping.entity';

// Core Domain - Phase 7
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';

// Sub Domain - Phase 8
import { EvaluationResponse } from '@domain/sub/evaluation-response/evaluation-response.entity';

export class GetSeedDataStatusQuery {}

export interface SeedDataStatus {
  hasData: boolean;
  entityCounts: Record<string, number>;
}

@Injectable()
@QueryHandler(GetSeedDataStatusQuery)
export class GetSeedDataStatusHandler
  implements IQueryHandler<GetSeedDataStatusQuery, SeedDataStatus>
{
  private readonly logger = new Logger(GetSeedDataStatusHandler.name);

  constructor(
    // Phase 1
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,

    // Phase 2-3
    @InjectRepository(EvaluationPeriod)
    private readonly periodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,

    // Phase 4
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsCriteriaRepository: Repository<WbsEvaluationCriteria>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,

    // Phase 5
    @InjectRepository(Deliverable)
    private readonly deliverableRepository: Repository<Deliverable>,

    // Phase 6
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepository: Repository<QuestionGroup>,
    @InjectRepository(EvaluationQuestion)
    private readonly evaluationQuestionRepository: Repository<EvaluationQuestion>,
    @InjectRepository(QuestionGroupMapping)
    private readonly questionGroupMappingRepository: Repository<QuestionGroupMapping>,

    // Phase 7
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    @InjectRepository(PeerEvaluation)
    private readonly peerEvaluationRepository: Repository<PeerEvaluation>,
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,

    // Phase 8
    @InjectRepository(EvaluationResponse)
    private readonly evaluationResponseRepository: Repository<EvaluationResponse>,
  ) {}

  async execute(query: GetSeedDataStatusQuery): Promise<SeedDataStatus> {
    this.logger.log('시드 데이터 상태 조회');

    const counts = await Promise.all([
      // Phase 1
      this.departmentRepository.count(),
      this.employeeRepository.count(),
      this.projectRepository.count(),
      this.wbsItemRepository.count(),

      // Phase 2-3
      this.periodRepository.count(),
      this.mappingRepository.count(),
      this.projectAssignmentRepository.count(),
      this.wbsAssignmentRepository.count(),

      // Phase 4
      this.wbsCriteriaRepository.count(),
      this.evaluationLineRepository.count(),
      this.evaluationLineMappingRepository.count(),

      // Phase 5
      this.deliverableRepository.count(),

      // Phase 6
      this.questionGroupRepository.count(),
      this.evaluationQuestionRepository.count(),
      this.questionGroupMappingRepository.count(),

      // Phase 7
      this.wbsSelfEvaluationRepository.count(),
      this.downwardEvaluationRepository.count(),
      this.peerEvaluationRepository.count(),
      this.finalEvaluationRepository.count(),

      // Phase 8
      this.evaluationResponseRepository.count(),
    ]);

    const entityCounts = {
      // Phase 1
      Department: counts[0],
      Employee: counts[1],
      Project: counts[2],
      WbsItem: counts[3],

      // Phase 2-3
      EvaluationPeriod: counts[4],
      EvaluationPeriodEmployeeMapping: counts[5],
      EvaluationProjectAssignment: counts[6],
      EvaluationWbsAssignment: counts[7],

      // Phase 4
      WbsEvaluationCriteria: counts[8],
      EvaluationLine: counts[9],
      EvaluationLineMapping: counts[10],

      // Phase 5
      Deliverable: counts[11],

      // Phase 6
      QuestionGroup: counts[12],
      EvaluationQuestion: counts[13],
      QuestionGroupMapping: counts[14],

      // Phase 7
      WbsSelfEvaluation: counts[15],
      DownwardEvaluation: counts[16],
      PeerEvaluation: counts[17],
      FinalEvaluation: counts[18],

      // Phase 8
      EvaluationResponse: counts[19],
    };

    const hasData = Object.values(entityCounts).some((count) => count > 0);

    return {
      hasData,
      entityCounts,
    };
  }
}
