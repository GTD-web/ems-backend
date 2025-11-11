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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetParentDepartmentQueryHandler = exports.GetParentDepartmentQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const department_service_1 = require("../../../domain/common/department/department.service");
class GetParentDepartmentQuery {
    departmentId;
    constructor(departmentId) {
        this.departmentId = departmentId;
    }
}
exports.GetParentDepartmentQuery = GetParentDepartmentQuery;
let GetParentDepartmentQueryHandler = class GetParentDepartmentQueryHandler {
    departmentService;
    constructor(departmentService) {
        this.departmentService = departmentService;
    }
    async execute(query) {
        const { departmentId } = query;
        const department = await this.departmentService.findById(departmentId);
        if (!department || !department.parentDepartmentId) {
            return null;
        }
        const parentDepartment = await this.departmentService.findByExternalId(department.parentDepartmentId);
        return parentDepartment ? parentDepartment.DTO로_변환한다() : null;
    }
};
exports.GetParentDepartmentQueryHandler = GetParentDepartmentQueryHandler;
exports.GetParentDepartmentQueryHandler = GetParentDepartmentQueryHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetParentDepartmentQuery),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [department_service_1.DepartmentService])
], GetParentDepartmentQueryHandler);
//# sourceMappingURL=get-parent-department.handler.js.map