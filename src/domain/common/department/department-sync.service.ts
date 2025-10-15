import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosResponse } from 'axios';
import { Department } from './department.entity';
import { DepartmentRepository } from './department.repository';
import {
  ExternalDepartmentData,
  DepartmentSyncResult,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './department.types';

/**
 * 부서 동기화 서비스
 *
 * 외부 메타데이터 매니저 API와 부서 데이터를 동기화합니다.
 * 히트미스 전략을 사용하여 캐시처럼 동작합니다.
 */
@Injectable()
export class DepartmentSyncService {
  private readonly logger = new Logger(DepartmentSyncService.name);
  private readonly externalApiUrl: string;
  private readonly syncEnabled: boolean;
  private readonly systemUserId = 'SYSTEM_SYNC'; // 시스템 동기화 사용자 ID

  constructor(
    private readonly departmentRepository: DepartmentRepository,
    private readonly configService: ConfigService,
  ) {
    this.externalApiUrl = this.configService.get<string>(
      'EXTERNAL_METADATA_API_URL',
      'https://lumir-metadata-manager.vercel.app',
    );
    this.syncEnabled = this.configService.get<boolean>(
      'DEPARTMENT_SYNC_ENABLED',
      true,
    );
  }

  /**
   * 외부 API에서 부서 데이터 조회
   */
  async fetchExternalDepartments(): Promise<ExternalDepartmentData[]> {
    try {
      const response: AxiosResponse<ExternalDepartmentData[]> = await axios.get(
        `${this.externalApiUrl}/api/departments`,
        {
          timeout: 30000, // 30초 타임아웃
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(
        `외부 API에서 ${response.data.length}개의 부서 데이터를 조회했습니다.`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('외부 부서 API 조회 실패:', error.message);
      throw new HttpException(
        '외부 부서 데이터 조회에 실패했습니다.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 외부 데이터를 내부 엔티티로 변환
   */
  private mapExternalDataToDepartment(
    externalData: ExternalDepartmentData,
  ): CreateDepartmentDto {
    return {
      name: externalData.department_name,
      code: externalData.department_code,
      externalId: externalData.id,
      order: externalData.order,
      managerId: externalData.manager_id || undefined,
      parentDepartmentId: externalData.parent_department_id || undefined,
      externalCreatedAt: new Date(externalData.created_at),
      externalUpdatedAt: new Date(externalData.updated_at),
    };
  }

  /**
   * 부서 데이터 동기화
   */
  async syncDepartments(
    forceSync: boolean = false,
  ): Promise<DepartmentSyncResult> {
    if (!this.syncEnabled && !forceSync) {
      this.logger.warn('부서 동기화가 비활성화되어 있습니다.');
      return {
        success: false,
        totalProcessed: 0,
        created: 0,
        updated: 0,
        errors: ['동기화가 비활성화되어 있습니다.'],
        syncedAt: new Date(),
      };
    }

    const syncStartTime = new Date();
    let totalProcessed = 0;
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    try {
      this.logger.log('부서 데이터 동기화를 시작합니다...');

      // 1. 외부 API에서 데이터 조회
      const externalDepartments = await this.fetchExternalDepartments();
      totalProcessed = externalDepartments.length;

      // 2. 각 부서 데이터 처리
      const departmentsToSave: Department[] = [];

      for (const externalDept of externalDepartments) {
        try {
          // 기존 부서 확인
          const existingDepartment =
            await this.departmentRepository.findByExternalId(externalDept.id);

          const mappedData = this.mapExternalDataToDepartment(externalDept);

          if (existingDepartment) {
            // 업데이트가 필요한지 확인
            const externalUpdatedAt = new Date(externalDept.updated_at);
            const needsUpdate =
              !existingDepartment.lastSyncAt ||
              existingDepartment.externalUpdatedAt < externalUpdatedAt;

            if (needsUpdate || forceSync) {
              // 기존 부서 업데이트
              Object.assign(existingDepartment, {
                name: mappedData.name,
                code: mappedData.code,
                order: mappedData.order,
                managerId: mappedData.managerId,
                parentDepartmentId: mappedData.parentDepartmentId,
                externalUpdatedAt: mappedData.externalUpdatedAt,
                lastSyncAt: syncStartTime,
                updatedBy: this.systemUserId, // 시스템 동기화 사용자
              } as UpdateDepartmentDto);

              departmentsToSave.push(existingDepartment);
              updated++;
            }
          } else {
            // 새 부서 생성
            const newDepartment = new Department(
              mappedData.name,
              mappedData.code,
              mappedData.externalId,
              mappedData.order,
              mappedData.managerId,
              mappedData.parentDepartmentId,
              mappedData.externalCreatedAt,
              mappedData.externalUpdatedAt,
            );
            newDepartment.lastSyncAt = syncStartTime;
            newDepartment.createdBy = this.systemUserId; // 시스템 동기화 사용자
            newDepartment.updatedBy = this.systemUserId; // 시스템 동기화 사용자

            departmentsToSave.push(newDepartment);
            created++;
          }
        } catch (error) {
          const errorMsg = `부서 ${externalDept.department_name} 처리 실패: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // 3. 일괄 저장
      if (departmentsToSave.length > 0) {
        await this.departmentRepository.saveMany(departmentsToSave);
        this.logger.log(
          `${departmentsToSave.length}개의 부서 데이터를 저장했습니다.`,
        );
      }

      const result: DepartmentSyncResult = {
        success: true,
        totalProcessed,
        created,
        updated,
        errors,
        syncedAt: syncStartTime,
      };

      this.logger.log(
        `부서 동기화 완료: 총 ${totalProcessed}개 처리, ${created}개 생성, ${updated}개 업데이트`,
      );

      return result;
    } catch (error) {
      const errorMsg = `부서 동기화 실패: ${error.message}`;
      this.logger.error(errorMsg);

      return {
        success: false,
        totalProcessed,
        created,
        updated,
        errors: [...errors, errorMsg],
        syncedAt: syncStartTime,
      };
    }
  }

  /**
   * 스케줄된 자동 동기화 (매시간)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledSync(): Promise<void> {
    this.logger.log('스케줄된 부서 동기화를 시작합니다...');
    await this.syncDepartments();
  }

  /**
   * 수동 동기화 트리거
   */
  async triggerManualSync(): Promise<DepartmentSyncResult> {
    this.logger.log('수동 부서 동기화를 시작합니다...');
    return this.syncDepartments(true);
  }

  /**
   * 부서 데이터 조회 (히트미스 전략)
   * 로컬 DB에서 먼저 조회하고, 없으면 외부 API에서 동기화
   */
  async getDepartments(forceRefresh: boolean = false): Promise<Department[]> {
    try {
      // 1. 강제 새로고침이 요청되었거나 로컬 데이터가 없는 경우
      const localDepartments = await this.departmentRepository.findAll();

      if (forceRefresh || localDepartments.length === 0) {
        this.logger.log('부서 데이터를 외부 API에서 동기화합니다...');
        await this.syncDepartments(forceRefresh);
        return this.departmentRepository.findAll();
      }

      // 2. 마지막 동기화 시간 확인 (24시간 이상 경과시 백그라운드 동기화)
      const stats = await this.departmentRepository.getDepartmentStats();
      const lastSyncAt = stats.lastSyncAt;
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (!lastSyncAt || lastSyncAt < twentyFourHoursAgo) {
        this.logger.log(
          '24시간 이상 동기화되지 않아 백그라운드에서 동기화를 시작합니다...',
        );
        // 백그라운드에서 동기화 (응답을 기다리지 않음)
        this.syncDepartments().catch((error) => {
          this.logger.error('백그라운드 동기화 실패:', error.message);
        });
      }

      // 3. 로컬 데이터 반환
      return localDepartments;
    } catch (error) {
      this.logger.error('부서 데이터 조회 실패:', error.message);
      throw new HttpException(
        '부서 데이터 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 특정 부서 조회 (히트미스 전략)
   */
  async getDepartmentById(
    id: string,
    forceRefresh: boolean = false,
  ): Promise<Department | null> {
    try {
      // 1. 로컬에서 조회
      let department = await this.departmentRepository.findById(id);

      // 2. 없거나 강제 새로고침인 경우 동기화 후 재조회
      if (!department || forceRefresh) {
        await this.syncDepartments(forceRefresh);
        department = await this.departmentRepository.findById(id);
      }

      return department;
    } catch (error) {
      this.logger.error(`부서 ID ${id} 조회 실패:`, error.message);
      throw new HttpException(
        '부서 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 외부 ID로 부서 조회
   */
  async getDepartmentByExternalId(
    externalId: string,
    forceRefresh: boolean = false,
  ): Promise<Department | null> {
    try {
      let department =
        await this.departmentRepository.findByExternalId(externalId);

      if (!department || forceRefresh) {
        await this.syncDepartments(forceRefresh);
        department =
          await this.departmentRepository.findByExternalId(externalId);
      }

      return department;
    } catch (error) {
      this.logger.error(`외부 부서 ID ${externalId} 조회 실패:`, error.message);
      throw new HttpException(
        '부서 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
