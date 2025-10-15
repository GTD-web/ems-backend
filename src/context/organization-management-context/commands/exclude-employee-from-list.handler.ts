import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
import { NotFoundException } from '@nestjs/common';

/**
 * 직원을 조회 목록에서 제외하는 커맨드
 */
export class ExcludeEmployeeFromListCommand implements ICommand {
  constructor(
    public readonly employeeId: string,
    public readonly excludeReason: string,
    public readonly excludedBy: string,
  ) {}
}

/**
 * 직원 조회 목록 제외 핸들러
 */
@CommandHandler(ExcludeEmployeeFromListCommand)
export class ExcludeEmployeeFromListHandler
  implements ICommandHandler<ExcludeEmployeeFromListCommand>
{
  constructor(private readonly employeeService: EmployeeService) {}

  async execute(command: ExcludeEmployeeFromListCommand): Promise<EmployeeDto> {
    const { employeeId, excludeReason, excludedBy } = command;

    const result = await this.employeeService.조회에서_제외한다(
      employeeId,
      excludeReason,
      excludedBy,
    );

    if (!result) {
      throw new NotFoundException(`직원을 찾을 수 없습니다. ID: ${employeeId}`);
    }

    return result;
  }
}
