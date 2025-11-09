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
exports.DepartmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const department_entity_1 = require("./department.entity");
let DepartmentService = class DepartmentService {
    departmentRepository;
    constructor(departmentRepository) {
        this.departmentRepository = departmentRepository;
    }
    async ID로_조회한다(id) {
        const department = await this.departmentRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return department ? department.DTO로_변환한다() : null;
    }
    async 부서코드로_조회한다(code) {
        const department = await this.departmentRepository.findOne({
            where: { code, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return department ? department.DTO로_변환한다() : null;
    }
    async 외부ID로_조회한다(externalId) {
        const department = await this.departmentRepository.findOne({
            where: { externalId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return department ? department.DTO로_변환한다() : null;
    }
    async 부서명으로_조회한다(name) {
        const department = await this.departmentRepository.findOne({
            where: { name, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return department ? department.DTO로_변환한다() : null;
    }
    async 필터_조회한다(filter) {
        const queryBuilder = this.departmentRepository.createQueryBuilder('department');
        queryBuilder.where('department.deletedAt IS NULL');
        if (filter.name) {
            queryBuilder.andWhere('department.name LIKE :name', {
                name: `%${filter.name}%`,
            });
        }
        if (filter.code) {
            queryBuilder.andWhere('department.code = :code', {
                code: filter.code,
            });
        }
        if (filter.managerId) {
            queryBuilder.andWhere('department.managerId = :managerId', {
                managerId: filter.managerId,
            });
        }
        if (filter.parentDepartmentId) {
            queryBuilder.andWhere('department.parentDepartmentId = :parentDepartmentId', {
                parentDepartmentId: filter.parentDepartmentId,
            });
        }
        if (filter.externalId) {
            queryBuilder.andWhere('department.externalId = :externalId', {
                externalId: filter.externalId,
            });
        }
        const departments = await queryBuilder.getMany();
        return departments.map((department) => department.DTO로_변환한다());
    }
    async 목록_조회한다(options = {}) {
        const { page = 1, limit = 20, sortBy = 'order', sortOrder = 'ASC', filter = {}, } = options;
        const queryBuilder = this.departmentRepository.createQueryBuilder('department');
        queryBuilder.where('department.deletedAt IS NULL');
        if (filter.name) {
            queryBuilder.andWhere('department.name LIKE :name', {
                name: `%${filter.name}%`,
            });
        }
        if (filter.code) {
            queryBuilder.andWhere('department.code = :code', {
                code: filter.code,
            });
        }
        if (filter.managerId) {
            queryBuilder.andWhere('department.managerId = :managerId', {
                managerId: filter.managerId,
            });
        }
        if (filter.parentDepartmentId) {
            queryBuilder.andWhere('department.parentDepartmentId = :parentDepartmentId', {
                parentDepartmentId: filter.parentDepartmentId,
            });
        }
        if (filter.externalId) {
            queryBuilder.andWhere('department.externalId = :externalId', {
                externalId: filter.externalId,
            });
        }
        queryBuilder.orderBy(`department.${sortBy}`, sortOrder);
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);
        const [departments, total] = await queryBuilder.getManyAndCount();
        return {
            departments: departments.map((department) => department.DTO로_변환한다()),
            total,
            page,
            limit,
        };
    }
    async 전체_조회한다() {
        const departments = await this.departmentRepository.find({
            where: { deletedAt: (0, typeorm_2.IsNull)() },
            order: { order: 'ASC', name: 'ASC' },
        });
        return departments.map((department) => department.DTO로_변환한다());
    }
    async 최상위_부서_조회한다() {
        const departments = await this.departmentRepository.find({
            where: { parentDepartmentId: (0, typeorm_2.IsNull)(), deletedAt: (0, typeorm_2.IsNull)() },
            order: { order: 'ASC', name: 'ASC' },
        });
        return departments.map((department) => department.DTO로_변환한다());
    }
    async 하위_부서_조회한다(parentDepartmentId) {
        const departments = await this.departmentRepository.find({
            where: { parentDepartmentId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { order: 'ASC', name: 'ASC' },
        });
        return departments.map((department) => department.DTO로_변환한다());
    }
    async 매니저별_조회한다(managerId) {
        const departments = await this.departmentRepository.find({
            where: { managerId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { order: 'ASC', name: 'ASC' },
        });
        return departments.map((department) => department.DTO로_변환한다());
    }
    async 존재하는가(id) {
        const count = await this.departmentRepository.count({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async 부서코드가_존재하는가(code) {
        const count = await this.departmentRepository.count({
            where: { code, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async 외부ID가_존재하는가(externalId) {
        const count = await this.departmentRepository.count({
            where: { externalId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async findById(id) {
        return this.departmentRepository.findOne({
            where: { id },
        });
    }
    async findByExternalId(externalId) {
        return this.departmentRepository.findOne({
            where: { externalId },
        });
    }
    async findAll() {
        return this.departmentRepository.find({
            order: { order: 'ASC', name: 'ASC' },
        });
    }
    async findByFilter(filter) {
        const queryBuilder = this.departmentRepository.createQueryBuilder('department');
        if (filter.name) {
            queryBuilder.andWhere('department.name LIKE :name', {
                name: `%${filter.name}%`,
            });
        }
        if (filter.code) {
            queryBuilder.andWhere('department.code = :code', { code: filter.code });
        }
        if (filter.managerId) {
            queryBuilder.andWhere('department.managerId = :managerId', {
                managerId: filter.managerId,
            });
        }
        if (filter.parentDepartmentId) {
            queryBuilder.andWhere('department.parentDepartmentId = :parentDepartmentId', { parentDepartmentId: filter.parentDepartmentId });
        }
        if (filter.externalId) {
            queryBuilder.andWhere('department.externalId = :externalId', {
                externalId: filter.externalId,
            });
        }
        return queryBuilder
            .orderBy('department.order', 'ASC')
            .addOrderBy('department.name', 'ASC')
            .getMany();
    }
    async save(department) {
        return this.departmentRepository.save(department);
    }
    async saveMany(departments) {
        return this.departmentRepository.save(departments);
    }
    async findByCode(code) {
        return this.departmentRepository.findOne({
            where: { code },
        });
    }
    async findByParentDepartmentId(parentDepartmentId) {
        return this.departmentRepository.find({
            where: { parentDepartmentId },
            order: { order: 'ASC', name: 'ASC' },
        });
    }
    async findRootDepartments() {
        return this.departmentRepository
            .createQueryBuilder('department')
            .where('department.parentDepartmentId IS NULL')
            .orderBy('department.order', 'ASC')
            .addOrderBy('department.name', 'ASC')
            .getMany();
    }
    async getDepartmentStats() {
        const totalDepartments = await this.departmentRepository.count();
        const rootDepartments = await this.departmentRepository
            .createQueryBuilder('department')
            .where('department.parentDepartmentId IS NULL')
            .getCount();
        const lastSyncRecord = await this.departmentRepository
            .createQueryBuilder('department')
            .select('department.lastSyncAt')
            .where('department.lastSyncAt IS NOT NULL')
            .orderBy('department.lastSyncAt', 'DESC')
            .limit(1)
            .getOne();
        const subDepartments = totalDepartments - rootDepartments;
        return {
            totalDepartments,
            rootDepartments,
            subDepartments,
            employeesByDepartment: {},
            averageEmployeesPerDepartment: 0,
            lastSyncAt: lastSyncRecord?.lastSyncAt,
        };
    }
    async update(id, partialDepartment) {
        await this.departmentRepository.update(id, partialDepartment);
        const department = await this.findById(id);
        if (!department) {
            throw new Error(`부서를 찾을 수 없습니다: ${id}`);
        }
        return department;
    }
};
exports.DepartmentService = DepartmentService;
exports.DepartmentService = DepartmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DepartmentService);
//# sourceMappingURL=department.service.js.map