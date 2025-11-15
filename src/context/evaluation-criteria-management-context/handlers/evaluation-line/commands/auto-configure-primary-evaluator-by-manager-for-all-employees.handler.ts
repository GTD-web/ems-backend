import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull } from 'typeorm';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationLineService } from '@domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';

/**
 * 평가기간의 모든 직원에 대한 managerId 기반 1차 평가자 자동 구성 커맨드
 */
export class AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand {
  constructor(
    public readonly periodId: string, // 평가기간 ID
    public readonly createdBy: string, // 생성자 ID
  ) {}
}

/**
 * 평가기간의 모든 직원에 대한 managerId 기반 1차 평가자 자동 구성 결과
 */
export interface AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesResult {
  message: string;
  totalEmployees: number; // 처리 대상 직원 수
  successCount: number; // 성공한 직원 수
  skippedCount: number; // 건너뛴 직원 수 (managerId가 없는 경우)
  failedCount: number; // 실패한 직원 수
  totalCreatedMappings: number; // 전체 생성된 매핑 수
  results: Array<{
    employeeId: string;
    success: boolean;
    message: string;
    createdMappings: number;
    error?: string;
  }>;
}

/**
 * 평가기간의 모든 직원에 대한 managerId 기반 1차 평가자 자동 구성 커맨드 핸들러
 *
 * 평가기간에 등록된 모든 직원에 대해 Employee 엔티티의 managerId를 기반으로
 * 1차 평가라인을 자동으로 구성합니다.
 * 기존 1차 평가라인 매핑을 완전히 제거하고 새로 지정합니다.
 */
@CommandHandler(AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand)
export class AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler
  implements
    ICommandHandler<
      AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand,
      AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesResult
    >
{
  private readonly logger = new Logger(
    AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler.name,
  );

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    private readonly employeeService: EmployeeService,
    private readonly evaluationLineService: EvaluationLineService,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    command: AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand,
  ): Promise<AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesResult> {
    const { periodId, createdBy } = command;

    this.logger.log(
      `평가기간의 모든 직원에 대한 managerId 기반 1차 평가자 자동 구성 시작 - 평가기간: ${periodId}`,
    );

    // 트랜잭션으로 처리하여 원자성 보장
    return await this.dataSource.transaction(async (manager) => {
      try {
        // 1. 평가기간의 모든 평가 대상자 조회
        const mappings =
          await this.evaluationPeriodEmployeeMappingService.평가기간의_평가대상자를_조회한다(
            periodId,
            false, // 제외된 대상자는 제외
          );

        if (mappings.length === 0) {
          this.logger.warn(
            `평가기간에 등록된 직원이 없습니다 - 평가기간: ${periodId}`,
          );
          return {
            message: '평가기간에 등록된 직원이 없습니다.',
            totalEmployees: 0,
            successCount: 0,
            skippedCount: 0,
            failedCount: 0,
            totalCreatedMappings: 0,
            results: [],
          };
        }

        const employeeIds = mappings.map((m) => m.employeeId);
        this.logger.log(
          `평가기간의 평가 대상자 수: ${employeeIds.length} - 평가기간: ${periodId}`,
        );

        // 2. 1차 평가 라인 조회 또는 생성 (한 번만 수행)
        const evaluationLines = await this.evaluationLineService.필터_조회한다({
          evaluatorType: EvaluatorType.PRIMARY,
          orderFrom: 1,
          orderTo: 1,
        });

        let primaryEvaluationLine;
        if (evaluationLines.length > 0) {
          primaryEvaluationLine = evaluationLines[0];
        } else {
          primaryEvaluationLine = await this.evaluationLineService.생성한다({
            evaluatorType: EvaluatorType.PRIMARY,
            order: 1,
            isRequired: true,
            isAutoAssigned: false,
          });
        }

        const evaluationLineId = primaryEvaluationLine.DTO로_변환한다().id;

        // 3. 모든 직원 정보 수집 (employeeId, evaluatorId)
        // managerId는 외부 시스템 ID(externalId)이므로, 내부 Employee id로 변환 필요
        const employeeDataMap = new Map<
          string,
          { employeeId: string; evaluatorId: string }
        >();
        const results: Array<{
          employeeId: string;
          success: boolean;
          message: string;
          createdMappings: number;
          error?: string;
        }> = [];

        let failedCount = 0;
        let skippedCount = 0;

        for (const employeeId of employeeIds) {
          try {
            const employee =
              await this.employeeService.ID로_조회한다(employeeId);
            if (!employee) {
              failedCount++;
              results.push({
                employeeId,
                success: false,
                message: `직원을 찾을 수 없습니다`,
                createdMappings: 0,
                error: `직원을 찾을 수 없습니다: ${employeeId}`,
              });
              continue;
            }

            if (!employee.managerId) {
              skippedCount++;
              results.push({
                employeeId,
                success: true,
                message:
                  '직원의 관리자가 설정되지 않아 1차 평가자를 구성할 수 없습니다.',
                createdMappings: 0,
              });
              continue;
            }

            // managerId는 외부 시스템 ID(externalId)이므로, 내부 Employee id로 변환
            const managerEmployee = await this.employeeService.findByExternalId(
              employee.managerId,
            );
            if (!managerEmployee) {
              skippedCount++;
              results.push({
                employeeId,
                success: true,
                message: `관리자(managerId: ${employee.managerId})를 찾을 수 없어 1차 평가자를 구성할 수 없습니다.`,
                createdMappings: 0,
              });
              continue;
            }

            employeeDataMap.set(employeeId, {
              employeeId,
              evaluatorId: managerEmployee.id, // 내부 Employee id 사용
            });
          } catch (error) {
            failedCount++;
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.logger.error(`직원 ${employeeId} 조회 실패`, error.stack);
            results.push({
              employeeId,
              success: false,
              message: `직원 조회 실패`,
              createdMappings: 0,
              error: errorMessage,
            });
          }
        }

        const validEmployeeIds = Array.from(employeeDataMap.keys());
        if (validEmployeeIds.length === 0) {
          this.logger.warn(
            `1차 평가자를 구성할 수 있는 직원이 없습니다 - 평가기간: ${periodId}`,
          );
          return {
            message: `1차 평가자를 구성할 수 있는 직원이 없습니다.`,
            totalEmployees: employeeIds.length,
            successCount: 0,
            skippedCount,
            failedCount,
            totalCreatedMappings: 0,
            results,
          };
        }

        // 4. 기존 1차 평가라인 매핑 벌크 조회 및 삭제
        const mappingRepository = manager.getRepository(EvaluationLineMapping);
        const existingMappings = await mappingRepository.find({
          where: {
            evaluationPeriodId: periodId,
            employeeId: In(validEmployeeIds),
            evaluationLineId,
            wbsItemId: IsNull(),
            deletedAt: IsNull(),
          },
        });

        if (existingMappings.length > 0) {
          const now = new Date();
          for (const mapping of existingMappings) {
            mapping.deletedAt = now;
            mapping.수정자를_설정한다(createdBy);
          }
          await mappingRepository.save(existingMappings);
          this.logger.log(
            `기존 1차 평가자 매핑 벌크 삭제 완료 - 삭제된 매핑 수: ${existingMappings.length}`,
          );
        }

        // 5. 새 매핑 벌크 생성
        const newMappings = validEmployeeIds.map((employeeId) => {
          const employeeData = employeeDataMap.get(employeeId)!;
          const mapping = mappingRepository.create({
            evaluationPeriodId: periodId,
            employeeId,
            evaluatorId: employeeData.evaluatorId, // 내부 Employee id 사용
            wbsItemId: undefined, // 직원별 고정 담당자이므로 WBS와 무관
            evaluationLineId,
            createdBy,
          });
          return mapping;
        });

        const savedMappings = await mappingRepository.save(newMappings);
        this.logger.log(
          `새 1차 평가자 매핑 벌크 생성 완료 - 생성된 매핑 수: ${savedMappings.length}`,
        );

        // 6. 결과 생성
        const successCount = savedMappings.length;
        const totalCreatedMappings = savedMappings.length;

        for (const employeeId of validEmployeeIds) {
          results.push({
            employeeId,
            success: true,
            message: `직원 ${employeeId}의 1차 평가자(관리자) 자동 구성이 완료되었습니다.`,
            createdMappings: 1,
          });
        }

        this.logger.log(
          `평가기간의 모든 직원에 대한 managerId 기반 1차 평가자 자동 구성 완료 - 평가기간: ${periodId}, 성공: ${successCount}, 건너뜀: ${skippedCount}, 실패: ${failedCount}`,
        );

        return {
          message: `평가기간의 모든 직원에 대한 1차 평가자(관리자) 자동 구성이 완료되었습니다.`,
          totalEmployees: employeeIds.length,
          successCount,
          skippedCount,
          failedCount,
          totalCreatedMappings,
          results,
        };
      } catch (error) {
        this.logger.error(
          `평가기간의 모든 직원에 대한 managerId 기반 1차 평가자 자동 구성 실패 - 평가기간: ${periodId}`,
          error.stack,
        );
        throw error;
      }
    });
  }
}
