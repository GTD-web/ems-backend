"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MockSSOService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockSSOService = void 0;
const common_1 = require("@nestjs/common");
const json_storage_util_1 = require("./utils/json-storage.util");
let MockSSOService = MockSSOService_1 = class MockSSOService {
    logger = new common_1.Logger(MockSSOService_1.name);
    async 초기화한다() {
        this.logger.log('Mock SSO 서비스 초기화 완료 (JSON 파일에서 데이터 로드)');
    }
    로드한다(methodName, params) {
        const data = json_storage_util_1.JsonStorageUtil.loadResponse(methodName, params);
        if (data === null) {
            this.logger.warn(`저장된 응답 데이터 없음: ${methodName}, 파라미터: ${JSON.stringify(params)}`);
            return null;
        }
        return data;
    }
    async 로그인한다(email, password) {
        const result = this.로드한다('로그인한다', { email });
        if (!result) {
            throw new Error(`로그인 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 로그인하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug(`Mock 로그인: ${email}`);
        return result;
    }
    async 토큰을검증한다(accessToken) {
        const result = this.로드한다('토큰을검증한다', {
            accessToken: '***',
        });
        if (!result) {
            throw new Error(`토큰 검증 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 토큰을 검증하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug('Mock 토큰 검증');
        return result;
    }
    async 토큰을갱신한다(refreshToken) {
        const result = this.로드한다('토큰을갱신한다', {
            refreshToken: '***',
        });
        if (!result) {
            throw new Error(`토큰 갱신 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 토큰을 갱신하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug('Mock 토큰 갱신');
        return result;
    }
    async 비밀번호를확인한다(accessToken, password, email) {
        const result = this.로드한다('비밀번호를확인한다', {
            accessToken: '***',
            email,
        });
        if (!result) {
            throw new Error(`비밀번호 확인 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 비밀번호를 확인하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug(`Mock 비밀번호 확인: ${email}`);
        return result;
    }
    async 비밀번호를변경한다(accessToken, newPassword) {
        const result = this.로드한다('비밀번호를변경한다', {
            accessToken: '***',
        });
        if (!result) {
            throw new Error(`비밀번호 변경 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 비밀번호를 변경하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug('Mock 비밀번호 변경');
        return result;
    }
    async 직원정보를조회한다(params) {
        const result = this.로드한다('직원정보를조회한다', params);
        if (!result) {
            throw new Error(`직원 정보 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 직원 정보를 조회하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug(`Mock 직원 정보 조회: ${params.employeeNumber || params.employeeId}`);
        return result;
    }
    async 여러직원정보를조회한다(params) {
        const result = this.로드한다('여러직원정보를조회한다', params);
        if (!result) {
            throw new Error(`여러 직원 정보 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 여러 직원 정보를 조회하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug(`Mock 여러 직원 정보 조회: ${params.identifiers?.length || 0}명`);
        return result;
    }
    async 여러직원원시정보를조회한다(params) {
        const rawResult = this.로드한다('여러직원원시정보를조회한다', params);
        if (rawResult) {
            this.logger.debug(`Mock 여러 직원 원시 정보 조회: ${rawResult.length}명`);
            return rawResult;
        }
        const convertedResult = this.로드한다('여러직원정보를조회한다', params);
        if (!convertedResult) {
            throw new Error(`여러 직원 원시 정보 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 여러 직원 정보를 조회하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug(`Mock 여러 직원 원시 정보 조회 (변환된 데이터 사용): ${convertedResult.length}명`);
        return convertedResult;
    }
    async 부서계층구조를조회한다(params) {
        const result = this.로드한다('부서계층구조를조회한다', params || {});
        if (!result) {
            throw new Error(`부서 계층구조 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 부서 계층구조를 조회하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug(`Mock 부서 계층구조 조회: ${result.totalDepartments}개 부서`);
        return result;
    }
    async 직원관리자정보를조회한다() {
        const result = this.로드한다('직원관리자정보를조회한다', {});
        if (!result) {
            throw new Error(`직원 관리자 정보 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 직원 관리자 정보를 조회하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug(`Mock 직원 관리자 정보 조회: ${result.total}명`);
        return result;
    }
    async FCM토큰을구독한다(params) {
        const result = this.로드한다('FCM토큰을구독한다', params);
        if (!result) {
            throw new Error(`FCM 토큰 구독 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 FCM 토큰을 구독하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug(`Mock FCM 토큰 구독: ${params.employeeNumber}`);
        return result;
    }
    async FCM토큰을구독해지한다(params) {
        const result = this.로드한다('FCM토큰을구독해지한다', params);
        if (!result) {
            throw new Error(`FCM 토큰 구독 해지 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 FCM 토큰 구독을 해지하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug(`Mock FCM 토큰 구독 해지: ${params.employeeNumber}`);
        return result;
    }
    async FCM토큰을조회한다(params) {
        const result = this.로드한다('FCM토큰을조회한다', params);
        if (!result) {
            throw new Error(`FCM 토큰 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 FCM 토큰을 조회하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug(`Mock FCM 토큰 조회: ${params.employeeNumber}`);
        return result;
    }
    async 여러직원의FCM토큰을조회한다(params) {
        const result = this.로드한다('여러직원의FCM토큰을조회한다', params);
        if (!result) {
            throw new Error(`여러 직원의 FCM 토큰 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 여러 직원의 FCM 토큰을 조회하여 JSON 파일을 생성하세요.`);
        }
        this.logger.debug(`Mock 여러 직원의 FCM 토큰 조회: ${params.employeeNumbers.length}명`);
        return result;
    }
    async 사번으로직원을조회한다(employeeNumber) {
        return this.직원정보를조회한다({
            employeeNumber,
            withDetail: true,
        });
    }
    async 이메일로직원을조회한다(email) {
        const employees = await this.여러직원정보를조회한다({
            withDetail: true,
        });
        return employees.find((emp) => emp.email === email) || null;
    }
    async 모든부서정보를조회한다(params) {
        const result = this.로드한다('모든부서정보를조회한다', params || {});
        if (!result) {
            const hierarchy = await this.부서계층구조를조회한다({
                ...params,
                includeEmptyDepartments: true,
                withEmployeeDetail: false,
            });
            const departments = [];
            const flattenDepartments = (nodes) => {
                for (const node of nodes) {
                    departments.push({
                        id: node.id,
                        departmentCode: node.departmentCode,
                        departmentName: node.departmentName,
                        parentDepartmentId: node.parentDepartmentId,
                    });
                    if (node.children && node.children.length > 0) {
                        flattenDepartments(node.children);
                    }
                }
            };
            flattenDepartments(hierarchy.departments);
            return departments;
        }
        this.logger.debug(`Mock 모든 부서 정보 조회: ${result.length}개`);
        return result;
    }
    async 모든직원정보를조회한다(params) {
        const result = this.로드한다('모든직원정보를조회한다', params || {});
        if (!result) {
            const hierarchy = await this.부서계층구조를조회한다({
                ...params,
                includeEmptyDepartments: true,
                withEmployeeDetail: true,
            });
            const employees = [];
            const flattenEmployees = (nodes) => {
                for (const node of nodes) {
                    if (node.employees && node.employees.length > 0) {
                        employees.push(...node.employees);
                    }
                    if (node.children && node.children.length > 0) {
                        flattenEmployees(node.children);
                    }
                }
            };
            flattenEmployees(hierarchy.departments);
            return employees;
        }
        this.logger.debug(`Mock 모든 직원 정보 조회: ${result.length}명`);
        return result;
    }
};
exports.MockSSOService = MockSSOService;
exports.MockSSOService = MockSSOService = MockSSOService_1 = __decorate([
    (0, common_1.Injectable)()
], MockSSOService);
//# sourceMappingURL=sso.service.mock.js.map