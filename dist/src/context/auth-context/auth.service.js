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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const verify_and_sync_user_handler_1 = require("./handlers/verify-and-sync-user.handler");
const get_user_with_roles_handler_1 = require("./handlers/get-user-with-roles.handler");
const login_handler_1 = require("./handlers/login.handler");
let AuthService = class AuthService {
    verifyAndSyncUserHandler;
    getUserWithRolesHandler;
    loginHandler;
    constructor(verifyAndSyncUserHandler, getUserWithRolesHandler, loginHandler) {
        this.verifyAndSyncUserHandler = verifyAndSyncUserHandler;
        this.getUserWithRolesHandler = getUserWithRolesHandler;
        this.loginHandler = loginHandler;
    }
    async 토큰검증및사용자조회(accessToken) {
        const command = { accessToken };
        return this.verifyAndSyncUserHandler.execute(command);
    }
    async 역할포함사용자조회(employeeNumber) {
        const query = { employeeNumber };
        return this.getUserWithRolesHandler.execute(query);
    }
    async 로그인한다(email, password) {
        const command = { email, password };
        return this.loginHandler.execute(command);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [verify_and_sync_user_handler_1.VerifyAndSyncUserHandler,
        get_user_with_roles_handler_1.GetUserWithRolesHandler,
        login_handler_1.LoginHandler])
], AuthService);
//# sourceMappingURL=auth.service.js.map