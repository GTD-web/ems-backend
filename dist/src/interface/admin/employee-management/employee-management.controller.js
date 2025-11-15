"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeManagementController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const organization_management_service_1 = require("../../../context/organization-management-context/organization-management.service");
const parse_uuid_decorator_1 = require("../../common/decorators/parse-uuid.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const employee_management_api_decorators_1 = require("./decorators/employee-management-api.decorators");
const employee_management_dto_1 = require("./dto/employee-management.dto");
let EmployeeManagementController = class EmployeeManagementController {
    organizationManagementService;
    constructor(organizationManagementService) {
        this.organizationManagementService = organizationManagementService;
    }
    async getDepartmentHierarchy() {
        return await this.organizationManagementService.부서하이라키조회();
    }
    async getDepartmentHierarchyWithEmployees() {
        return await this.organizationManagementService.부서하이라키_직원포함_조회();
    }
    async getAllEmployees(query) {
        return await this.organizationManagementService.전체직원목록조회(query.includeExcluded || false, query.departmentId);
    }
    async getExcludedEmployees() {
        const allEmployees = await this.organizationManagementService.전체직원목록조회(true);
        return allEmployees.filter((employee) => employee.isExcludedFromList);
    }
    async excludeEmployeeFromList(employeeId, excludeData, user) {
        return await this.organizationManagementService.직원조회제외(employeeId, excludeData.excludeReason, user.id);
    }
    async includeEmployeeInList(employeeId, user) {
        return await this.organizationManagementService.직원조회포함(employeeId, user.id);
    }
    async updateEmployeeAccessibility(employeeId, isAccessible, user) {
        return await this.organizationManagementService.직원접근가능여부변경(employeeId, isAccessible, user.id);
    }
};
exports.EmployeeManagementController = EmployeeManagementController;
__decorate([
    (0, employee_management_api_decorators_1.GetDepartmentHierarchy)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "getDepartmentHierarchy", null);
__decorate([
    (0, employee_management_api_decorators_1.GetDepartmentHierarchyWithEmployees)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "getDepartmentHierarchyWithEmployees", null);
__decorate([
    (0, employee_management_api_decorators_1.GetAllEmployees)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [employee_management_dto_1.GetEmployeesQueryDto]),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "getAllEmployees", null);
__decorate([
    (0, employee_management_api_decorators_1.GetExcludedEmployees)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "getExcludedEmployees", null);
__decorate([
    (0, employee_management_api_decorators_1.ExcludeEmployeeFromList)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, employee_management_dto_1.ExcludeEmployeeFromListDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "excludeEmployeeFromList", null);
__decorate([
    (0, employee_management_api_decorators_1.IncludeEmployeeInList)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "includeEmployeeInList", null);
__decorate([
    (0, employee_management_api_decorators_1.UpdateEmployeeAccessibility)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Query)('isAccessible', common_1.ParseBoolPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "updateEmployeeAccessibility", null);
exports.EmployeeManagementController = EmployeeManagementController = __decorate([
    (0, swagger_1.ApiTags)('A-1. 관리자 - 조직 관리'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('admin/employees'),
    __metadata("design:paramtypes", [organization_management_service_1.OrganizationManagementService])
], EmployeeManagementController);
//# sourceMappingURL=employee-management.controller.js.map