import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosResponse } from 'axios';
import { Employee } from './employee.entity';
import { EmployeeRepository } from './employee.repository';
import {
  ExternalEmployeeData,
  ExternalRankData,
  ExternalDepartmentData,
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
  private readonly systemUserId = 'SYSTEM_SYNC'; // 시스템 동기화 사용자 ID
  private rankCache: Map<string, ExternalRankData> = new Map(); // rank_code -> rank 정보
  private rankIdCache: Map<string, ExternalRankData> = new Map(); // _id -> rank 정보
  private rankCacheLastUpdated?: Date;
  private departmentCache: Map<string, ExternalDepartmentData> = new Map(); // department_code -> department 정보
  private departmentIdCache: Map<string, ExternalDepartmentData> = new Map(); // _id -> department 정보
  private departmentCacheLastUpdated?: Date;

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
   * 외부 API에서 직급 데이터 조회
   */
  async fetchExternalRanks(): Promise<ExternalRankData[]> {
    try {
      const response: AxiosResponse<ExternalRankData[]> = await axios.get(
        `${this.externalApiUrl}/api/ranks`,
        {
          timeout: 30000, // 30초 타임아웃
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(
        `외부 API에서 ${response.data.length}개의 직급 데이터를 조회했습니다.`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('외부 직급 API 조회 실패:', error.message);
      throw new HttpException(
        '외부 직급 데이터 조회에 실패했습니다.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 직급 캐시 업데이트
   */
  private async updateRankCache(): Promise<void> {
    try {
      const ranks = await this.fetchExternalRanks();

      // 캐시 초기화
      this.rankCache.clear();
      this.rankIdCache.clear();

      // 캐시 업데이트
      for (const rank of ranks) {
        this.rankCache.set(rank.rank_code, rank);
        this.rankIdCache.set(rank._id, rank);
      }

      this.rankCacheLastUpdated = new Date();
      this.logger.log(`직급 캐시를 업데이트했습니다. (${ranks.length}개 항목)`);
    } catch (error) {
      this.logger.error('직급 캐시 업데이트 실패:', error.message);
      // 캐시 업데이트 실패는 치명적이지 않으므로 예외를 던지지 않음
    }
  }

  /**
   * 직급 캐시가 유효한지 확인 (1시간 이내)
   */
  private isRankCacheValid(): boolean {
    if (!this.rankCacheLastUpdated) return false;

    const now = new Date();
    const diffHours =
      Math.abs(now.getTime() - this.rankCacheLastUpdated.getTime()) /
      (1000 * 60 * 60);

    return diffHours < 1; // 1시간 이내면 유효
  }

  /**
   * rank_code로 직급 정보 조회
   */
  private async getRankByCode(
    rankCode: string,
  ): Promise<ExternalRankData | null> {
    // 캐시가 유효하지 않으면 업데이트
    if (!this.isRankCacheValid()) {
      await this.updateRankCache();
    }

    return this.rankCache.get(rankCode) || null;
  }

  /**
   * _id로 직급 정보 조회
   */
  private async getRankById(rankId: string): Promise<ExternalRankData | null> {
    // 캐시가 유효하지 않으면 업데이트
    if (!this.isRankCacheValid()) {
      await this.updateRankCache();
    }

    return this.rankIdCache.get(rankId) || null;
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
   * 부서 캐시 업데이트
   */
  private async updateDepartmentCache(): Promise<void> {
    try {
      const departments = await this.fetchExternalDepartments();

      // 캐시 초기화
      this.departmentCache.clear();
      this.departmentIdCache.clear();

      // 캐시 업데이트
      for (const dept of departments) {
        this.departmentCache.set(dept.department_code, dept);
        this.departmentIdCache.set(dept._id, dept);
      }

      this.departmentCacheLastUpdated = new Date();
      this.logger.log(
        `부서 캐시를 업데이트했습니다. (${departments.length}개 항목)`,
      );
    } catch (error) {
      this.logger.error('부서 캐시 업데이트 실패:', error.message);
      // 캐시 업데이트 실패는 치명적이지 않으므로 예외를 던지지 않음
    }
  }

  /**
   * 부서 캐시가 유효한지 확인 (1시간 이내)
   */
  private isDepartmentCacheValid(): boolean {
    if (!this.departmentCacheLastUpdated) return false;

    const now = new Date();
    const diffHours =
      Math.abs(now.getTime() - this.departmentCacheLastUpdated.getTime()) /
      (1000 * 60 * 60);

    return diffHours < 1; // 1시간 이내면 유효
  }

  /**
   * department_code로 부서 정보 조회
   */
  private async getDepartmentByCode(
    departmentCode: string,
  ): Promise<ExternalDepartmentData | null> {
    // 캐시가 유효하지 않으면 업데이트
    if (!this.isDepartmentCacheValid()) {
      await this.updateDepartmentCache();
    }

    return this.departmentCache.get(departmentCode) || null;
  }

  /**
   * _id로 부서 정보 조회
   */
  private async getDepartmentById(
    departmentId: string,
  ): Promise<ExternalDepartmentData | null> {
    // 캐시가 유효하지 않으면 업데이트
    if (!this.isDepartmentCacheValid()) {
      await this.updateDepartmentCache();
    }

    return this.departmentIdCache.get(departmentId) || null;
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
  private async mapExternalDataToEmployee(
    externalData: ExternalEmployeeData,
  ): Promise<CreateEmployeeDto> {
    // 직급 정보 처리
    let rankId = externalData.rank?._id;
    let rankName = externalData.rank?.rank_name;
    let rankCode = externalData.rank?.rank_code;
    let rankLevel = externalData.rank?.level;

    // 직급 정보가 없거나 불완전한 경우 캐시에서 조회 시도
    if (!rankId && externalData.rank?.rank_code) {
      const rankFromCache = await this.getRankByCode(
        externalData.rank.rank_code,
      );
      if (rankFromCache) {
        rankId = rankFromCache._id;
        rankName = rankFromCache.rank_name;
        rankCode = rankFromCache.rank_code;
        rankLevel = rankFromCache.level;
        this.logger.debug(
          `직원 ${externalData.name}의 직급 정보를 캐시에서 매칭했습니다: ${rankFromCache.rank_name}`,
        );
      }
    }

    // 부서 정보 처리
    let departmentId = externalData.department?._id;
    let departmentName = externalData.department?.department_name;
    let departmentCode = externalData.department?.department_code;

    // 부서 정보가 없거나 불완전한 경우 캐시에서 조회 시도
    if (!departmentId && externalData.department?.department_code) {
      const deptFromCache = await this.getDepartmentByCode(
        externalData.department.department_code,
      );
      if (deptFromCache) {
        departmentId = deptFromCache._id;
        departmentName = deptFromCache.department_name;
        departmentCode = deptFromCache.department_code;
        this.logger.debug(
          `직원 ${externalData.name}의 부서 정보를 캐시에서 매칭했습니다: ${deptFromCache.department_name}`,
        );
      }
    }

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
      departmentId: departmentId,
      departmentName: departmentName,
      departmentCode: departmentCode,
      positionId: externalData.position?._id,
      rankId: rankId,
      rankName: rankName,
      rankCode: rankCode,
      rankLevel: rankLevel,
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

      // 1. 직급 및 부서 캐시 업데이트 (직원 동기화 전에 먼저 수행)
      await this.updateRankCache();
      await this.updateDepartmentCache();

      // 2. 외부 API에서 데이터 조회
      const externalEmployees = await this.fetchExternalEmployees();
      totalProcessed = externalEmployees.length;

      // 3. 각 직원 데이터 처리
      const employeesToSave: Employee[] = [];

      for (const externalEmp of externalEmployees) {
        try {
          // 기존 직원 확인
          const existingEmployee =
            await this.employeeRepository.findByExternalId(externalEmp._id);

          const mappedData = await this.mapExternalDataToEmployee(externalEmp);

          if (existingEmployee) {
            // 업데이트가 필요한지 확인
            const externalUpdatedAt = new Date(externalEmp.updated_at);

            // 기본 업데이트 조건
            let needsUpdate =
              !existingEmployee.lastSyncAt ||
              existingEmployee.externalUpdatedAt < externalUpdatedAt;

            // 직급 정보가 없는 경우 강제 업데이트 (새로 추가된 필드)
            const hasRankData =
              mappedData.rankId || mappedData.rankName || mappedData.rankCode;
            const missingRankData =
              !existingEmployee.rankId &&
              !existingEmployee.rankName &&
              !existingEmployee.rankCode;
            if (hasRankData && missingRankData) {
              needsUpdate = true;
              this.logger.debug(
                `직원 ${existingEmployee.name}의 직급 정보가 없어 강제 업데이트합니다.`,
              );
            }

            // 직급 정보가 변경된 경우
            if (
              hasRankData &&
              (existingEmployee.rankId !== mappedData.rankId ||
                existingEmployee.rankName !== mappedData.rankName ||
                existingEmployee.rankCode !== mappedData.rankCode ||
                existingEmployee.rankLevel !== mappedData.rankLevel)
            ) {
              needsUpdate = true;
              this.logger.debug(
                `직원 ${existingEmployee.name}의 직급 정보가 변경되어 업데이트합니다.`,
              );
            }

            // 부서 정보가 없는 경우 강제 업데이트 (새로 추가된 필드)
            const hasDepartmentData =
              mappedData.departmentId ||
              mappedData.departmentName ||
              mappedData.departmentCode;
            const missingDepartmentData =
              !existingEmployee.departmentName &&
              !existingEmployee.departmentCode;
            if (hasDepartmentData && missingDepartmentData) {
              needsUpdate = true;
              this.logger.debug(
                `직원 ${existingEmployee.name}의 부서 정보가 없어 강제 업데이트합니다.`,
              );
            }

            // 부서 정보가 변경된 경우
            if (
              hasDepartmentData &&
              (existingEmployee.departmentId !== mappedData.departmentId ||
                existingEmployee.departmentName !== mappedData.departmentName ||
                existingEmployee.departmentCode !== mappedData.departmentCode)
            ) {
              needsUpdate = true;
              this.logger.debug(
                `직원 ${existingEmployee.name}의 부서 정보가 변경되어 업데이트합니다.`,
              );
            }

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
                departmentName: mappedData.departmentName,
                departmentCode: mappedData.departmentCode,
                positionId: mappedData.positionId,
                rankId: mappedData.rankId,
                rankName: mappedData.rankName,
                rankCode: mappedData.rankCode,
                rankLevel: mappedData.rankLevel,
                externalUpdatedAt: mappedData.externalUpdatedAt,
                lastSyncAt: syncStartTime,
                updatedBy: this.systemUserId, // 시스템 동기화 사용자
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
              mappedData.departmentName,
              mappedData.departmentCode,
              mappedData.positionId,
              mappedData.rankId,
              mappedData.rankName,
              mappedData.rankCode,
              mappedData.rankLevel,
              mappedData.externalCreatedAt,
              mappedData.externalUpdatedAt,
            );
            newEmployee.lastSyncAt = syncStartTime;
            newEmployee.createdBy = this.systemUserId; // 시스템 동기화 사용자
            newEmployee.updatedBy = this.systemUserId; // 시스템 동기화 사용자

            employeesToSave.push(newEmployee);
            created++;
          }
        } catch (error) {
          const errorMsg = `직원 ${externalEmp.name} 처리 실패: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // 4. 일괄 저장 (중복 키 에러 처리)
      if (employeesToSave.length > 0) {
        try {
          await this.employeeRepository.saveMany(employeesToSave);
          this.logger.log(
            `${employeesToSave.length}개의 직원 데이터를 저장했습니다.`,
          );
        } catch (saveError) {
          // 중복 키 에러인 경우 개별 저장 시도
          if (
            saveError?.code === '23505' ||
            saveError?.message?.includes('duplicate key')
          ) {
            this.logger.warn(
              '일괄 저장 중 중복 키 에러 발생, 개별 저장으로 재시도합니다.',
            );

            let savedCount = 0;
            let skippedCount = 0;

            // 개별 저장
            for (const employee of employeesToSave) {
              try {
                await this.employeeRepository.save(employee);
                savedCount++;
              } catch (individualError) {
                if (
                  individualError?.code === '23505' ||
                  individualError?.message?.includes('duplicate key')
                ) {
                  this.logger.debug(
                    `직원 ${employee.name} (${employee.employeeNumber}) 중복으로 건너뜀`,
                  );
                  skippedCount++;
                } else {
                  const errorMsg = `직원 ${employee.name} 저장 실패: ${individualError.message}`;
                  this.logger.error(errorMsg);
                  errors.push(errorMsg);
                }
              }
            }

            this.logger.log(
              `개별 저장 완료: ${savedCount}개 저장, ${skippedCount}개 건너뜀`,
            );
          } else {
            throw saveError;
          }
        }
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
  @Cron(CronExpression.EVERY_10_MINUTES)
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
