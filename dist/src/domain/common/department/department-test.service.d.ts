import { Repository } from 'typeorm';
import { Department } from './department.entity';
import { DepartmentDto } from './department.types';
export declare class DepartmentTestService {
    private readonly departmentRepository;
    constructor(departmentRepository: Repository<Department>);
    테스트용_목데이터를_생성한다(): Promise<DepartmentDto[]>;
    테스트_데이터를_정리한다(): Promise<number>;
    모든_테스트데이터를_삭제한다(): Promise<number>;
}
