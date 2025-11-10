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
var EvaluationPeriodService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_validation_service_1 = require("./evaluation-period-validation.service");
const evaluation_period_entity_1 = require("./evaluation-period.entity");
const evaluation_period_exceptions_1 = require("./evaluation-period.exceptions");
const evaluation_period_types_1 = require("./evaluation-period.types");
let EvaluationPeriodService = EvaluationPeriodService_1 = class EvaluationPeriodService {
    evaluationPeriodRepository;
    dataSource;
    transactionManager;
    validationService;
    logger = new common_1.Logger(EvaluationPeriodService_1.name);
    constructor(evaluationPeriodRepository, dataSource, transactionManager, validationService) {
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.dataSource = dataSource;
        this.transactionManager = transactionManager;
        this.validationService = validationService;
    }
    async executeSafeDomainOperation(operation, context) {
        return this.transactionManager.executeSafeOperation(operation, context);
    }
    async ID로_조회한다(id, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            return evaluationPeriod || null;
        }, 'ID로_조회한다');
    }
    async 이름으로_조회한다(name, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const evaluationPeriod = await repository.findOne({ where: { name } });
            return evaluationPeriod || null;
        }, '이름으로_조회한다');
    }
    async 전체_조회한다(manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            return await repository.find({
                order: { startDate: 'DESC' },
            });
        }, '전체_조회한다');
    }
    async 상태별_조회한다(status, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            return await repository.find({
                where: { status },
                order: { startDate: 'DESC' },
            });
        }, '상태별_조회한다');
    }
    async 단계별_조회한다(phase, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            return await repository.find({
                where: { currentPhase: phase },
                order: { startDate: 'DESC' },
            });
        }, '단계별_조회한다');
    }
    async 활성화된_평가기간_조회한다(manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            return await repository.find({
                where: { status: evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS },
                order: { startDate: 'DESC' },
            });
        }, '활성화된_평가기간_조회한다');
    }
    async 완료된_평가기간_조회한다(manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            return await repository.find({
                where: { status: evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED },
                order: { completedDate: 'DESC' },
            });
        }, '완료된_평가기간_조회한다');
    }
    async 현재_진행중_평가기간_조회한다(manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const now = new Date();
            const evaluationPeriod = await repository.findOne({
                where: {
                    status: evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS,
                    startDate: (0, typeorm_2.LessThanOrEqual)(now),
                    endDate: (0, typeorm_2.MoreThanOrEqual)(now),
                },
                order: { startDate: 'DESC' },
            });
            return evaluationPeriod || null;
        }, '현재_진행중_평가기간_조회한다');
    }
    async 필터_조회한다(filter, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const queryBuilder = repository.createQueryBuilder('period');
            if (filter.status) {
                queryBuilder.andWhere('period.status = :status', {
                    status: filter.status,
                });
            }
            if (filter.currentPhase) {
                queryBuilder.andWhere('period.currentPhase = :currentPhase', {
                    currentPhase: filter.currentPhase,
                });
            }
            if (filter.startDateFrom) {
                queryBuilder.andWhere('period.startDate >= :startDateFrom', {
                    startDateFrom: filter.startDateFrom,
                });
            }
            if (filter.endDateTo) {
                queryBuilder.andWhere('period.endDate <= :endDateTo', {
                    endDateTo: filter.endDateTo,
                });
            }
            if (filter.activeOnly) {
                queryBuilder.andWhere('period.status = :activeStatus', {
                    activeStatus: evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS,
                });
            }
            if (filter.maxSelfEvaluationRateFrom) {
                queryBuilder.andWhere('period.maxSelfEvaluationRate >= :maxSelfEvaluationRateFrom', {
                    maxSelfEvaluationRateFrom: filter.maxSelfEvaluationRateFrom,
                });
            }
            if (filter.maxSelfEvaluationRateTo) {
                queryBuilder.andWhere('period.maxSelfEvaluationRate <= :maxSelfEvaluationRateTo', {
                    maxSelfEvaluationRateTo: filter.maxSelfEvaluationRateTo,
                });
            }
            return await queryBuilder.orderBy('period.startDate', 'DESC').getMany();
        }, '필터_조회한다');
    }
    async 생성한다(createDto, createdBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const entityManager = manager || this.dataSource.manager;
            const evaluationPeriod = new evaluation_period_entity_1.EvaluationPeriod();
            Object.assign(evaluationPeriod, {
                ...createDto,
                maxSelfEvaluationRate: createDto.maxSelfEvaluationRate ?? 120,
                gradeRanges: [],
                createdBy,
                updatedBy: createdBy,
            });
            if (createDto.gradeRanges && createDto.gradeRanges.length > 0) {
                evaluationPeriod.등급구간_설정한다(createDto.gradeRanges, createdBy);
            }
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, entityManager);
            return await repository.save(evaluationPeriod);
        }, '생성한다');
    }
    async 업데이트한다(id, updateDto, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const entityManager = manager || this.dataSource.manager;
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, entityManager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            if (!evaluationPeriod) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodNotFoundException(id);
            }
            await this.validationService.평가기간업데이트비즈니스규칙검증한다(id, updateDto, entityManager);
            const filteredUpdateDto = Object.fromEntries(Object.entries(updateDto).filter(([_, value]) => value !== undefined));
            Object.assign(evaluationPeriod, filteredUpdateDto, { updatedBy });
            return await repository.save(evaluationPeriod);
        }, '업데이트한다');
    }
    async 삭제한다(id, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            if (!evaluationPeriod) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodNotFoundException(id);
            }
            await this.validationService.평가기간삭제비즈니스규칙검증한다(evaluationPeriod);
            await repository.delete(id);
            this.logger.log(`평가 기간 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`);
        }, '삭제한다');
    }
    async 시작한다(id, startedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const entityManager = manager || this.dataSource.manager;
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, entityManager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            if (!evaluationPeriod) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodNotFoundException(id);
            }
            await this.validationService.평가기간시작비즈니스규칙검증한다(id, entityManager);
            evaluationPeriod.평가기간_시작한다(startedBy);
            return await repository.save(evaluationPeriod);
        }, '시작한다');
    }
    async 완료한다(id, completedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            if (!evaluationPeriod) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodNotFoundException(id);
            }
            evaluationPeriod.평가기간_완료한다(completedBy);
            return await repository.save(evaluationPeriod);
        }, '완료한다');
    }
    async 단계_변경한다(id, targetPhase, changedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            if (!evaluationPeriod) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodNotFoundException(id);
            }
            switch (targetPhase) {
                case evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP:
                    evaluationPeriod.평가설정_단계로_이동한다(changedBy);
                    break;
                case evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE:
                    evaluationPeriod.업무수행_단계로_이동한다(changedBy);
                    break;
                case evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION:
                    evaluationPeriod.자기평가_단계로_이동한다(changedBy);
                    break;
                case evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION:
                    evaluationPeriod.하향동료평가_단계로_이동한다(changedBy);
                    break;
                case evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE:
                    evaluationPeriod.종결_단계로_이동한다(changedBy);
                    break;
                default:
                    throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException(`지원하지 않는 단계입니다: ${targetPhase}`);
            }
            return await repository.save(evaluationPeriod);
        }, '단계_변경한다');
    }
    async 수동허용설정_변경한다(id, criteriaSettingEnabled, selfEvaluationSettingEnabled, finalEvaluationSettingEnabled, changedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            if (!evaluationPeriod) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodNotFoundException(id);
            }
            await this.validationService.수동허용설정변경비즈니스규칙검증한다(evaluationPeriod);
            if (criteriaSettingEnabled !== undefined) {
                if (criteriaSettingEnabled) {
                    evaluationPeriod.평가기준설정_수동허용_활성화한다(changedBy || 'system');
                }
                else {
                    evaluationPeriod.평가기준설정_수동허용_비활성화한다(changedBy || 'system');
                }
            }
            if (selfEvaluationSettingEnabled !== undefined) {
                if (selfEvaluationSettingEnabled) {
                    evaluationPeriod.자기평가설정_수동허용_활성화한다(changedBy || 'system');
                }
                else {
                    evaluationPeriod.자기평가설정_수동허용_비활성화한다(changedBy || 'system');
                }
            }
            if (finalEvaluationSettingEnabled !== undefined) {
                if (finalEvaluationSettingEnabled) {
                    evaluationPeriod.하향동료평가설정_수동허용_활성화한다(changedBy || 'system');
                }
                else {
                    evaluationPeriod.하향동료평가설정_수동허용_비활성화한다(changedBy || 'system');
                }
            }
            if (changedBy) {
                evaluationPeriod.updatedBy = changedBy;
                evaluationPeriod.updatedAt = new Date();
            }
            return await repository.save(evaluationPeriod);
        }, '수동허용설정_변경한다');
    }
    async 활성_평가기간_존재_확인한다(manager) {
        return this.executeSafeDomainOperation(async () => {
            const activePeriod = await this.현재_진행중_평가기간_조회한다(manager);
            return activePeriod !== null;
        }, '활성_평가기간_존재_확인한다');
    }
    async 자기평가_달성률최대값_설정한다(id, maxRate, setBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            if (!evaluationPeriod) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodNotFoundException(id);
            }
            evaluationPeriod.자기평가_달성률최대값_설정한다(maxRate, setBy);
            return await repository.save(evaluationPeriod);
        }, '자기평가_달성률최대값_설정한다');
    }
    async 등급구간_설정한다(id, gradeRanges, setBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            if (!evaluationPeriod) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodNotFoundException(id);
            }
            evaluationPeriod.등급구간_설정한다(gradeRanges, setBy);
            return await repository.save(evaluationPeriod);
        }, '등급구간_설정한다');
    }
    async 점수로_등급_조회한다(id, score, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            if (!evaluationPeriod) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodNotFoundException(id);
            }
            return evaluationPeriod.점수로_등급_조회한다(score);
        }, '점수로_등급_조회한다');
    }
    async 등급구간_목록_조회한다(id, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            if (!evaluationPeriod) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodNotFoundException(id);
            }
            return evaluationPeriod.gradeRanges || [];
        }, '등급구간_목록_조회한다');
    }
    async 등급구간_조회한다(id, grade, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
            const evaluationPeriod = await repository.findOne({ where: { id } });
            if (!evaluationPeriod) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodNotFoundException(id);
            }
            return evaluationPeriod.등급구간_조회한다(grade);
        }, '등급구간_조회한다');
    }
};
exports.EvaluationPeriodService = EvaluationPeriodService;
exports.EvaluationPeriodService = EvaluationPeriodService = EvaluationPeriodService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        transaction_manager_service_1.TransactionManagerService,
        evaluation_period_validation_service_1.EvaluationPeriodValidationService])
], EvaluationPeriodService);
//# sourceMappingURL=evaluation-period.service.js.map