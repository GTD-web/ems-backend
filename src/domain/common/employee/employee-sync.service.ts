import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosResponse } from 'axios';
import { Employee } from './employee.entity';
import { EmployeeRepository } from './employee.repository';
import {
  ExternalEmployeeData,
  EmployeeSyncResult,
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from './employee.types';

/**
 * 직원 동기화 서비스
 *
 * 외부 메타데이터 매니저 API와 직원 데이터를 동기화합니다.
 * 히트미스 전략을 사용하여 캐시처럼 동작합니다.
 */
@Injectable()
export class EmployeeSyncService {
  private readonly logger = new Logger(EmployeeSyncService.name);
  private readonly externalApiUrl: string;
  private readonly syncEnabled: boolean;

  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly configService: ConfigService,
  ) {
    this.externalApiUrl = this.configService.get<string>(
      'EXTERNAL_METADATA_API_URL',
      'https://lumir-metadata-manager.vercel.app',
    );
    this.syncEnabled = this.configService.get<boolean>(
      'EMPLOYEE_SYNC_ENABLED',
      true,
    );
  }

  /**
   * 외부 API에서 직원 데이터 조회
   */
  async fetchExternalEmployees(): Promise<ExternalEmployeeData[]> {
    try {
      const response: AxiosResponse<ExternalEmployeeData[]> = await axios.get(
        `${this.externalApiUrl}/api/employees?detailed=true`,
        {
          timeout: 30000, // 30초 타임아웃
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(
        `외부 API에서 ${response.data.length}개의 직원 데이터를 조회했습니다.`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('외부 직원 API 조회 실패:', error.message);
      throw new HttpException(
        '외부 직원 데이터 조회에 실패했습니다.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 외부 데이터를 내부 엔티티로 변환
   */
  private mapExternalDataToEmployee(
    externalData: ExternalEmployeeData,
  ): CreateEmployeeDto {
    return {
      employeeNumber: externalData.employee_number,
      name: externalData.name,
      email: externalData.email,
      phoneNumber: externalData.phone_number || undefined,
      dateOfBirth: externalData.date_of_birth
        ? new Date(externalData.date_of_birth)
        : undefined,
      gender: externalData.gender,
      hireDate: externalData.hire_date
        ? new Date(externalData.hire_date)
        : undefined,
      managerId: externalData.manager_id || undefined,
      status: externalData.status,
      departmentId: externalData.department?._id,
      positionId: externalData.position?._id,
      rankId: externalData.rank?._id,
      externalId: externalData._id,
      externalCreatedAt: new Date(externalData.created_at),
      externalUpdatedAt: new Date(externalData.updated_at),
    };
  }

  /**
   * 직원 데이터 동기화
   */
  async syncEmployees(forceSync: boolean = false): Promise<EmployeeSyncResult> {
    if (!this.syncEnabled && !forceSync) {
      this.logger.warn('직원 동기화가 비활성화되어 있습니다.');
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
      this.logger.log('직원 데이터 동기화를 시작합니다...');

      // 1. 외부 API에서 데이터 조회
      const externalEmployees = await this.fetchExternalEmployees();
      totalProcessed = externalEmployees.length;

      // 2. 각 직원 데이터 처리
      const employeesToSave: Employee[] = [];

      for (const externalEmp of externalEmployees) {
        try {
          // 기존 직원 확인
          const existingEmployee =
            await this.employeeRepository.findByExternalId(externalEmp._id);

          const mappedData = this.mapExternalDataToEmployee(externalEmp);

          if (existingEmployee) {
            // 업데이트가 필요한지 확인
            const externalUpdatedAt = new Date(externalEmp.updated_at);
            const needsUpdate =
              !existingEmployee.lastSyncAt ||
              existingEmployee.externalUpdatedAt < externalUpdatedAt;

            if (needsUpdate || forceSync) {
              // 기존 직원 업데이트
              Object.assign(existingEmployee, {
                employeeNumber: mappedData.employeeNumber,
                name: mappedData.name,
                email: mappedData.email,
                phoneNumber: mappedData.phoneNumber,
                dateOfBirth: mappedData.dateOfBirth,
                gender: mappedData.gender,
                hireDate: mappedData.hireDate,
                managerId: mappedData.managerId,
                status: mappedData.status,
                departmentId: mappedData.departmentId,
                positionId: mappedData.positionId,
                rankId: mappedData.rankId,
                externalUpdatedAt: mappedData.externalUpdatedAt,
                lastSyncAt: syncStartTime,
              } as UpdateEmployeeDto);

              employeesToSave.push(existingEmployee);
              updated++;
            }
          } else {
            // 새 직원 생성
            const newEmployee = new Employee(
              mappedData.employeeNumber,
              mappedData.name,
              mappedData.email,
              mappedData.externalId,
              mappedData.phoneNumber,
              mappedData.dateOfBirth,
              mappedData.gender,
              mappedData.hireDate,
              mappedData.managerId,
              mappedData.status,
              mappedData.departmentId,
              mappedData.positionId,
              mappedData.rankId,
              mappedData.externalCreatedAt,
              mappedData.externalUpdatedAt,
            );
            newEmployee.lastSyncAt = syncStartTime;

            employeesToSave.push(newEmployee);
            created++;
          }
        } catch (error) {
          const errorMsg = `직원 ${externalEmp.name} 처리 실패: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // 3. 일괄 저장
      if (employeesToSave.length > 0) {
        await this.employeeRepository.saveMany(employeesToSave);
        this.logger.log(
          `${employeesToSave.length}개의 직원 데이터를 저장했습니다.`,
        );
      }

      const result: EmployeeSyncResult = {
        success: true,
        totalProcessed,
        created,
        updated,
        errors,
        syncedAt: syncStartTime,
      };

      this.logger.log(
        `직원 동기화 완료: 총 ${totalProcessed}개 처리, ${created}개 생성, ${updated}개 업데이트`,
      );

      return result;
    } catch (error) {
      const errorMsg = `직원 동기화 실패: ${error.message}`;
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
    this.logger.log('스케줄된 직원 동기화를 시작합니다...');
    await this.syncEmployees();
  }

  /**
   * 수동 동기화 트리거
   */
  async triggerManualSync(): Promise<EmployeeSyncResult> {
    this.logger.log('수동 직원 동기화를 시작합니다...');
    return this.syncEmployees(true);
  }

  /**
   * 직원 데이터 조회 (히트미스 전략)
   * 로컬 DB에서 먼저 조회하고, 없으면 외부 API에서 동기화
   */
  async getEmployees(forceRefresh: boolean = false): Promise<Employee[]> {
    try {
      // 1. 강제 새로고침이 요청되었거나 로컬 데이터가 없는 경우
      const localEmployees = await this.employeeRepository.findAll();

      if (forceRefresh || localEmployees.length === 0) {
        this.logger.log('직원 데이터를 외부 API에서 동기화합니다...');
        await this.syncEmployees(forceRefresh);
        return this.employeeRepository.findAll();
      }

      // 2. 마지막 동기화 시간 확인 (24시간 이상 경과시 백그라운드 동기화)
      const stats = await this.employeeRepository.getEmployeeStats();
      const lastSyncAt = stats.lastSyncAt;
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (!lastSyncAt || lastSyncAt < twentyFourHoursAgo) {
        this.logger.log(
          '24시간 이상 동기화되지 않아 백그라운드에서 동기화를 시작합니다...',
        );
        // 백그라운드에서 동기화 (응답을 기다리지 않음)
        this.syncEmployees().catch((error) => {
          this.logger.error('백그라운드 동기화 실패:', error.message);
        });
      }

      // 3. 로컬 데이터 반환
      return localEmployees;
    } catch (error) {
      this.logger.error('직원 데이터 조회 실패:', error.message);
      throw new HttpException(
        '직원 데이터 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 특정 직원 조회 (히트미스 전략)
   */
  async getEmployeeById(
    id: string,
    forceRefresh: boolean = false,
  ): Promise<Employee | null> {
    try {
      // 1. 로컬에서 조회
      let employee = await this.employeeRepository.findById(id);

      // 2. 없거나 강제 새로고침인 경우 동기화 후 재조회
      if (!employee || forceRefresh) {
        await this.syncEmployees(forceRefresh);
        employee = await this.employeeRepository.findById(id);
      }

      return employee;
    } catch (error) {
      this.logger.error(`직원 ID ${id} 조회 실패:`, error.message);
      throw new HttpException(
        '직원 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 외부 ID로 직원 조회
   */
  async getEmployeeByExternalId(
    externalId: string,
    forceRefresh: boolean = false,
  ): Promise<Employee | null> {
    try {
      let employee = await this.employeeRepository.findByExternalId(externalId);

      if (!employee || forceRefresh) {
        await this.syncEmployees(forceRefresh);
        employee = await this.employeeRepository.findByExternalId(externalId);
      }

      return employee;
    } catch (error) {
      this.logger.error(`외부 직원 ID ${externalId} 조회 실패:`, error.message);
      throw new HttpException(
        '직원 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 직원 번호로 직원 조회
   */
  async getEmployeeByEmployeeNumber(
    employeeNumber: string,
    forceRefresh: boolean = false,
  ): Promise<Employee | null> {
    try {
      let employee =
        await this.employeeRepository.findByEmployeeNumber(employeeNumber);

      if (!employee || forceRefresh) {
        await this.syncEmployees(forceRefresh);
        employee =
          await this.employeeRepository.findByEmployeeNumber(employeeNumber);
      }

      return employee;
    } catch (error) {
      this.logger.error(
        `직원 번호 ${employeeNumber} 조회 실패:`,
        error.message,
      );
      throw new HttpException(
        '직원 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 이메일로 직원 조회
   */
  async getEmployeeByEmail(
    email: string,
    forceRefresh: boolean = false,
  ): Promise<Employee | null> {
    try {
      let employee = await this.employeeRepository.findByEmail(email);

      if (!employee || forceRefresh) {
        await this.syncEmployees(forceRefresh);
        employee = await this.employeeRepository.findByEmail(email);
      }

      return employee;
    } catch (error) {
      this.logger.error(`이메일 ${email} 조회 실패:`, error.message);
      throw new HttpException(
        '직원 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
