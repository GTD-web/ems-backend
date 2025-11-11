import { ProjectStatus } from './project.types';
export interface IProject {
    readonly id: string;
    readonly name: string;
    readonly projectCode?: string;
    readonly status: ProjectStatus;
    readonly startDate?: Date;
    readonly endDate?: Date;
    readonly managerId?: string;
}
