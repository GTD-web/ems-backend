import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Employee } from '../../domain/common/employee/employee.entity';
import { EmployeeRepository } from '../../domain/common/employee/employee.repository';
import {
  EmployeeSyncResult,
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '../../domain/common/employee/employee.types';
import { SSOService } from '@domain/common/sso/sso.service';
import type { EmployeeInfo } from '@domain/common/sso/interfaces';

/**
 * 직원 동기화 서비스
 *
 * SSO 서비스와 직원 데이터를 동기화합니다.
 * 히트미스 전략을 사용하여 캐시처럼 동작합니다.
 */
@Injectable()
export class EmployeeSyncService implements OnModuleInit {
  private readonly logger = new Logger(EmployeeSyncService.name);
  private readonly syncEnabled: boolean;
  private readonly systemUserId = 'SYSTEM_SYNC'; // 시스템 동기화 사용자 ID

  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly configService: ConfigService,
    private readonly ssoService: SSOService,
  ) {
    this.syncEnabled = this.configService.get<boolean>(
      'EMPLOYEE_SYNC_ENABLED',
      true,
    );
  }

  /**
   * 모듈 초기화 시 실행
   * 직원 데이터가 없으면 초기 동기화를 수행합니다.
   */
  async onModuleInit(): Promise<void> {
    if (!this.syncEnabled) {
      this.logger.log(
        '직원 동기화가 비활성화되어 있어 초기 동기화를 건너뜁니다.',
      );
      return;
    }

    try {
      this.logger.log('모듈 초기화: 직원 데이터 확인 중...');

      // 직원 데이터 개수 확인
      const stats = await this.employeeRepository.getEmployeeStats();

      if (stats.totalEmployees === 0) {
        this.logger.log('직원 데이터가 없습니다. 초기 동기화를 시작합니다...');
        const result = await this.syncEmployees(true);

        if (result.success) {
          this.logger.log(
            `초기 동기화 완료: ${result.created}개 생성, ${result.updated}개 업데이트`,
          );
        } else {
          this.logger.error(`초기 동기화 실패: ${result.errors.join(', ')}`);
        }
      } else {
        this.logger.log(
          `기존 직원 데이터 ${stats.totalEmployees}개 확인됨. 초기 동기화를 건너뜁니다.`,
        );
      }
    } catch (error) {
      this.logger.error(`모듈 초기화 중 오류 발생: ${error.message}`);
      // 초기화 오류는 애플리케이션 시작을 막지 않습니다
    }
  }

  /**
   * SSO 서비스에서 직원 데이터 조회
   */
  async fetchExternalEmployees(): Promise<EmployeeInfo[]> {
    try {
      // SSO에서 모든 직원 정보를 상세 정보 포함하여 조회
      const employees = await this.ssoService.여러직원정보를조회한다({
        withDetail: true,
        includeTerminated: false, // 퇴사자 제외
      });

      this.logger.log(
        `SSO에서 ${employees.length}개의 직원 데이터를 조회했습니다.`,
      );

      return employees;
    } catch (error) {
      this.logger.error('SSO 직원 API 조회 실패:', error.message);
      throw new HttpException(
        'SSO 직원 데이터 조회에 실패했습니다.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * SSO 직원 정보를 내부 엔티티로 변환
   */
  private mapSSOEmployeeToDto(ssoEmployee: EmployeeInfo): CreateEmployeeDto {
    // SSO의 EmployeeInfo 구조에서 필요한 정보 추출
    const departmentId = ssoEmployee.department?.id;
    const departmentName = ssoEmployee.department?.departmentName;
    const departmentCode = ssoEmployee.department?.departmentCode;

    const positionId = ssoEmployee.position?.id;

    // jobTitle이 rank(직책)에 해당
    const rankId = ssoEmployee.jobTitle?.id;
    const rankName = ssoEmployee.jobTitle?.jobTitleName;
    const rankLevel = ssoEmployee.jobTitle?.jobTitleLevel;

    // 퇴사자 여부에 따른 상태 설정
    const status = ssoEmployee.isTerminated ? '퇴사' : '재직중';

    return {
      employeeNumber: ssoEmployee.employeeNumber,
      name: ssoEmployee.name,
      email: ssoEmployee.email,
      phoneNumber: ssoEmployee.phoneNumber || undefined,
      dateOfBirth: undefined, // SSO에서 제공하지 않음
      gender: undefined, // SSO에서 제공하지 않음
      hireDate: undefined, // SSO에서 제공하지 않음
      managerId: undefined, // SSO에서 제공하지 않음
      status: status,
      departmentId: departmentId,
      departmentName: departmentName,
      departmentCode: departmentCode,
      positionId: positionId,
      rankId: rankId,
      rankName: rankName,
      rankCode: undefined, // SSO에서 제공하지 않음
      rankLevel: rankLevel,
      externalId: ssoEmployee.id,
      externalCreatedAt: new Date(), // SSO에서 제공하지 않으므로 현재 시간 사용
      externalUpdatedAt: new Date(),
      roles: undefined, // SSO 로그인 시에만 제공됨 (EmployeeInfo에는 포함되지 않음)
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

      // 1. SSO에서 직원 데이터 조회
      const ssoEmployees = await this.fetchExternalEmployees();

      totalProcessed = ssoEmployees.length;

      // 2. 각 직원 데이터 처리
      const employeesToSave: Employee[] = [];

      for (const ssoEmp of ssoEmployees) {
        try {
          // 기존 직원 확인 (employeeNumber 우선)
          let existingEmployee =
            await this.employeeRepository.findByEmployeeNumber(
              ssoEmp.employeeNumber,
            );

          // employeeNumber로 못 찾으면 externalId로 조회
          if (!existingEmployee) {
            existingEmployee = await this.employeeRepository.findByExternalId(
              ssoEmp.id,
            );
          }

          const mappedData = this.mapSSOEmployeeToDto(ssoEmp);

          if (existingEmployee) {
            // 업데이트가 필요한지 확인 (forceSync 또는 정보 변경 시)
            let needsUpdate = forceSync;

            // 직급 정보가 없는 경우 강제 업데이트
            const hasRankData = mappedData.rankId || mappedData.rankName;
            const missingRankData =
              !existingEmployee.rankId && !existingEmployee.rankName;
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
                existingEmployee.rankLevel !== mappedData.rankLevel)
            ) {
              needsUpdate = true;
              this.logger.debug(
                `직원 ${existingEmployee.name}의 직급 정보가 변경되어 업데이트합니다.`,
              );
            }

            // 부서 정보가 없는 경우 강제 업데이트
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

            if (needsUpdate) {
              // 기존 직원 업데이트
              Object.assign(existingEmployee, {
                employeeNumber: mappedData.employeeNumber,
                name: mappedData.name,
                email: mappedData.email,
                phoneNumber: mappedData.phoneNumber,
                status: mappedData.status,
                departmentId: mappedData.departmentId,
                departmentName: mappedData.departmentName,
                departmentCode: mappedData.departmentCode,
                positionId: mappedData.positionId,
                rankId: mappedData.rankId,
                rankName: mappedData.rankName,
                rankLevel: mappedData.rankLevel,
                externalUpdatedAt: mappedData.externalUpdatedAt,
                lastSyncAt: syncStartTime,
                updatedBy: this.systemUserId,
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
            newEmployee.createdBy = this.systemUserId;
            newEmployee.updatedBy = this.systemUserId;

            employeesToSave.push(newEmployee);
            created++;
          }
        } catch (error) {
          const errorMsg = `직원 ${ssoEmp.name} 처리 실패: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // 3. 일괄 저장 (중복 키 에러 처리)
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
                  // 중복 키 에러 발생 시 기존 데이터를 찾아서 업데이트
                  this.logger.debug(
                    `직원 ${employee.name} (${employee.employeeNumber}) 중복 발생, 재조회 후 업데이트 시도`,
                  );

                  try {
                    // 중복 키가 어떤 필드인지 확인하고 해당 필드로 재조회
                    let existingEmployee: Employee | null = null;

                    // 1. employeeNumber로 재조회 시도 (가장 신뢰할 수 있는 식별자)
                    existingEmployee =
                      await this.employeeRepository.findByEmployeeNumber(
                        employee.employeeNumber,
                      );

                    if (existingEmployee) {
                      this.logger.debug(
                        `직원 ${employee.name}을 employeeNumber로 찾음`,
                      );
                    }

                    // 2. employeeNumber로 못 찾으면 email로 재조회
                    if (!existingEmployee) {
                      existingEmployee =
                        await this.employeeRepository.findByEmail(
                          employee.email,
                        );
                      if (existingEmployee) {
                        this.logger.debug(
                          `직원 ${employee.name}을 email로 찾음`,
                        );
                      }
                    }

                    // 3. email로도 못 찾으면 externalId로 재조회
                    if (!existingEmployee) {
                      existingEmployee =
                        await this.employeeRepository.findByExternalId(
                          employee.externalId,
                        );
                      if (existingEmployee) {
                        this.logger.debug(
                          `직원 ${employee.name}을 externalId로 찾음`,
                        );
                      }
                    }

                    if (existingEmployee) {
                      // 기존 엔티티에 새 데이터 덮어쓰기 (모든 필드 업데이트)
                      Object.assign(existingEmployee, {
                        employeeNumber: employee.employeeNumber,
                        name: employee.name,
                        email: employee.email,
                        phoneNumber: employee.phoneNumber,
                        dateOfBirth: employee.dateOfBirth,
                        gender: employee.gender,
                        hireDate: employee.hireDate,
                        managerId: employee.managerId,
                        status: employee.status,
                        departmentId: employee.departmentId,
                        departmentName: employee.departmentName,
                        departmentCode: employee.departmentCode,
                        positionId: employee.positionId,
                        rankId: employee.rankId,
                        rankName: employee.rankName,
                        rankCode: employee.rankCode,
                        rankLevel: employee.rankLevel,
                        externalId: employee.externalId, // externalId도 업데이트
                        externalCreatedAt: employee.externalCreatedAt,
                        externalUpdatedAt: employee.externalUpdatedAt,
                        lastSyncAt: employee.lastSyncAt,
                        updatedBy: this.systemUserId,
                      });

                      await this.employeeRepository.save(existingEmployee);
                      savedCount++;
                      this.logger.debug(
                        `직원 ${employee.name} (${employee.employeeNumber}) 업데이트 완료`,
                      );
                    } else {
                      this.logger.warn(
                        `직원 ${employee.name} (${employee.employeeNumber}) 재조회 실패, 건너뜀. ` +
                          `externalId=${employee.externalId}, employeeNumber=${employee.employeeNumber}, email=${employee.email}`,
                      );
                      skippedCount++;
                    }
                  } catch (retryError) {
                    const errorMsg = `직원 ${employee.name} 재조회/업데이트 실패: ${retryError.message}`;
                    this.logger.error(errorMsg);
                    errors.push(errorMsg);
                    skippedCount++;
                  }
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
