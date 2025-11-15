import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
import { NotFoundException } from '@nestjs/common';

/**
 * 직원의 접근 가능 여부를 변경하는 커맨드
 */
export class UpdateEmployeeAccessibilityCommand implements ICommand {
  constructor(
    public readonly employeeId: string,
    public readonly isAccessible: boolean,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 직원 접근 가능 여부 변경 핸들러
 */
@CommandHandler(UpdateEmployeeAccessibilityCommand)
export class UpdateEmployeeAccessibilityHandler
  implements ICommandHandler<UpdateEmployeeAccessibilityCommand>
{
  constructor(private readonly employeeService: EmployeeService) {}

  async execute(
    command: UpdateEmployeeAccessibilityCommand,
  ): Promise<EmployeeDto> {
    const { employeeId, isAccessible, updatedBy } = command;

    const result = await this.employeeService.접근가능여부변경한다(
      employeeId,
      isAccessible,
      updatedBy,
    );

    if (!result) {
      throw new NotFoundException(`직원을 찾을 수 없습니다. ID: ${employeeId}`);
    }

    return result;
  }
}
