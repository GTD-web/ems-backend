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
var VerifyAndSyncUserHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAndSyncUserHandler = void 0;
const common_1 = require("@nestjs/common");
const sso_1 = require("../../../domain/common/sso");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
let VerifyAndSyncUserHandler = VerifyAndSyncUserHandler_1 = class VerifyAndSyncUserHandler {
    ssoService;
    employeeService;
    logger = new common_1.Logger(VerifyAndSyncUserHandler_1.name);
    constructor(ssoService, employeeService) {
        this.ssoService = ssoService;
        this.employeeService = employeeService;
    }
    async execute(command) {
        const { accessToken } = command;
        try {
            const verifyResult = await this.ssoService.토큰을검증한다(accessToken);
            const requestedEmployeeNumber = verifyResult.user_info.employee_number;
            let employee = await this.employeeService.findByEmployeeNumber(requestedEmployeeNumber);
            if (!employee) {
                this.logger.log(`시스템에 등록되지 않은 직원 발견. 기본 정보로 자동 생성합니다: ${requestedEmployeeNumber}`);
                try {
                    employee = await this.employeeService.create({
                        employeeNumber: requestedEmployeeNumber,
                        name: verifyResult.user_info.name,
                        email: verifyResult.user_info.email,
                        externalId: verifyResult.user_info.id,
                        status: '재직중',
                        externalCreatedAt: new Date(),
                        externalUpdatedAt: new Date(),
                        lastSyncAt: new Date(),
                        isExcludedFromList: false,
                        isAccessible: true,
                    });
                    this.logger.log(`직원 자동 생성 완료: ${employee.employeeNumber} (${employee.name})`);
                }
                catch (error) {
                    this.logger.error(`직원 자동 생성 실패: ${requestedEmployeeNumber}`, error);
                    throw new common_1.UnauthorizedException('직원 정보 생성 중 오류가 발생했습니다. 관리자에게 문의하세요.');
                }
            }
            if (employee.employeeNumber !== requestedEmployeeNumber) {
                this.logger.warn(`사번 불일치: 요청된 사번(${requestedEmployeeNumber})과 조회된 사번(${employee.employeeNumber})이 일치하지 않습니다.`);
                throw new common_1.UnauthorizedException('사용자 정보가 일치하지 않습니다. 관리자에게 문의하세요.');
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
            return {
                user: userInfo,
                isSynced: false,
            };
        }
        catch (error) {
            this.logger.error('토큰 검증 실패:', error);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error('토큰 검증 실패:', error);
            throw new common_1.UnauthorizedException('인증에 실패했습니다.');
        }
    }
};
exports.VerifyAndSyncUserHandler = VerifyAndSyncUserHandler;
exports.VerifyAndSyncUserHandler = VerifyAndSyncUserHandler = VerifyAndSyncUserHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sso_1.SSOService)),
    __metadata("design:paramtypes", [Object, employee_service_1.EmployeeService])
], VerifyAndSyncUserHandler);
//# sourceMappingURL=verify-and-sync-user.handler.js.map