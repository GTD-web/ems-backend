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
var GetUserWithRolesHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserWithRolesHandler = void 0;
const common_1 = require("@nestjs/common");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
let GetUserWithRolesHandler = GetUserWithRolesHandler_1 = class GetUserWithRolesHandler {
    employeeService;
    logger = new common_1.Logger(GetUserWithRolesHandler_1.name);
    constructor(employeeService) {
        this.employeeService = employeeService;
    }
    async execute(query) {
        const { employeeNumber } = query;
        try {
            const employee = await this.employeeService.findByEmployeeNumber(employeeNumber);
            if (!employee) {
                return { user: null };
            }
            const userInfo = {
                id: employee.id,
                externalId: employee.externalId,
                email: employee.email,
                name: employee.name,
                employeeNumber: employee.employeeNumber,
                roles: employee['roles'] || [],
                status: employee.status,
            };
            return { user: userInfo };
        }
        catch (error) {
            this.logger.error(`사용자 조회 실패 (${employeeNumber}):`, error.message);
            return { user: null };
        }
    }
};
exports.GetUserWithRolesHandler = GetUserWithRolesHandler;
exports.GetUserWithRolesHandler = GetUserWithRolesHandler = GetUserWithRolesHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService])
], GetUserWithRolesHandler);
//# sourceMappingURL=get-user-with-roles.handler.js.map