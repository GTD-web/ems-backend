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
var JwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_context_1 = require("../../../context/auth-context");
const decorators_1 = require("../decorators");
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard {
    authService;
    reflector;
    logger = new common_1.Logger(JwtAuthGuard_1.name);
    constructor(authService, reflector) {
        this.authService = authService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(decorators_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        console.log('🚀 ~ JwtAuthGuard ~ canActivate ~ token:', token);
        if (!token) {
            throw new common_1.UnauthorizedException('인증 토큰이 필요합니다.');
        }
        try {
            const result = await this.authService.토큰검증및사용자조회(token);
            request['user'] = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                employeeNumber: result.user.employeeNumber,
                roles: result.user.roles,
            };
            if (result.isSynced) {
                this.logger.debug(`사용자 정보 동기화 완료: ${result.user.employeeNumber}`);
            }
            return true;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error('토큰 검증 중 오류 발생:', error);
            throw new common_1.UnauthorizedException('토큰 검증에 실패했습니다.');
        }
    }
    extractTokenFromHeader(request) {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return undefined;
        }
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            return undefined;
        }
        return token;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_context_1.AuthService,
        core_1.Reflector])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map