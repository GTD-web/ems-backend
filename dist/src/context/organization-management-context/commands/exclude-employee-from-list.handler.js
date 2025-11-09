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
exports.ExcludeEmployeeFromListHandler = exports.ExcludeEmployeeFromListCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
const common_1 = require("@nestjs/common");
class ExcludeEmployeeFromListCommand {
    employeeId;
    excludeReason;
    excludedBy;
    constructor(employeeId, excludeReason, excludedBy) {
        this.employeeId = employeeId;
        this.excludeReason = excludeReason;
        this.excludedBy = excludedBy;
    }
}
exports.ExcludeEmployeeFromListCommand = ExcludeEmployeeFromListCommand;
let ExcludeEmployeeFromListHandler = class ExcludeEmployeeFromListHandler {
    employeeService;
    constructor(employeeService) {
        this.employeeService = employeeService;
    }
    async execute(command) {
        const { employeeId, excludeReason, excludedBy } = command;
        const result = await this.employeeService.조회에서_제외한다(employeeId, excludeReason, excludedBy);
        if (!result) {
            throw new common_1.NotFoundException(`직원을 찾을 수 없습니다. ID: ${employeeId}`);
        }
        return result;
    }
};
exports.ExcludeEmployeeFromListHandler = ExcludeEmployeeFromListHandler;
exports.ExcludeEmployeeFromListHandler = ExcludeEmployeeFromListHandler = __decorate([
    (0, cqrs_1.CommandHandler)(ExcludeEmployeeFromListCommand),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService])
], ExcludeEmployeeFromListHandler);
//# sourceMappingURL=exclude-employee-from-list.handler.js.map