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
var RolesGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("../decorators/roles.decorator");
let RolesGuard = RolesGuard_1 = class RolesGuard {
    reflector;
    logger = new common_1.Logger(RolesGuard_1.name);
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            this.logger.error('사용자 정보가 없습니다. JwtAuthGuard가 먼저 실행되어야 합니다.');
            throw new common_1.ForbiddenException('인증 정보가 없습니다.');
        }
        const userRoles = user.roles || [];
        const hasRole = requiredRoles.some((role) => userRoles.includes(role));
        if (!hasRole) {
            this.logger.warn(`접근 거부: 사용자 ${user.email}은(는) 필요한 역할이 없습니다. ` +
                `필요 역할: [${requiredRoles.join(', ')}], ` +
                `보유 역할: [${userRoles.join(', ')}]`);
            throw new common_1.ForbiddenException(`이 작업을 수행할 권한이 없습니다. 필요한 역할: ${requiredRoles.join(', ')}`);
        }
        this.logger.debug(`역할 검증 통과: 사용자 ${user.email}, 역할: [${userRoles.join(', ')}]`);
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = RolesGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map