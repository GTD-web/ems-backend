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
exports.GetSubDepartmentsQueryHandler = exports.GetSubDepartmentsQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const department_service_1 = require("../../../domain/common/department/department.service");
class GetSubDepartmentsQuery {
    departmentId;
    constructor(departmentId) {
        this.departmentId = departmentId;
    }
}
exports.GetSubDepartmentsQuery = GetSubDepartmentsQuery;
let GetSubDepartmentsQueryHandler = class GetSubDepartmentsQueryHandler {
    departmentService;
    constructor(departmentService) {
        this.departmentService = departmentService;
    }
    async execute(query) {
        const { departmentId } = query;
        const department = await this.departmentService.findById(departmentId);
        if (!department) {
            return [];
        }
        return this.departmentService.하위_부서_조회한다(department.externalId);
    }
};
exports.GetSubDepartmentsQueryHandler = GetSubDepartmentsQueryHandler;
exports.GetSubDepartmentsQueryHandler = GetSubDepartmentsQueryHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetSubDepartmentsQuery),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [department_service_1.DepartmentService])
], GetSubDepartmentsQueryHandler);
//# sourceMappingURL=get-sub-departments.handler.js.map