"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationManagementContextModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const cqrs_1 = require("@nestjs/cqrs");
const department_module_1 = require("../../domain/common/department/department.module");
const employee_module_1 = require("../../domain/common/employee/employee.module");
const sso_module_1 = require("../../domain/common/sso/sso.module");
const organization_management_service_1 = require("./organization-management.service");
const employee_sync_service_1 = require("./employee-sync.service");
const department_sync_service_1 = require("./department-sync.service");
const queries_1 = require("./queries");
const commands_1 = require("./commands");
let OrganizationManagementContextModule = class OrganizationManagementContextModule {
};
exports.OrganizationManagementContextModule = OrganizationManagementContextModule;
exports.OrganizationManagementContextModule = OrganizationManagementContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            employee_module_1.EmployeeModule,
            department_module_1.DepartmentModule,
            sso_module_1.SSOModule,
            config_1.ConfigModule,
            schedule_1.ScheduleModule.forRoot(),
        ],
        providers: [
            organization_management_service_1.OrganizationManagementService,
            employee_sync_service_1.EmployeeSyncService,
            department_sync_service_1.DepartmentSyncService,
            ...queries_1.QUERY_HANDLERS,
            ...commands_1.COMMAND_HANDLERS,
        ],
        exports: [
            organization_management_service_1.OrganizationManagementService,
            employee_sync_service_1.EmployeeSyncService,
            department_sync_service_1.DepartmentSyncService,
            sso_module_1.SSOModule,
        ],
    })
], OrganizationManagementContextModule);
//# sourceMappingURL=organization-management-context.module.js.map