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
exports.GetManagerQueryHandler = exports.GetManagerQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
class GetManagerQuery {
    employeeId;
    constructor(employeeId) {
        this.employeeId = employeeId;
    }
}
exports.GetManagerQuery = GetManagerQuery;
let GetManagerQueryHandler = class GetManagerQueryHandler {
    employeeService;
    constructor(employeeService) {
        this.employeeService = employeeService;
    }
    async execute(query) {
        const { employeeId } = query;
        const employee = await this.employeeService.findById(employeeId);
        if (!employee || !employee.managerId) {
            return null;
        }
        const manager = await this.employeeService.findById(employee.managerId);
        return manager ? manager.DTO로_변환한다() : null;
    }
};
exports.GetManagerQueryHandler = GetManagerQueryHandler;
exports.GetManagerQueryHandler = GetManagerQueryHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetManagerQuery),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService])
], GetManagerQueryHandler);
//# sourceMappingURL=get-manager.handler.js.map