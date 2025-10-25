import { Injectable, Logger } from '@nestjs/common';
import { EmployeeService } from '@domain/common/employee/employee.service';
import {
  GetUserWithRolesQuery,
  GetUserWithRolesResult,
  AuthenticatedUserInfo,
} from '../interfaces/auth-context.interface';

/**
 * 역할 포함 사용자 조회 핸들러
 *
 * Employee 정보와 역할 정보를 함께 조회합니다.
 */
@Injectable()
export class GetUserWithRolesHandler {
  private readonly logger = new Logger(GetUserWithRolesHandler.name);

  constructor(private readonly employeeService: EmployeeService) {}

  async execute(query: GetUserWithRolesQuery): Promise<GetUserWithRolesResult> {
    const { employeeNumber } = query;

    try {
      const employee =
        await this.employeeService.findByEmployeeNumber(employeeNumber);

      if (!employee) {
        return { user: null };
      }

      const userInfo: AuthenticatedUserInfo = {
        id: employee.id,
        externalId: employee.externalId,
        email: employee.email,
        name: employee.name,
        employeeNumber: employee.employeeNumber,
        roles: employee['roles'] || [],
        status: employee.status,
      };

      return { user: userInfo };
    } catch (error) {
      this.logger.error(`사용자 조회 실패 (${employeeNumber}):`, error.message);
      return { user: null };
    }
  }
}
