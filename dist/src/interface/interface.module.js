"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const admin_interface_module_1 = require("./admin/admin-interface.module");
const common_domain_module_1 = require("../domain/common/common-domain.module");
const auth_context_1 = require("../context/auth-context");
const audit_log_context_module_1 = require("../context/audit-log-context/audit-log-context.module");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const audit_log_interceptor_1 = require("./interceptors/audit-log.interceptor");
let InterfaceModule = class InterfaceModule {
};
exports.InterfaceModule = InterfaceModule;
exports.InterfaceModule = InterfaceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            common_domain_module_1.CommonDomainModule,
            auth_context_1.AuthContextModule,
            audit_log_context_module_1.AuditLogContextModule,
            admin_interface_module_1.AdminInterfaceModule,
        ],
        controllers: [],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: audit_log_interceptor_1.AuditLogInterceptor,
            },
        ],
        exports: [
            admin_interface_module_1.AdminInterfaceModule,
        ],
    })
], InterfaceModule);
//# sourceMappingURL=interface.module.js.map