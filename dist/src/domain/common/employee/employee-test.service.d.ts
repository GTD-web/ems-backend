import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { EmployeeDto } from './employee.types';
import { Department } from '@domain/common/department/department.entity';
export declare class EmployeeTestService {
    private readonly employeeRepository;
    private readonly departmentRepository;
    constructor(employeeRepository: Repository<Employee>, departmentRepository: Repository<Department>);
    직원_데이터를_확인하고_생성한다(minCount?: number): Promise<EmployeeDto[]>;
    테스트용_목데이터를_생성한다(): Promise<EmployeeDto[]>;
    현재_직원_수를_조회한다(): Promise<number>;
    부서별_직원_테스트데이터를_생성한다(departmentId: string, count?: number): Promise<EmployeeDto[]>;
    매니저_하위직원_테스트데이터를_생성한다(managerCount: string | number, employeesPerManager?: number): Promise<EmployeeDto[]>;
    특정_직원_테스트데이터를_생성한다(employeeData: {
        employeeNumber?: string;
        name?: string;
        email?: string;
        phoneNumber?: string;
        dateOfBirth?: Date;
        gender?: 'MALE' | 'FEMALE';
        hireDate?: Date;
        status?: '재직중' | '휴직중' | '퇴사';
        isExcludedFromList?: boolean;
        departmentId?: string;
        managerId?: string;
        externalId?: string;
    }): Promise<EmployeeDto>;
    랜덤_테스트데이터를_생성한다(count?: number): Promise<EmployeeDto[]>;
    테스트_데이터를_정리한다(): Promise<number>;
    모든_테스트데이터를_삭제한다(): Promise<number>;
}
