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
exports.IncludeEmployeeInListHandler = exports.IncludeEmployeeInListCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
const common_1 = require("@nestjs/common");
class IncludeEmployeeInListCommand {
    employeeId;
    updatedBy;
    constructor(employeeId, updatedBy) {
        this.employeeId = employeeId;
        this.updatedBy = updatedBy;
    }
}
exports.IncludeEmployeeInListCommand = IncludeEmployeeInListCommand;
let IncludeEmployeeInListHandler = class IncludeEmployeeInListHandler {
    employeeService;
    constructor(employeeService) {
        this.employeeService = employeeService;
    }
    async execute(command) {
        const { employeeId, updatedBy } = command;
        const result = await this.employeeService.조회에_포함한다(employeeId, updatedBy);
        if (!result) {
            throw new common_1.NotFoundException(`직원을 찾을 수 없습니다. ID: ${employeeId}`);
        }
        return result;
    }
};
exports.IncludeEmployeeInListHandler = IncludeEmployeeInListHandler;
exports.IncludeEmployeeInListHandler = IncludeEmployeeInListHandler = __decorate([
    (0, cqrs_1.CommandHandler)(IncludeEmployeeInListCommand),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService])
], IncludeEmployeeInListHandler);
//# sourceMappingURL=include-employee-in-list.handler.js.map