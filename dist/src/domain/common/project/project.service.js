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
exports.ProjectService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("./project.entity");
const project_types_1 = require("./project.types");
let ProjectService = class ProjectService {
    projectRepository;
    constructor(projectRepository) {
        this.projectRepository = projectRepository;
    }
    async 생성한다(data, createdBy) {
        if (data.projectCode) {
            const existingProject = await this.projectRepository.findOne({
                where: { projectCode: data.projectCode, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (existingProject) {
                throw new Error(`프로젝트 코드 ${data.projectCode}는 이미 사용 중입니다.`);
            }
        }
        const project = project_entity_1.Project.생성한다(data, createdBy);
        const savedProject = await this.projectRepository.save(project);
        return savedProject.DTO로_변환한다();
    }
    async 수정한다(id, data, updatedBy) {
        const project = await this.projectRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!project) {
            throw new Error(`ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`);
        }
        if (data.projectCode && data.projectCode !== project.projectCode) {
            const existingProject = await this.projectRepository.findOne({
                where: { projectCode: data.projectCode, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (existingProject && existingProject.id !== id) {
                throw new Error(`프로젝트 코드 ${data.projectCode}는 이미 사용 중입니다.`);
            }
        }
        project.업데이트한다(data, updatedBy);
        const savedProject = await this.projectRepository.save(project);
        return savedProject.DTO로_변환한다();
    }
    async 삭제한다(id, deletedBy) {
        const project = await this.projectRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!project) {
            throw new Error(`ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`);
        }
        project.삭제한다(deletedBy);
        await this.projectRepository.save(project);
    }
    async ID로_조회한다(id) {
        const project = await this.projectRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return project ? project.DTO로_변환한다() : null;
    }
    async 프로젝트코드로_조회한다(projectCode) {
        const project = await this.projectRepository.findOne({
            where: { projectCode, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return project ? project.DTO로_변환한다() : null;
    }
    async 프로젝트명으로_조회한다(name) {
        const project = await this.projectRepository.findOne({
            where: { name, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return project ? project.DTO로_변환한다() : null;
    }
    async 필터_조회한다(filter) {
        const queryBuilder = this.projectRepository.createQueryBuilder('project');
        queryBuilder.where('project.deletedAt IS NULL');
        if (filter.status) {
            queryBuilder.andWhere('project.status = :status', {
                status: filter.status,
            });
        }
        if (filter.managerId) {
            queryBuilder.andWhere('project.managerId = :managerId', {
                managerId: filter.managerId,
            });
        }
        if (filter.startDateFrom) {
            queryBuilder.andWhere('project.startDate >= :startDateFrom', {
                startDateFrom: filter.startDateFrom,
            });
        }
        if (filter.startDateTo) {
            queryBuilder.andWhere('project.startDate <= :startDateTo', {
                startDateTo: filter.startDateTo,
            });
        }
        if (filter.endDateFrom) {
            queryBuilder.andWhere('project.endDate >= :endDateFrom', {
                endDateFrom: filter.endDateFrom,
            });
        }
        if (filter.endDateTo) {
            queryBuilder.andWhere('project.endDate <= :endDateTo', {
                endDateTo: filter.endDateTo,
            });
        }
        const projects = await queryBuilder.getMany();
        return projects.map((project) => project.DTO로_변환한다());
    }
    async 목록_조회한다(options = {}) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', filter = {}, } = options;
        const queryBuilder = this.projectRepository.createQueryBuilder('project');
        queryBuilder.where('project.deletedAt IS NULL');
        if (filter.status) {
            queryBuilder.andWhere('project.status = :status', {
                status: filter.status,
            });
        }
        if (filter.managerId) {
            queryBuilder.andWhere('project.managerId = :managerId', {
                managerId: filter.managerId,
            });
        }
        if (filter.startDateFrom) {
            queryBuilder.andWhere('project.startDate >= :startDateFrom', {
                startDateFrom: filter.startDateFrom,
            });
        }
        if (filter.startDateTo) {
            queryBuilder.andWhere('project.startDate <= :startDateTo', {
                startDateTo: filter.startDateTo,
            });
        }
        if (filter.endDateFrom) {
            queryBuilder.andWhere('project.endDate >= :endDateFrom', {
                endDateFrom: filter.endDateFrom,
            });
        }
        if (filter.endDateTo) {
            queryBuilder.andWhere('project.endDate <= :endDateTo', {
                endDateTo: filter.endDateTo,
            });
        }
        queryBuilder.orderBy(`project.${sortBy}`, sortOrder);
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);
        const [projects, total] = await queryBuilder.getManyAndCount();
        return {
            projects: projects.map((project) => project.DTO로_변환한다()),
            total,
            page,
            limit,
        };
    }
    async 전체_조회한다() {
        const projects = await this.projectRepository.find({
            where: { deletedAt: (0, typeorm_2.IsNull)() },
            order: { name: 'ASC' },
        });
        return projects.map((project) => project.DTO로_변환한다());
    }
    async 활성_조회한다() {
        const projects = await this.projectRepository.find({
            where: { status: project_types_1.ProjectStatus.ACTIVE, deletedAt: (0, typeorm_2.IsNull)() },
            order: { name: 'ASC' },
        });
        return projects.map((project) => project.DTO로_변환한다());
    }
    async 매니저별_조회한다(managerId) {
        const projects = await this.projectRepository.find({
            where: { managerId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { name: 'ASC' },
        });
        return projects.map((project) => project.DTO로_변환한다());
    }
    async 존재하는가(id) {
        const count = await this.projectRepository.count({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async 프로젝트코드가_존재하는가(projectCode, excludeId) {
        const queryBuilder = this.projectRepository.createQueryBuilder('project');
        queryBuilder.where('project.projectCode = :projectCode', { projectCode });
        queryBuilder.andWhere('project.deletedAt IS NULL');
        if (excludeId) {
            queryBuilder.andWhere('project.id != :excludeId', { excludeId });
        }
        const count = await queryBuilder.getCount();
        return count > 0;
    }
    async 상태_변경한다(id, status, updatedBy) {
        const project = await this.projectRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!project) {
            throw new Error(`ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`);
        }
        project.status = status;
        project.수정자를_설정한다(updatedBy);
        const savedProject = await this.projectRepository.save(project);
        return savedProject.DTO로_변환한다();
    }
    async 완료_처리한다(id, updatedBy) {
        return this.상태_변경한다(id, project_types_1.ProjectStatus.COMPLETED, updatedBy);
    }
    async 취소_처리한다(id, updatedBy) {
        return this.상태_변경한다(id, project_types_1.ProjectStatus.CANCELLED, updatedBy);
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProjectService);
//# sourceMappingURL=project.service.js.map