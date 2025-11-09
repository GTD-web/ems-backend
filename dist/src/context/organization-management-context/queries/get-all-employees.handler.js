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
exports.GetAllEmployeesQueryHandler = exports.GetAllEmployeesQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
class GetAllEmployeesQuery {
    includeExcluded;
    constructor(includeExcluded = false) {
        this.includeExcluded = includeExcluded;
    }
}
exports.GetAllEmployeesQuery = GetAllEmployeesQuery;
let GetAllEmployeesQueryHandler = class GetAllEmployeesQueryHandler {
    employeeService;
    constructor(employeeService) {
        this.employeeService = employeeService;
    }
    async execute(query) {
        const employees = await this.employeeService.findAll(query.includeExcluded);
        return employees.map((emp) => emp.DTO로_변환한다());
    }
};
exports.GetAllEmployeesQueryHandler = GetAllEmployeesQueryHandler;
exports.GetAllEmployeesQueryHandler = GetAllEmployeesQueryHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetAllEmployeesQuery),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService])
], GetAllEmployeesQueryHandler);
//# sourceMappingURL=get-all-employees.handler.js.map