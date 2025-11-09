import { Repository } from 'typeorm';
import { Department } from './department.entity';
import { DepartmentDto, DepartmentFilter, DepartmentListOptions, DepartmentStatistics } from './department.types';
export declare class DepartmentService {
    private readonly departmentRepository;
    constructor(departmentRepository: Repository<Department>);
    ID로_조회한다(id: string): Promise<DepartmentDto | null>;
    부서코드로_조회한다(code: string): Promise<DepartmentDto | null>;
    외부ID로_조회한다(externalId: string): Promise<DepartmentDto | null>;
    부서명으로_조회한다(name: string): Promise<DepartmentDto | null>;
    필터_조회한다(filter: DepartmentFilter): Promise<DepartmentDto[]>;
    목록_조회한다(options?: DepartmentListOptions): Promise<{
        departments: DepartmentDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    전체_조회한다(): Promise<DepartmentDto[]>;
    최상위_부서_조회한다(): Promise<DepartmentDto[]>;
    하위_부서_조회한다(parentDepartmentId: string): Promise<DepartmentDto[]>;
    매니저별_조회한다(managerId: string): Promise<DepartmentDto[]>;
    존재하는가(id: string): Promise<boolean>;
    부서코드가_존재하는가(code: string): Promise<boolean>;
    외부ID가_존재하는가(externalId: string): Promise<boolean>;
    findById(id: string): Promise<Department | null>;
    findByExternalId(externalId: string): Promise<Department | null>;
    findAll(): Promise<Department[]>;
    findByFilter(filter: DepartmentFilter): Promise<Department[]>;
    save(department: Department): Promise<Department>;
    saveMany(departments: Department[]): Promise<Department[]>;
    findByCode(code: string): Promise<Department | null>;
    findByParentDepartmentId(parentDepartmentId: string): Promise<Department[]>;
    findRootDepartments(): Promise<Department[]>;
    getDepartmentStats(): Promise<DepartmentStatistics>;
    update(id: string, partialDepartment: Partial<Department>): Promise<Department>;
}
