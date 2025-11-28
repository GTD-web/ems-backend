import { SeedDataService } from '@context/seed-data-context/seed-data.service';
import { SeedDataConfigDto, RealDataSeedConfigDto, AddNewEmployeesDto, AddNewEmployeesResultDto, RemoveAllNewEmployeesResultDto } from '@interface/common/dto/seed-data';
import { SeedDataResultDto } from '@interface/common/dto/seed-data/seed-data-result.dto';
import { GetSeedDataStatusDto } from '@interface/common/dto/seed-data/get-seed-data-status.dto';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { DepartmentService } from '@domain/common/department/department.service';
import { Employee } from '@domain/common/employee/employee.entity';
import { Repository } from 'typeorm';
export declare class SeedDataController {
    private readonly seedDataService;
    private readonly employeeService;
    private readonly departmentService;
    private readonly employeeRepository;
    private readonly logger;
    constructor(seedDataService: SeedDataService, employeeService: EmployeeService, departmentService: DepartmentService, employeeRepository: Repository<Employee>);
    generateSeedData(config: SeedDataConfigDto, req: any): Promise<SeedDataResultDto>;
    generateSeedDataWithRealData(config: RealDataSeedConfigDto, req: any): Promise<SeedDataResultDto>;
    clearSeedData(): Promise<{
        message: string;
    }>;
    getSeedDataStatus(): Promise<GetSeedDataStatusDto>;
    addNewEmployees(dto: AddNewEmployeesDto): Promise<AddNewEmployeesResultDto>;
    removeAllNewEmployees(): Promise<RemoveAllNewEmployeesResultDto>;
}
