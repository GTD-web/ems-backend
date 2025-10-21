import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeedScenario } from '../../types';

// Common Domain
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';

// Core Domain - Phase 2-3
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
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

export class ClearSeedDataCommand {
  constructor(public readonly scenario?: SeedScenario) {}
}

@Injectable()
@CommandHandler(ClearSeedDataCommand)
export class ClearSeedDataHandler
  implements ICommandHandler<ClearSeedDataCommand, void>
{
  private readonly logger = new Logger(ClearSeedDataHandler.name);

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

  async execute(command: ClearSeedDataCommand): Promise<void> {
    const scenario = command.scenario || SeedScenario.FULL;
    this.logger.log(`시드 데이터 삭제 시작 - 시나리오: ${scenario}`);

    try {
      switch (scenario) {
        case SeedScenario.MINIMAL:
          await this.clearPhase1();
          break;

        case SeedScenario.WITH_PERIOD:
          await this.clearPhase2();
          await this.clearPhase1();
          break;

        case SeedScenario.WITH_ASSIGNMENTS:
          await this.clearPhase3();
          await this.clearPhase2();
          await this.clearPhase1();
          break;

        case SeedScenario.WITH_SETUP:
          await this.clearPhase6();
          await this.clearPhase5();
          await this.clearPhase4();
          await this.clearPhase3();
          await this.clearPhase2();
          await this.clearPhase1();
          break;

        case SeedScenario.FULL:
          await this.clearPhase8();
          await this.clearPhase7();
          await this.clearPhase6();
          await this.clearPhase5();
          await this.clearPhase4();
          await this.clearPhase3();
          await this.clearPhase2();
          await this.clearPhase1();
          break;
      }

      this.logger.log('시드 데이터 삭제 완료');
    } catch (error) {
      this.logger.error('시드 데이터 삭제 실패', error.stack);
      throw error;
    }
  }

  private async clearPhase1(): Promise<void> {
    this.logger.log('Phase 1 데이터 삭제 중...');

    // 역순 삭제: WbsItem → Project → Employee → Department
    await this.wbsItemRepository.createQueryBuilder().delete().execute();
    this.logger.log('WbsItem 삭제 완료');

    await this.projectRepository.createQueryBuilder().delete().execute();
    this.logger.log('Project 삭제 완료');

    await this.employeeRepository.createQueryBuilder().delete().execute();
    this.logger.log('Employee 삭제 완료');

    await this.departmentRepository.createQueryBuilder().delete().execute();
    this.logger.log('Department 삭제 완료');
  }

  private async clearPhase2(): Promise<void> {
    this.logger.log('Phase 2 데이터 삭제 중...');

    await this.mappingRepository.createQueryBuilder().delete().execute();
    this.logger.log('EvaluationPeriodEmployeeMapping 삭제 완료');

    await this.periodRepository.createQueryBuilder().delete().execute();
    this.logger.log('EvaluationPeriod 삭제 완료');
  }

  private async clearPhase3(): Promise<void> {
    this.logger.log('Phase 3 데이터 삭제 중...');

    await this.wbsAssignmentRepository.createQueryBuilder().delete().execute();
    this.logger.log('EvaluationWbsAssignment 삭제 완료');

    await this.projectAssignmentRepository
      .createQueryBuilder()
      .delete()
      .execute();
    this.logger.log('EvaluationProjectAssignment 삭제 완료');
  }

  private async clearPhase4(): Promise<void> {
    this.logger.log('Phase 4 데이터 삭제 중...');

    await this.evaluationLineMappingRepository
      .createQueryBuilder()
      .delete()
      .execute();
    this.logger.log('EvaluationLineMapping 삭제 완료');

    await this.evaluationLineRepository.createQueryBuilder().delete().execute();
    this.logger.log('EvaluationLine 삭제 완료');

    await this.wbsCriteriaRepository.createQueryBuilder().delete().execute();
    this.logger.log('WbsEvaluationCriteria 삭제 완료');
  }

  private async clearPhase5(): Promise<void> {
    this.logger.log('Phase 5 데이터 삭제 중...');

    await this.deliverableRepository.createQueryBuilder().delete().execute();
    this.logger.log('Deliverable 삭제 완료');
  }

  private async clearPhase6(): Promise<void> {
    this.logger.log('Phase 6 데이터 삭제 중...');

    await this.questionGroupMappingRepository
      .createQueryBuilder()
      .delete()
      .execute();
    this.logger.log('QuestionGroupMapping 삭제 완료');

    await this.evaluationQuestionRepository
      .createQueryBuilder()
      .delete()
      .execute();
    this.logger.log('EvaluationQuestion 삭제 완료');

    await this.questionGroupRepository.createQueryBuilder().delete().execute();
    this.logger.log('QuestionGroup 삭제 완료');
  }

  private async clearPhase7(): Promise<void> {
    this.logger.log('Phase 7 데이터 삭제 중...');

    await this.finalEvaluationRepository
      .createQueryBuilder()
      .delete()
      .execute();
    this.logger.log('FinalEvaluation 삭제 완료');

    await this.peerEvaluationRepository.createQueryBuilder().delete().execute();
    this.logger.log('PeerEvaluation 삭제 완료');

    await this.downwardEvaluationRepository
      .createQueryBuilder()
      .delete()
      .execute();
    this.logger.log('DownwardEvaluation 삭제 완료');

    await this.wbsSelfEvaluationRepository
      .createQueryBuilder()
      .delete()
      .execute();
    this.logger.log('WbsSelfEvaluation 삭제 완료');
  }

  private async clearPhase8(): Promise<void> {
    this.logger.log('Phase 8 데이터 삭제 중...');

    await this.evaluationResponseRepository
      .createQueryBuilder()
      .delete()
      .execute();
    this.logger.log('EvaluationResponse 삭제 완료');
  }
}
