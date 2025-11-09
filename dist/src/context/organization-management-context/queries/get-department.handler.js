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
exports.GetDepartmentQueryHandler = exports.GetDepartmentQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const department_service_1 = require("../../../domain/common/department/department.service");
class GetDepartmentQuery {
    departmentId;
    constructor(departmentId) {
        this.departmentId = departmentId;
    }
}
exports.GetDepartmentQuery = GetDepartmentQuery;
let GetDepartmentQueryHandler = class GetDepartmentQueryHandler {
    departmentService;
    constructor(departmentService) {
        this.departmentService = departmentService;
    }
    async execute(query) {
        const { departmentId } = query;
        return this.departmentService.ID로_조회한다(departmentId);
    }
};
exports.GetDepartmentQueryHandler = GetDepartmentQueryHandler;
exports.GetDepartmentQueryHandler = GetDepartmentQueryHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetDepartmentQuery),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [department_service_1.DepartmentService])
], GetDepartmentQueryHandler);
//# sourceMappingURL=get-department.handler.js.map