import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
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

export interface DeleteAllProjectAssignmentsResult {
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

/**
 * 모든 프로젝트 할당 삭제 커맨드
 */
export class DeleteAllProjectAssignmentsCommand {
  constructor(public readonly deletedBy: string) {}
}

/**
 * 모든 프로젝트 할당 삭제 핸들러
 *
 * 모든 평가기간의 모든 할당 및 평가 데이터를 삭제합니다:
 * - 동료평가 질문 매핑
 * - 동료평가
 * - 하향평가
 * - 자기평가
 * - 산출물 매핑
 * - WBS 할당
 * - 평가라인 매핑
 * - 프로젝트 할당
 *
 * 모든 삭제는 하나의 트랜잭션으로 처리되어 원자성을 보장합니다.
 */
@CommandHandler(DeleteAllProjectAssignmentsCommand)
@Injectable()
export class DeleteAllProjectAssignmentsHandler
  implements ICommandHandler<DeleteAllProjectAssignmentsCommand>
{
  private readonly logger = new Logger(DeleteAllProjectAssignmentsHandler.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly selfEvaluationService: WbsSelfEvaluationService,
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly peerEvaluationService: PeerEvaluationService,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
    private readonly deliverableService: DeliverableService,
    private readonly peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService,
  ) {}

  async execute(
    command: DeleteAllProjectAssignmentsCommand,
  ): Promise<DeleteAllProjectAssignmentsResult> {
    const { deletedBy } = command;

    this.logger.log('모든 프로젝트 할당 삭제 시작');

    return await this.dataSource.transaction(async (manager) => {
      const deletedCounts = {
        peerEvaluationQuestionMappings: 0,
        peerEvaluations: 0,
        downwardEvaluations: 0,
        selfEvaluations: 0,
        wbsAssignments: 0,
        projectAssignments: 0,
        evaluationLineMappings: 0,
        deliverableMappings: 0,
      };

      // 1. 동료평가 질문 매핑 삭제
      this.logger.log('1단계: 동료평가 질문 매핑 삭제 시작');
      const peerEvaluations = await this.peerEvaluationService.필터_조회한다(
        {},
      );
      for (const peerEval of peerEvaluations) {
        const mappings =
          await this.peerEvaluationQuestionMappingService.동료평가의_질문목록을_조회한다(
            peerEval.id,
          );
        if (mappings.length > 0) {
          await this.peerEvaluationQuestionMappingService.동료평가의_질문매핑을_전체삭제한다(
            peerEval.id,
            deletedBy,
          );
          deletedCounts.peerEvaluationQuestionMappings += mappings.length;
        }
      }

      // 2. 동료평가 삭제
      this.logger.log('2단계: 동료평가 삭제 시작');
      for (const peerEval of peerEvaluations) {
        await this.peerEvaluationService.삭제한다(peerEval.id, deletedBy);
        deletedCounts.peerEvaluations++;
      }

      // 3. 하향평가 삭제
      this.logger.log('3단계: 하향평가 삭제 시작');
      const downwardEvaluations =
        await this.downwardEvaluationService.필터_조회한다({});
      for (const downwardEval of downwardEvaluations) {
        await this.downwardEvaluationService.삭제한다(
          downwardEval.id,
          deletedBy,
        );
        deletedCounts.downwardEvaluations++;
      }

      // 4. 자기평가 삭제
      this.logger.log('4단계: 자기평가 삭제 시작');
      const selfEvaluations = await this.selfEvaluationService.필터_조회한다(
        {},
      );
      for (const selfEval of selfEvaluations) {
        await this.selfEvaluationService.삭제한다(selfEval.id, deletedBy);
        deletedCounts.selfEvaluations++;
      }

      // 5. 산출물 매핑 해제 (WBS 할당 삭제 전에 처리)
      this.logger.log('5단계: 산출물 매핑 해제 시작');
      const wbsAssignments = await this.wbsAssignmentService.필터_조회한다(
        {},
        manager,
      );
      for (const wbsAssignment of wbsAssignments) {
        // employeeId와 wbsItemId로 필터링하여 산출물 조회
        const deliverables = await this.deliverableService.필터_조회한다({
          employeeId: wbsAssignment.employeeId,
          wbsItemId: wbsAssignment.wbsItemId,
        });
        for (const deliverable of deliverables) {
          if (deliverable.employeeId || deliverable.wbsItemId) {
            await this.deliverableService.매핑을_해제한다(
              deliverable.id,
              deletedBy,
            );
            deletedCounts.deliverableMappings++;
          }
        }
      }

      // 6. WBS 할당 삭제
      this.logger.log('6단계: WBS 할당 삭제 시작');
      for (const wbsAssignment of wbsAssignments) {
        await this.wbsAssignmentService.삭제한다(
          wbsAssignment.id,
          deletedBy,
          manager,
        );
        deletedCounts.wbsAssignments++;
      }

      // 7. 평가라인 매핑 삭제
      this.logger.log('7단계: 평가라인 매핑 삭제 시작');
      const evaluationLineMappings =
        await this.evaluationLineMappingService.필터_조회한다({}, manager);
      for (const mapping of evaluationLineMappings) {
        await this.evaluationLineMappingService.삭제한다(
          mapping.DTO로_변환한다().id,
          deletedBy,
          manager,
        );
        deletedCounts.evaluationLineMappings++;
      }

      // 8. 프로젝트 할당 삭제
      this.logger.log('8단계: 프로젝트 할당 삭제 시작');
      const projectAssignments = await this.projectAssignmentRepository.find();
      for (const projectAssignment of projectAssignments) {
        await this.projectAssignmentService.삭제한다(
          projectAssignment.id,
          deletedBy,
          manager,
          { skipValidation: true }, // 삭제 시에는 비즈니스 규칙 검증 건너뜀
        );
        deletedCounts.projectAssignments++;
      }

      this.logger.log('모든 프로젝트 할당 삭제 완료', {
        deletedCounts,
      });

      return {
        deletedCounts,
        message: '모든 프로젝트 할당 데이터가 성공적으로 삭제되었습니다.',
      };
    });
  }
}


