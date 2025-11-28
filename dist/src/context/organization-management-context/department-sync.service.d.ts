import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Department } from '../../domain/common/department/department.entity';
import { DepartmentService } from '../../domain/common/department/department.service';
import { DepartmentSyncResult } from '../../domain/common/department/department.types';
import type { ISSOService, DepartmentInfo } from '@domain/common/sso/interfaces';
export declare class DepartmentSyncService implements OnModuleInit {
    private readonly departmentService;
    private readonly configService;
    private readonly ssoService;
    private readonly logger;
    private readonly syncEnabled;
    private readonly systemUserId;
    constructor(departmentService: DepartmentService, configService: ConfigService, ssoService: ISSOService);
    onModuleInit(): Promise<void>;
    fetchExternalDepartments(): Promise<DepartmentInfo[]>;
    private mapSSODepartmentToDto;
    syncDepartments(forceSync?: boolean): Promise<DepartmentSyncResult>;
    private SSO에_없는_부서를_삭제한다;
    scheduledSync(): Promise<void>;
    triggerManualSync(): Promise<DepartmentSyncResult>;
    getDepartments(forceRefresh?: boolean): Promise<Department[]>;
    getDepartmentById(id: string, forceRefresh?: boolean): Promise<Department | null>;
    getDepartmentByExternalId(externalId: string, forceRefresh?: boolean): Promise<Department | null>;
}
