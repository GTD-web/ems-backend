import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
import { NotFoundException } from '@nestjs/common';

/**
 * 직원을 조회 목록에 포함하는 커맨드
 */
export class IncludeEmployeeInListCommand implements ICommand {
  constructor(
    public readonly employeeId: string,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 직원 조회 목록 포함 핸들러
 */
@CommandHandler(IncludeEmployeeInListCommand)
export class IncludeEmployeeInListHandler
  implements ICommandHandler<IncludeEmployeeInListCommand>
{
  constructor(private readonly employeeService: EmployeeService) {}

  async execute(command: IncludeEmployeeInListCommand): Promise<EmployeeDto> {
    const { employeeId, updatedBy } = command;

    const result = await this.employeeService.조회에_포함한다(
      employeeId,
      updatedBy,
    );

    if (!result) {
      throw new NotFoundException(`직원을 찾을 수 없습니다. ID: ${employeeId}`);
    }

    return result;
  }
}
