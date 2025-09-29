import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { EvaluationPeriodService } from '../../domain/core/evaluation-period/evaluation-period.service';
import {
  EvaluationPeriodDto,
  EvaluationPeriodPhase,
  EvaluationPeriodStatus,
} from '../../domain/core/evaluation-period/evaluation-period.types';
import { EvaluationPeriodManagementService } from './evaluation-period-management.service';
import {
  CreateEvaluationPeriodMinimalDto,
  UpdateCriteriaSettingPermissionDto,
  UpdateEvaluationPeriodBasicDto,
  UpdateEvaluationPeriodScheduleDto,
  UpdateFinalEvaluationSettingPermissionDto,
  UpdateGradeRangesDto,
  UpdateManualSettingPermissionsDto,
  UpdateSelfEvaluationSettingPermissionDto,
} from './interfaces/evaluation-period-creation.interface';

describe('EvaluationPeriodManagementService Integration Tests', () => {
  let service: EvaluationPeriodManagementService;
  let dataSource: DataSource;
  let module: TestingModule;

  const testUserId = 'test-user-123';
  const adminUserId = 'admin-456';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<EvaluationPeriodManagementService>(
      EvaluationPeriodManagementService,
    );
    dataSource = module.get<DataSource>(DataSource);
    await module.init();
    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  });

  describe('평가 기간 생성 (CQRS)', () => {
    describe('평가기간_생성한다', () => {
      it('새로운 평가 기간을 생성할 수 있다', async () => {
        // Given
        const createData: CreateEvaluationPeriodMinimalDto = {
          name: '2024년 상반기 평가',
          description: '2024년 상반기 인사평가 기간',
          startDate: new Date('2024-01-01'),
          peerEvaluationDeadline: new Date('2024-06-30'),
          maxSelfEvaluationRate: 120,
          evaluationCriteria: [
            {
              name: '업무 성과',
              description: '담당 업무의 성과 달성도',
              weight: 40,
            },
            {
              name: '업무 역량',
              description: '업무 수행에 필요한 역량',
              weight: 30,
            },
            {
              name: '조직 기여도',
              description: '조직 발전에 대한 기여도',
              weight: 30,
            },
          ],
          gradeRanges: [
            { grade: 'S', minRange: 95, maxRange: 100 },
            { grade: 'A', minRange: 85, maxRange: 94 },
            { grade: 'B', minRange: 75, maxRange: 84 },
            { grade: 'C', minRange: 65, maxRange: 74 },
            { grade: 'F', minRange: 0, maxRange: 64 },
          ],
        };

        // When
        const result = await service.평가기간_생성한다(createData, testUserId);

        // Then
        expect(result).toBeDefined();
        expect(result.name).toBe(createData.name);
        expect(result.description).toBe(createData.description);
        expect(result.status).toBe(EvaluationPeriodStatus.WAITING);
        expect(result.currentPhase).toBe(EvaluationPeriodPhase.WAITING);
        expect(result.maxSelfEvaluationRate).toBe(120);
        expect(result.gradeRanges).toHaveLength(5);
        expect(result.createdAt).toBeDefined();
      });

      it('등급 구간 없이도 평가 기간을 생성할 수 있다', async () => {
        // Given
        const createData: CreateEvaluationPeriodMinimalDto = {
          name: '2024년 하반기 평가',
          startDate: new Date('2024-07-01'),
          peerEvaluationDeadline: new Date('2024-12-31'),
          maxSelfEvaluationRate: 110,
          evaluationCriteria: [
            {
              name: '업무 성과',
              weight: 50,
            },
            {
              name: '업무 역량',
              weight: 50,
            },
          ],
          gradeRanges: [],
        };

        // When
        const result = await service.평가기간_생성한다(createData, adminUserId);

        // Then
        expect(result).toBeDefined();
        expect(result.name).toBe('2024년 하반기 평가');
        expect(result.maxSelfEvaluationRate).toBe(110);
        expect(result.gradeRanges).toHaveLength(0);
        expect(result.createdAt).toBeDefined();
      });

      it('중복된 이름으로 생성 시 예외를 발생시킨다', async () => {
        // Given
        const createData: CreateEvaluationPeriodMinimalDto = {
          name: '중복 테스트 평가',
          startDate: new Date('2024-01-01'),
          peerEvaluationDeadline: new Date('2024-06-30'),
          maxSelfEvaluationRate: 120,
          evaluationCriteria: [{ name: '테스트 기준', weight: 100 }],
          gradeRanges: [],
        };

        await service.평가기간_생성한다(createData, testUserId);

        // When & Then
        await expect(
          service.평가기간_생성한다(createData, testUserId),
        ).rejects.toThrow();
      });
    });
  });

  describe('평가 기간 생명주기 관리 (CQRS)', () => {
    let createdPeriod: EvaluationPeriodDto;

    beforeEach(async () => {
      const createData: CreateEvaluationPeriodMinimalDto = {
        name: '생명주기 테스트 평가',
        description: '평가 기간 생명주기 테스트용',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        maxSelfEvaluationRate: 120,
        evaluationCriteria: [{ name: '업무 성과', weight: 100 }],
        gradeRanges: [],
      };
      createdPeriod = await service.평가기간_생성한다(createData, testUserId);
    });

    describe('평가기간_시작한다', () => {
      it('평가 기간을 시작할 수 있다', async () => {
        // When
        const result = await service.평가기간_시작한다(
          createdPeriod.id,
          adminUserId,
        );

        // Then
        expect(result).toBe(true);

        // 상태 확인
        const updatedPeriod = await service.평가기간상세_조회한다(
          createdPeriod.id,
        );
        expect(updatedPeriod!.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
        expect(updatedPeriod!.currentPhase).toBe(
          EvaluationPeriodPhase.EVALUATION_SETUP,
        );
      });

      it('이미 시작된 평가 기간을 다시 시작하려 하면 예외를 발생시킨다', async () => {
        // Given
        await service.평가기간_시작한다(createdPeriod.id, adminUserId);

        // When & Then
        await expect(
          service.평가기간_시작한다(createdPeriod.id, adminUserId),
        ).rejects.toThrow();
      });

      it('존재하지 않는 ID로 시작 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.평가기간_시작한다(
            '00000000-0000-0000-0000-000000000000',
            adminUserId,
          ),
        ).rejects.toThrow();
      });
    });

    describe('평가기간_완료한다', () => {
      it('종결 단계에서 평가 기간을 완료할 수 있다', async () => {
        // Given - 평가 기간을 종결 단계까지 진행
        await service.평가기간_시작한다(createdPeriod.id, adminUserId);
        // 실제 도메인 서비스를 통해 단계 변경 (CQRS에서는 단계 변경 커맨드가 없으므로 직접 호출)
        const domainService = module.get(EvaluationPeriodService);
        await domainService.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PERFORMANCE,
          adminUserId,
        );
        await domainService.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.SELF_EVALUATION,
          adminUserId,
        );
        await domainService.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PEER_EVALUATION,
          adminUserId,
        );
        await domainService.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.CLOSURE,
          adminUserId,
        );

        // When
        const result = await service.평가기간_완료한다(
          createdPeriod.id,
          adminUserId,
        );

        // Then
        expect(result).toBe(true);

        // 상태 확인
        const completedPeriod = await service.평가기간상세_조회한다(
          createdPeriod.id,
        );
        expect(completedPeriod!.status).toBe(EvaluationPeriodStatus.COMPLETED);
        expect(completedPeriod!.completedDate).toBeDefined();
      });

      it('종결 단계가 아닌 상태에서 완료하려 하면 예외를 발생시킨다', async () => {
        // Given
        await service.평가기간_시작한다(createdPeriod.id, adminUserId);

        // When & Then
        await expect(
          service.평가기간_완료한다(createdPeriod.id, adminUserId),
        ).rejects.toThrow();
      });
    });

    describe('평가기간_삭제한다', () => {
      it('평가 기간을 삭제할 수 있다', async () => {
        // When
        const result = await service.평가기간_삭제한다(
          createdPeriod.id,
          adminUserId,
        );

        // Then
        expect(result).toBe(true);

        // 삭제 확인
        const deletedPeriod = await service.평가기간상세_조회한다(
          createdPeriod.id,
        );
        expect(deletedPeriod).toBeNull();
      });

      it('존재하지 않는 ID로 삭제 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.평가기간_삭제한다(
            '00000000-0000-0000-0000-000000000000',
            adminUserId,
          ),
        ).rejects.toThrow();
      });
    });
  });

  describe('평가 기간 정보 수정 (CQRS)', () => {
    let createdPeriod: EvaluationPeriodDto;

    beforeEach(async () => {
      const createData: CreateEvaluationPeriodMinimalDto = {
        name: '수정 테스트 평가',
        description: '평가 기간 수정 테스트용',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        maxSelfEvaluationRate: 120,
        evaluationCriteria: [{ name: '업무 성과', weight: 100 }],
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 100 },
          { grade: 'B', minRange: 60, maxRange: 79 },
        ],
      };
      createdPeriod = await service.평가기간_생성한다(createData, testUserId);
    });

    describe('평가기간기본정보_수정한다', () => {
      it('평가 기간 기본 정보를 수정할 수 있다', async () => {
        // Given
        const updateData: UpdateEvaluationPeriodBasicDto = {
          name: '수정된 평가 기간명',
          description: '수정된 설명',
          maxSelfEvaluationRate: 150,
        };

        // When
        const result = await service.평가기간기본정보_수정한다(
          createdPeriod.id,
          updateData,
          adminUserId,
        );

        // Then
        expect(result.name).toBe('수정된 평가 기간명');
        expect(result.description).toBe('수정된 설명');
        expect(result.maxSelfEvaluationRate).toBe(150);
        expect(result.updatedAt).toBeDefined();
      });

      it('일부 필드만 수정할 수 있다', async () => {
        // Given
        const updateData: UpdateEvaluationPeriodBasicDto = {
          maxSelfEvaluationRate: 130,
        };

        // When
        const result = await service.평가기간기본정보_수정한다(
          createdPeriod.id,
          updateData,
          adminUserId,
        );

        // Then
        expect(result.maxSelfEvaluationRate).toBe(130); // 수정된 값
        expect(result.updatedAt).toBeDefined();

        // 상세 조회로 전체 정보 확인
        const detailResult = await service.평가기간상세_조회한다(
          createdPeriod.id,
        );
        expect(detailResult!.name).toBe('수정 테스트 평가'); // 기존 값 유지
        expect(detailResult!.maxSelfEvaluationRate).toBe(130); // 수정된 값
      });

      it('존재하지 않는 ID로 수정 시 예외를 발생시킨다', async () => {
        // Given
        const updateData: UpdateEvaluationPeriodBasicDto = {
          name: '수정된 이름',
        };

        // When & Then
        await expect(
          service.평가기간기본정보_수정한다(
            '00000000-0000-0000-0000-000000000000',
            updateData,
            adminUserId,
          ),
        ).rejects.toThrow();
      });
    });

    describe('평가기간일정_수정한다', () => {
      it('평가 기간 일정을 수정할 수 있다', async () => {
        // Given
        const scheduleData: UpdateEvaluationPeriodScheduleDto = {
          endDate: new Date('2024-12-31'),
          evaluationSetupDeadline: new Date('2024-01-31'),
          performanceDeadline: new Date('2024-10-31'),
          selfEvaluationDeadline: new Date('2024-11-30'),
          peerEvaluationDeadline: new Date('2024-12-31'),
        };

        // When
        const result = await service.평가기간일정_수정한다(
          createdPeriod.id,
          scheduleData,
          adminUserId,
        );

        // Then
        expect(result.endDate).toEqual(new Date('2024-12-31'));
        expect(result.evaluationSetupDeadline).toEqual(new Date('2024-01-31'));
        expect(result.performanceDeadline).toEqual(new Date('2024-10-31'));
        expect(result.selfEvaluationDeadline).toEqual(new Date('2024-11-30'));
        expect(result.peerEvaluationDeadline).toEqual(new Date('2024-12-31'));
        expect(result.updatedAt).toBeDefined();
      });

      it('일부 일정만 수정할 수 있다', async () => {
        // Given
        const scheduleData: UpdateEvaluationPeriodScheduleDto = {
          selfEvaluationDeadline: new Date('2024-05-31'),
        };

        // When
        const result = await service.평가기간일정_수정한다(
          createdPeriod.id,
          scheduleData,
          adminUserId,
        );

        // Then
        expect(result.selfEvaluationDeadline).toEqual(new Date('2024-05-31'));
        expect(result.updatedAt).toBeDefined();
      });
    });

    describe('평가기간등급구간_수정한다', () => {
      it('평가 기간 등급 구간을 수정할 수 있다', async () => {
        // Given
        const gradeData: UpdateGradeRangesDto = {
          gradeRanges: [
            { grade: 'S', minRange: 95, maxRange: 100 },
            { grade: 'A', minRange: 85, maxRange: 94 },
            { grade: 'B', minRange: 75, maxRange: 84 },
            { grade: 'C', minRange: 65, maxRange: 74 },
            { grade: 'F', minRange: 0, maxRange: 64 },
          ],
        };

        // When
        const result = await service.평가기간등급구간_수정한다(
          createdPeriod.id,
          gradeData,
          adminUserId,
        );

        // Then
        expect(result.gradeRanges).toHaveLength(5);
        expect(result.gradeRanges[0].grade).toBe('S');
        expect(result.updatedAt).toBeDefined();
      });

      it('등급 구간을 비우려 하면 예외를 발생시킨다', async () => {
        // Given
        const gradeData: UpdateGradeRangesDto = {
          gradeRanges: [],
        };

        // When & Then
        await expect(
          service.평가기간등급구간_수정한다(
            createdPeriod.id,
            gradeData,
            adminUserId,
          ),
        ).rejects.toThrow('등급 구간은 최소 1개 이상 설정되어야 합니다.');
      });
    });
  });

  describe('평가 기간 조회 (CQRS)', () => {
    let activePeriod: EvaluationPeriodDto;
    let waitingPeriod: EvaluationPeriodDto;

    beforeEach(async () => {
      // 활성 평가 기간 생성
      const activeCreateData: CreateEvaluationPeriodMinimalDto = {
        name: '활성 평가 기간',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        maxSelfEvaluationRate: 120,
        evaluationCriteria: [{ name: '업무 성과', weight: 100 }],
        gradeRanges: [],
      };
      activePeriod = await service.평가기간_생성한다(
        activeCreateData,
        testUserId,
      );
      await service.평가기간_시작한다(activePeriod.id, adminUserId);

      // 대기 평가 기간 생성
      const waitingCreateData: CreateEvaluationPeriodMinimalDto = {
        name: '대기 평가 기간',
        startDate: new Date('2024-07-01'),
        peerEvaluationDeadline: new Date('2024-12-31'),
        maxSelfEvaluationRate: 110,
        evaluationCriteria: [{ name: '업무 역량', weight: 100 }],
        gradeRanges: [],
      };
      waitingPeriod = await service.평가기간_생성한다(
        waitingCreateData,
        testUserId,
      );
    });

    describe('활성평가기간_조회한다', () => {
      it('활성화된 평가 기간을 조회할 수 있다', async () => {
        // When
        const result = await service.활성평가기간_조회한다();

        // Then
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(activePeriod.id);
        expect(result[0].status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      });
    });

    describe('평가기간상세_조회한다', () => {
      it('평가 기간 상세 정보를 조회할 수 있다', async () => {
        // When
        const result = await service.평가기간상세_조회한다(activePeriod.id);

        // Then
        expect(result).toBeDefined();
        expect(result!.id).toBe(activePeriod.id);
        expect(result!.name).toBe('활성 평가 기간');
        expect(result!.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      });

      it('존재하지 않는 ID로 조회 시 null을 반환한다', async () => {
        // When
        const result = await service.평가기간상세_조회한다(
          '00000000-0000-0000-0000-000000000000',
        );

        // Then
        expect(result).toBeNull();
      });
    });

    describe('평가기간목록_조회한다', () => {
      it('평가 기간 목록을 페이징으로 조회할 수 있다', async () => {
        // When
        const result = await service.평가기간목록_조회한다(1, 10);

        // Then
        expect(result.items).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
      });

      it('페이징이 올바르게 작동한다', async () => {
        // When
        const result = await service.평가기간목록_조회한다(1, 1);

        // Then
        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(2);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(1);
      });
    });
  });

  describe('수동 허용 설정 관리 (CQRS)', () => {
    let createdPeriod: EvaluationPeriodDto;

    beforeEach(async () => {
      const createData: CreateEvaluationPeriodMinimalDto = {
        name: '수동 허용 설정 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        maxSelfEvaluationRate: 120,
        evaluationCriteria: [{ name: '업무 성과', weight: 100 }],
        gradeRanges: [],
      };
      createdPeriod = await service.평가기간_생성한다(createData, testUserId);
    });

    describe('평가기준설정수동허용_변경한다', () => {
      it('평가 기준 설정 수동 허용을 활성화할 수 있다', async () => {
        // Given
        const permissionData: UpdateCriteriaSettingPermissionDto = {
          enabled: true,
        };

        // When
        const result = await service.평가기준설정수동허용_변경한다(
          createdPeriod.id,
          permissionData,
          adminUserId,
        );

        // Then
        expect(result.criteriaSettingEnabled).toBe(true);
        expect(result.updatedAt).toBeDefined();
      });

      it('평가 기준 설정 수동 허용을 비활성화할 수 있다', async () => {
        // Given
        const enableData: UpdateCriteriaSettingPermissionDto = {
          enabled: true,
        };
        await service.평가기준설정수동허용_변경한다(
          createdPeriod.id,
          enableData,
          adminUserId,
        );

        const disableData: UpdateCriteriaSettingPermissionDto = {
          enabled: false,
        };

        // When
        const result = await service.평가기준설정수동허용_변경한다(
          createdPeriod.id,
          disableData,
          adminUserId,
        );

        // Then
        expect(result.criteriaSettingEnabled).toBe(false);
      });
    });

    describe('자기평가설정수동허용_변경한다', () => {
      it('자기 평가 설정 수동 허용을 활성화할 수 있다', async () => {
        // Given
        const permissionData: UpdateSelfEvaluationSettingPermissionDto = {
          enabled: true,
        };

        // When
        const result = await service.자기평가설정수동허용_변경한다(
          createdPeriod.id,
          permissionData,
          adminUserId,
        );

        // Then
        expect(result.selfEvaluationSettingEnabled).toBe(true);
        expect(result.updatedAt).toBeDefined();
      });
    });

    describe('최종평가설정수동허용_변경한다', () => {
      it('최종 평가 설정 수동 허용을 활성화할 수 있다', async () => {
        // Given
        const permissionData: UpdateFinalEvaluationSettingPermissionDto = {
          enabled: true,
        };

        // When
        const result = await service.최종평가설정수동허용_변경한다(
          createdPeriod.id,
          permissionData,
          adminUserId,
        );

        // Then
        expect(result.finalEvaluationSettingEnabled).toBe(true);
        expect(result.updatedAt).toBeDefined();
      });
    });

    describe('전체수동허용설정_변경한다', () => {
      it('모든 수동 허용 설정을 한 번에 변경할 수 있다', async () => {
        // Given
        const permissionData: UpdateManualSettingPermissionsDto = {
          criteriaSettingEnabled: true,
          selfEvaluationSettingEnabled: true,
          finalEvaluationSettingEnabled: true,
        };

        // When
        const result = await service.전체수동허용설정_변경한다(
          createdPeriod.id,
          permissionData,
          adminUserId,
        );

        // Then
        expect(result.criteriaSettingEnabled).toBe(true);
        expect(result.selfEvaluationSettingEnabled).toBe(true);
        expect(result.finalEvaluationSettingEnabled).toBe(true);
        expect(result.updatedAt).toBeDefined();
      });

      it('일부 수동 허용 설정만 변경할 수 있다', async () => {
        // Given
        const permissionData: UpdateManualSettingPermissionsDto = {
          criteriaSettingEnabled: true,
          // 다른 설정은 undefined로 유지
        };

        // When
        const result = await service.전체수동허용설정_변경한다(
          createdPeriod.id,
          permissionData,
          adminUserId,
        );

        // Then
        expect(result.criteriaSettingEnabled).toBe(true);
        expect(result.updatedAt).toBeDefined();
      });

      it('존재하지 않는 ID로 설정 변경 시 예외를 발생시킨다', async () => {
        // Given
        const permissionData: UpdateManualSettingPermissionsDto = {
          criteriaSettingEnabled: true,
        };

        // When & Then
        await expect(
          service.전체수동허용설정_변경한다(
            '00000000-0000-0000-0000-000000000000',
            permissionData,
            adminUserId,
          ),
        ).rejects.toThrow();
      });
    });
  });

  describe('복합 시나리오 테스트', () => {
    it('평가 기간 전체 생명주기를 테스트할 수 있다', async () => {
      // 1. 평가 기간 생성
      const createData: CreateEvaluationPeriodMinimalDto = {
        name: '전체 생명주기 테스트',
        description: '평가 기간 전체 생명주기 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        maxSelfEvaluationRate: 120,
        evaluationCriteria: [
          { name: '업무 성과', weight: 60 },
          { name: '업무 역량', weight: 40 },
        ],
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 100 },
          { grade: 'B', minRange: 60, maxRange: 79 },
        ],
      };

      const createdPeriod = await service.평가기간_생성한다(
        createData,
        testUserId,
      );
      expect(createdPeriod.status).toBe(EvaluationPeriodStatus.WAITING);

      // 2. 기본 정보 수정
      const basicUpdateData: UpdateEvaluationPeriodBasicDto = {
        description: '수정된 설명',
        maxSelfEvaluationRate: 130,
      };

      const updatedPeriod = await service.평가기간기본정보_수정한다(
        createdPeriod.id,
        basicUpdateData,
        adminUserId,
      );
      expect(updatedPeriod.description).toBe('수정된 설명');
      expect(updatedPeriod.maxSelfEvaluationRate).toBe(130);

      // 3. 수동 허용 설정 변경
      const permissionData: UpdateManualSettingPermissionsDto = {
        criteriaSettingEnabled: true,
        selfEvaluationSettingEnabled: true,
      };

      const permissionUpdatedPeriod = await service.전체수동허용설정_변경한다(
        createdPeriod.id,
        permissionData,
        adminUserId,
      );
      expect(permissionUpdatedPeriod.criteriaSettingEnabled).toBe(true);
      expect(permissionUpdatedPeriod.selfEvaluationSettingEnabled).toBe(true);

      // 4. 평가 기간 시작
      const startResult = await service.평가기간_시작한다(
        createdPeriod.id,
        adminUserId,
      );
      expect(startResult).toBe(true);

      // 5. 활성 평가 기간 조회로 확인
      const activePeriods = await service.활성평가기간_조회한다();
      expect(activePeriods).toHaveLength(1);
      expect(activePeriods[0].id).toBe(createdPeriod.id);

      // 6. 상세 조회로 최종 상태 확인
      const finalPeriod = await service.평가기간상세_조회한다(createdPeriod.id);
      expect(finalPeriod!.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(finalPeriod!.currentPhase).toBe(
        EvaluationPeriodPhase.EVALUATION_SETUP,
      );
      expect(finalPeriod!.description).toBe('수정된 설명');
      expect(finalPeriod!.maxSelfEvaluationRate).toBe(130);
      expect(finalPeriod!.criteriaSettingEnabled).toBe(true);
      expect(finalPeriod!.selfEvaluationSettingEnabled).toBe(true);
    });

    it('여러 평가 기간을 생성하고 목록 조회를 테스트할 수 있다', async () => {
      // 1. 여러 평가 기간 생성 (날짜 겹침 방지)
      const periods: EvaluationPeriodDto[] = [];
      for (let i = 1; i <= 5; i++) {
        const startMonth = i * 2; // 2, 4, 6, 8, 10월로 시작
        const endMonth = startMonth + 1; // 3, 5, 7, 9, 11월로 종료
        const createData: CreateEvaluationPeriodMinimalDto = {
          name: `테스트 평가 기간 ${i}`,
          startDate: new Date(
            `2024-${startMonth.toString().padStart(2, '0')}-01`,
          ),
          peerEvaluationDeadline: new Date(
            `2024-${endMonth.toString().padStart(2, '0')}-28`,
          ),
          maxSelfEvaluationRate: 100 + i * 10,
          evaluationCriteria: [{ name: `기준 ${i}`, weight: 100 }],
          gradeRanges: [],
        };

        const period = await service.평가기간_생성한다(createData, testUserId);
        periods.push(period);

        // 홀수 번째 평가 기간은 시작
        if (i % 2 === 1) {
          await service.평가기간_시작한다(period.id, adminUserId);
        }
      }

      // 2. 전체 목록 조회
      const allPeriods = await service.평가기간목록_조회한다(1, 10);
      expect(allPeriods.items).toHaveLength(5);
      expect(allPeriods.total).toBe(5);

      // 3. 페이징 테스트
      const pagedPeriods = await service.평가기간목록_조회한다(1, 3);
      expect(pagedPeriods.items).toHaveLength(3);
      expect(pagedPeriods.total).toBe(5);

      const secondPagePeriods = await service.평가기간목록_조회한다(2, 3);
      expect(secondPagePeriods.items).toHaveLength(2);
      expect(secondPagePeriods.total).toBe(5);

      // 4. 활성 평가 기간 조회
      const activePeriods = await service.활성평가기간_조회한다();
      expect(activePeriods).toHaveLength(3); // 1, 3, 5번째가 활성
      expect(
        activePeriods.every(
          (p) => p.status === EvaluationPeriodStatus.IN_PROGRESS,
        ),
      ).toBe(true);
    });
  });
});
