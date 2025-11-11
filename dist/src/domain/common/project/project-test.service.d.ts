import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { ProjectDto, ProjectStatus } from './project.types';
import { Employee } from '@domain/common/employee/employee.entity';
export declare class ProjectTestService {
    private readonly projectRepository;
    private readonly employeeRepository;
    constructor(projectRepository: Repository<Project>, employeeRepository: Repository<Employee>);
    테스트용_목데이터를_생성한다(): Promise<ProjectDto[]>;
    특정_프로젝트_테스트데이터를_생성한다(projectData: {
        name: string;
        projectCode?: string;
        status?: ProjectStatus;
        startDate?: Date;
        endDate?: Date;
        managerId?: string;
    }): Promise<ProjectDto>;
    랜덤_테스트데이터를_생성한다(count?: number): Promise<ProjectDto[]>;
    테스트_데이터를_정리한다(): Promise<number>;
    모든_테스트데이터를_삭제한다(): Promise<number>;
    상태별_프로젝트_테스트데이터를_생성한다(status: ProjectStatus, count?: number): Promise<ProjectDto[]>;
    매니저별_프로젝트_테스트데이터를_생성한다(managerId: string, count?: number): Promise<ProjectDto[]>;
    기간별_프로젝트_테스트데이터를_생성한다(startYear: number, endYear: number, count?: number): Promise<ProjectDto[]>;
}
