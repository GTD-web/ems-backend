"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES_KEY = exports.Roles = void 0;
const common_1 = require("@nestjs/common");
const Roles = (...roles) => (0, common_1.SetMetadata)('roles', roles);
exports.Roles = Roles;
exports.ROLES_KEY = 'roles';
//# sourceMappingURL=roles.decorator.js.map