import { BaseEntity } from '@libs/database/base/base.entity';
import { DepartmentDto } from './department.types';
export declare class Department extends BaseEntity<DepartmentDto> {
    name: string;
    code: string;
    order: number;
    managerId?: string;
    parentDepartmentId?: string;
    externalId: string;
    externalCreatedAt: Date;
    externalUpdatedAt: Date;
    lastSyncAt?: Date;
    constructor(name?: string, code?: string, externalId?: string, order?: number, managerId?: string, parentDepartmentId?: string, externalCreatedAt?: Date, externalUpdatedAt?: Date);
    DTO로_변환한다(): DepartmentDto;
}
