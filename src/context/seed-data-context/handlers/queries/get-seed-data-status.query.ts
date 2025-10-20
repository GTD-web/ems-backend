import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';

export class GetSeedDataStatusQuery {}

export interface SeedDataStatus {
  hasData: boolean;
  entityCounts: Record<string, number>;
}

@Injectable()
@QueryHandler(GetSeedDataStatusQuery)
export class GetSeedDataStatusHandler
  implements IQueryHandler<GetSeedDataStatusQuery, SeedDataStatus>
{
  private readonly logger = new Logger(GetSeedDataStatusHandler.name);

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
    @InjectRepository(EvaluationPeriod)
    private readonly periodRepository: Repository<EvaluationPeriod>,
  ) {}

  async execute(query: GetSeedDataStatusQuery): Promise<SeedDataStatus> {
    this.logger.log('시드 데이터 상태 조회');

    const [
      departmentCount,
      employeeCount,
      projectCount,
      wbsCount,
      periodCount,
    ] = await Promise.all([
      this.departmentRepository.count(),
      this.employeeRepository.count(),
      this.projectRepository.count(),
      this.wbsItemRepository.count(),
      this.periodRepository.count(),
    ]);

    const entityCounts = {
      Department: departmentCount,
      Employee: employeeCount,
      Project: projectCount,
      WbsItem: wbsCount,
      EvaluationPeriod: periodCount,
    };

    const hasData = Object.values(entityCounts).some((count) => count > 0);

    return {
      hasData,
      entityCounts,
    };
  }
}
