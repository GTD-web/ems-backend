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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDepartmentHierarchyQueryHandler = exports.GetDepartmentHierarchyQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const department_service_1 = require("../../../domain/common/department/department.service");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const department_entity_1 = require("../../../domain/common/department/department.entity");
class GetDepartmentHierarchyQuery {
}
exports.GetDepartmentHierarchyQuery = GetDepartmentHierarchyQuery;
let GetDepartmentHierarchyQueryHandler = class GetDepartmentHierarchyQueryHandler {
    departmentService;
    departmentRepository;
    constructor(departmentService, departmentRepository) {
        this.departmentService = departmentService;
        this.departmentRepository = departmentRepository;
    }
    async execute(query) {
        const allDepartments = await this.departmentRepository.find({
            where: { deletedAt: (0, typeorm_1.IsNull)() },
            order: { order: 'ASC', name: 'ASC' },
        });
        const departmentByExternalId = new Map();
        const rootDepartments = [];
        allDepartments.forEach((dept) => {
            const deptHierarchy = {
                id: dept.id,
                name: dept.name,
                code: dept.code,
                order: dept.order,
                parentDepartmentId: dept.parentDepartmentId,
                level: 0,
                depth: 0,
                childrenCount: 0,
                totalDescendants: 0,
                subDepartments: [],
            };
            departmentByExternalId.set(dept.externalId, deptHierarchy);
        });
        allDepartments.forEach((dept) => {
            const deptHierarchy = departmentByExternalId.get(dept.externalId);
            if (dept.parentDepartmentId) {
                const parent = departmentByExternalId.get(dept.parentDepartmentId);
                if (parent) {
                    parent.subDepartments.push(deptHierarchy);
                }
                else {
                    rootDepartments.push(deptHierarchy);
                }
            }
            else {
                rootDepartments.push(deptHierarchy);
            }
        });
        this.calculateHierarchyInfo(rootDepartments, 0);
        return rootDepartments;
    }
    calculateHierarchyInfo(departments, currentLevel) {
        let maxDepthInLevel = 0;
        for (const dept of departments) {
            dept.level = currentLevel;
            dept.childrenCount = dept.subDepartments.length;
            if (dept.subDepartments.length === 0) {
                dept.depth = 0;
                dept.totalDescendants = 0;
            }
            else {
                const childDepth = this.calculateHierarchyInfo(dept.subDepartments, currentLevel + 1);
                dept.depth = childDepth + 1;
                dept.totalDescendants = dept.subDepartments.reduce((sum, child) => sum + 1 + child.totalDescendants, 0);
                maxDepthInLevel = Math.max(maxDepthInLevel, childDepth + 1);
            }
        }
        return maxDepthInLevel;
    }
};
exports.GetDepartmentHierarchyQueryHandler = GetDepartmentHierarchyQueryHandler;
exports.GetDepartmentHierarchyQueryHandler = GetDepartmentHierarchyQueryHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetDepartmentHierarchyQuery),
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [department_service_1.DepartmentService,
        typeorm_3.Repository])
], GetDepartmentHierarchyQueryHandler);
//# sourceMappingURL=get-department-hierarchy.handler.js.map