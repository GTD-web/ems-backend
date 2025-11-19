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
var EvaluationPeriodValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodValidationService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_entity_1 = require("./evaluation-period.entity");
const evaluation_period_exceptions_1 = require("./evaluation-period.exceptions");
const evaluation_period_types_1 = require("./evaluation-period.types");
let EvaluationPeriodValidationService = EvaluationPeriodValidationService_1 = class EvaluationPeriodValidationService {
    evaluationPeriodRepository;
    transactionManager;
    logger = new common_1.Logger(EvaluationPeriodValidationService_1.name);
    constructor(evaluationPeriodRepository, transactionManager) {
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.transactionManager = transactionManager;
    }
    async 생성데이터검증한다(createDto, manager) {
        this.필수데이터검증한다(createDto);
        this.데이터형식검증한다(createDto);
        this.날짜범위검증한다(createDto.startDate, createDto.peerEvaluationDeadline);
        this.세부일정검증한다(createDto);
        if (createDto.maxSelfEvaluationRate !== undefined) {
            this.자기평가달성률검증한다(createDto.maxSelfEvaluationRate);
        }
        await this.생성비즈니스규칙검증한다(createDto, manager);
    }
    async 업데이트데이터검증한다(id, updateDto, manager) {
        const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
        const existingPeriod = await repository.findOne({ where: { id } });
        if (!existingPeriod) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodRequiredDataMissingException('존재하지 않는 평가 기간입니다.');
        }
        if (updateDto.name !== undefined) {
            this.이름형식검증한다(updateDto.name);
        }
        if (updateDto.startDate || updateDto.peerEvaluationDeadline) {
            const newStartDate = updateDto.startDate || existingPeriod.startDate;
            const newPeerEvaluationDeadline = updateDto.peerEvaluationDeadline ||
                existingPeriod.peerEvaluationDeadline;
            this.날짜범위검증한다(newStartDate, newPeerEvaluationDeadline);
        }
        this.세부일정업데이트검증한다(updateDto, existingPeriod);
        if (updateDto.maxSelfEvaluationRate !== undefined) {
            this.자기평가달성률검증한다(updateDto.maxSelfEvaluationRate);
        }
        await this.업데이트비즈니스규칙검증한다(id, updateDto, existingPeriod, manager);
    }
    상태전이검증한다(currentStatus, targetStatus) {
        const validTransitions = {
            [evaluation_period_types_1.EvaluationPeriodStatus.WAITING]: [evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS],
            [evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS]: [
                evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED,
                evaluation_period_types_1.EvaluationPeriodStatus.WAITING,
            ],
            [evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED]: [],
        };
        const allowedTransitions = validTransitions[currentStatus] || [];
        if (!allowedTransitions.includes(targetStatus)) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException(`${currentStatus}에서 ${targetStatus}로 상태 전이가 불가능합니다.`);
        }
    }
    단계전이검증한다(currentPhase, targetPhase) {
        if (!currentPhase) {
            if (targetPhase !== evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException('첫 번째 단계는 평가설정이어야 합니다.');
            }
            return;
        }
        const validPhaseTransitions = {
            [evaluation_period_types_1.EvaluationPeriodPhase.WAITING]: [evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP],
            [evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP]: [
                evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE,
            ],
            [evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE]: [
                evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION,
            ],
            [evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION]: [
                evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION,
            ],
            [evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION]: [evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE],
            [evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE]: [],
        };
        const allowedTransitions = validPhaseTransitions[currentPhase] || [];
        if (!allowedTransitions.includes(targetPhase)) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException(`${currentPhase}에서 ${targetPhase}로 단계 전이가 불가능합니다.`);
        }
    }
    필수데이터검증한다(createDto) {
        if (!createDto.name?.trim()) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodRequiredDataMissingException('평가 기간명은 필수입니다.');
        }
        if (!createDto.startDate) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodRequiredDataMissingException('시작일은 필수입니다.');
        }
    }
    데이터형식검증한다(data) {
        if (data.name !== undefined) {
            this.이름형식검증한다(data.name);
        }
        if (data.description !== undefined && data.description.length > 1000) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDataFormatException('description', '1000자 이하', data.description);
        }
    }
    이름형식검증한다(name) {
        if (!name?.trim()) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDataFormatException('name', '공백이 아닌 문자열', name);
        }
        if (name.length > 255) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDataFormatException('name', '255자 이하', name);
        }
        const validNamePattern = /^[가-힣a-zA-Z0-9\s\-_()]+$/;
        if (!validNamePattern.test(name)) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDataFormatException('name', '한글, 영문, 숫자, 공백, 하이픈, 언더스코어, 괄호만 허용', name);
        }
    }
    날짜범위검증한다(startDate, endDate) {
        if (!endDate) {
            return;
        }
        if (startDate >= endDate) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('시작일은 종료일보다 이전이어야 합니다.');
        }
        const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffInDays < 7) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('평가 기간은 최소 7일 이상이어야 합니다.');
        }
        if (diffInDays > 365) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('평가 기간은 최대 1년을 초과할 수 없습니다.');
        }
    }
    세부일정검증한다(createDto) {
        if (createDto.evaluationSetupDeadline) {
            if (createDto.evaluationSetupDeadline <= createDto.startDate) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('평가설정 단계 마감일은 평가 기간 시작일 이후여야 합니다.');
            }
        }
        if (createDto.performanceDeadline) {
            if (createDto.performanceDeadline <= createDto.startDate) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('업무 수행 단계 마감일은 평가 기간 시작일 이후여야 합니다.');
            }
        }
        if (createDto.selfEvaluationDeadline) {
            if (createDto.selfEvaluationDeadline <= createDto.startDate) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('자기 평가 단계 마감일은 평가 기간 시작일 이후여야 합니다.');
            }
        }
        if (createDto.peerEvaluationDeadline) {
            if (createDto.peerEvaluationDeadline <= createDto.startDate) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('하향/동료평가 단계 마감일은 평가 기간 시작일 이후여야 합니다.');
            }
        }
        this.단계별날짜순서검증한다(createDto.startDate, createDto.evaluationSetupDeadline, createDto.performanceDeadline, createDto.selfEvaluationDeadline, createDto.peerEvaluationDeadline);
    }
    세부일정업데이트검증한다(updateDto, existingPeriod) {
        const newStartDate = updateDto.startDate || existingPeriod.startDate;
        if (updateDto.evaluationSetupDeadline) {
            if (updateDto.evaluationSetupDeadline <= newStartDate) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('평가설정 단계 마감일은 평가 기간 시작일 이후여야 합니다.');
            }
        }
        if (updateDto.performanceDeadline) {
            if (updateDto.performanceDeadline <= newStartDate) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('업무 수행 단계 마감일은 평가 기간 시작일 이후여야 합니다.');
            }
        }
        if (updateDto.selfEvaluationDeadline) {
            if (updateDto.selfEvaluationDeadline <= newStartDate) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('자기 평가 단계 마감일은 평가 기간 시작일 이후여야 합니다.');
            }
        }
        if (updateDto.peerEvaluationDeadline) {
            if (updateDto.peerEvaluationDeadline < newStartDate) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('하향/동료평가 단계 마감일은 평가 기간 시작일 이후여야 합니다.');
            }
        }
        const newEvaluationSetupDeadline = updateDto.evaluationSetupDeadline ||
            existingPeriod.evaluationSetupDeadline;
        const newPerformanceDeadline = updateDto.performanceDeadline || existingPeriod.performanceDeadline;
        const newSelfEvaluationDeadline = updateDto.selfEvaluationDeadline || existingPeriod.selfEvaluationDeadline;
        const newPeerEvaluationDeadline = updateDto.peerEvaluationDeadline || existingPeriod.peerEvaluationDeadline;
        this.마감일논리적순서검증한다(newEvaluationSetupDeadline, newPerformanceDeadline, newSelfEvaluationDeadline, newPeerEvaluationDeadline);
    }
    단계별날짜순서검증한다(startDate, evaluationSetupDeadline, performanceDeadline, selfEvaluationDeadline, peerEvaluationDeadline) {
        const dateSteps = [];
        dateSteps.push({ date: startDate, name: '평가 기간 시작일' });
        if (evaluationSetupDeadline) {
            dateSteps.push({
                date: evaluationSetupDeadline,
                name: '평가설정 단계 마감일',
            });
        }
        if (performanceDeadline) {
            dateSteps.push({
                date: performanceDeadline,
                name: '업무 수행 단계 마감일',
            });
        }
        if (selfEvaluationDeadline) {
            dateSteps.push({
                date: selfEvaluationDeadline,
                name: '자기 평가 단계 마감일',
            });
        }
        if (peerEvaluationDeadline) {
            dateSteps.push({
                date: peerEvaluationDeadline,
                name: '하향/동료평가 단계 마감일',
            });
        }
        for (let i = 1; i < dateSteps.length; i++) {
            const prevStep = dateSteps[i - 1];
            const currentStep = dateSteps[i];
            if (currentStep.date <= prevStep.date) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException(`${currentStep.name}은 ${prevStep.name}보다 늦어야 합니다.`);
            }
        }
        this.마감일논리적순서검증한다(evaluationSetupDeadline, performanceDeadline, selfEvaluationDeadline, peerEvaluationDeadline);
    }
    마감일논리적순서검증한다(evaluationSetupDeadline, performanceDeadline, selfEvaluationDeadline, peerEvaluationDeadline) {
        if (evaluationSetupDeadline && performanceDeadline) {
            if (performanceDeadline <= evaluationSetupDeadline) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('업무 수행 단계 마감일은 평가설정 단계 마감일보다 늦어야 합니다.');
            }
        }
        if (performanceDeadline && selfEvaluationDeadline) {
            if (selfEvaluationDeadline <= performanceDeadline) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('자기 평가 단계 마감일은 업무 수행 단계 마감일보다 늦어야 합니다.');
            }
        }
        if (selfEvaluationDeadline && peerEvaluationDeadline) {
            if (peerEvaluationDeadline <= selfEvaluationDeadline) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('하향/동료평가 단계 마감일은 자기 평가 단계 마감일보다 늦어야 합니다.');
            }
        }
        if (evaluationSetupDeadline &&
            selfEvaluationDeadline &&
            !performanceDeadline) {
            if (selfEvaluationDeadline <= evaluationSetupDeadline) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('자기 평가 단계 마감일은 평가설정 단계 마감일보다 늦어야 합니다.');
            }
        }
        if (evaluationSetupDeadline &&
            peerEvaluationDeadline &&
            !performanceDeadline &&
            !selfEvaluationDeadline) {
            if (peerEvaluationDeadline <= evaluationSetupDeadline) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('하향/동료평가 단계 마감일은 평가설정 단계 마감일보다 늦어야 합니다.');
            }
        }
        if (performanceDeadline &&
            peerEvaluationDeadline &&
            !selfEvaluationDeadline) {
            if (peerEvaluationDeadline <= performanceDeadline) {
                throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('하향/동료평가 단계 마감일은 업무 수행 단계 마감일보다 늦어야 합니다.');
            }
        }
    }
    자기평가달성률검증한다(rate) {
        if (!Number.isInteger(rate)) {
            throw new evaluation_period_exceptions_1.InvalidSelfEvaluationRateException(rate, 0, 200);
        }
        if (rate < 0 || rate > 200) {
            throw new evaluation_period_exceptions_1.InvalidSelfEvaluationRateException(rate, 0, 200);
        }
    }
    async 생성비즈니스규칙검증한다(createDto, manager) {
        await this.이름중복검증한다(createDto.name, undefined, manager);
        await this.기간겹침검증한다(createDto.startDate, createDto.peerEvaluationDeadline, undefined, manager);
    }
    async 업데이트비즈니스규칙검증한다(id, updateDto, existingPeriod, manager) {
        if (existingPeriod.status === evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED) {
            if (updateDto.startDate || updateDto.name) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException('완료된 평가 기간의 기본 정보는 수정할 수 없습니다.');
            }
        }
        if (existingPeriod.활성화된_상태인가() && updateDto.startDate) {
            const now = new Date();
            if (updateDto.startDate && existingPeriod.startDate <= now) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException('이미 시작된 평가 기간의 시작일은 수정할 수 없습니다.');
            }
        }
    }
    async 평가기간업데이트비즈니스규칙검증한다(id, updateDto, manager) {
        const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
        const existingPeriod = await repository.findOne({ where: { id } });
        if (!existingPeriod) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodRequiredDataMissingException('존재하지 않는 평가 기간입니다.');
        }
        if (existingPeriod.status === evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException('완료된 평가 기간은 수정할 수 없습니다.');
        }
        if (updateDto.name && updateDto.name !== existingPeriod.name) {
            await this.이름중복검증한다(updateDto.name, id, manager);
        }
        if (updateDto.startDate) {
            const newStartDate = updateDto.startDate;
            const existingPeerEvaluationDeadline = existingPeriod.peerEvaluationDeadline;
            if (existingPeerEvaluationDeadline) {
                const startDateObj = newStartDate instanceof Date ? newStartDate : new Date(newStartDate);
                const peerEvaluationDeadlineObj = existingPeerEvaluationDeadline instanceof Date
                    ? existingPeerEvaluationDeadline
                    : new Date(existingPeerEvaluationDeadline);
                this.날짜범위검증한다(startDateObj, peerEvaluationDeadlineObj);
            }
            await this.기간겹침검증한다(newStartDate, existingPeerEvaluationDeadline || new Date(), id, manager);
        }
        this.세부일정업데이트검증한다(updateDto, existingPeriod);
        await this.업데이트비즈니스규칙검증한다(id, updateDto, existingPeriod, manager);
    }
    async 평가기간시작비즈니스규칙검증한다(id, manager) {
    }
    async 평가기간삭제비즈니스규칙검증한다(evaluationPeriod) {
    }
    async 수동허용설정변경비즈니스규칙검증한다(evaluationPeriod) {
        if (evaluationPeriod.완료된_상태인가()) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException('완료된 평가 기간은 수정할 수 없습니다.');
        }
    }
    async 이름중복검증한다(name, excludeId, manager) {
        const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
        const queryBuilder = repository
            .createQueryBuilder('period')
            .where('period.name = :name', { name });
        if (excludeId) {
            queryBuilder.andWhere('period.id != :excludeId', { excludeId });
        }
        const count = await queryBuilder.getCount();
        if (count > 0) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodNameDuplicateException(name);
        }
    }
    async 기간겹침검증한다(startDate, peerEvaluationDeadline, excludeId, manager) {
        const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
        const queryBuilder = repository
            .createQueryBuilder('period')
            .where('(period.startDate <= :peerEvaluationDeadline AND period.peerEvaluationDeadline >= :startDate)', { startDate, peerEvaluationDeadline });
        if (excludeId) {
            queryBuilder.andWhere('period.id != :excludeId', { excludeId });
        }
        const conflictingPeriod = await queryBuilder.getOne();
        if (conflictingPeriod) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodOverlapException(startDate, peerEvaluationDeadline || new Date(), conflictingPeriod.id);
        }
    }
    async 현재진행중평가기간조회한다(manager) {
        const repository = this.transactionManager.getRepository(evaluation_period_entity_1.EvaluationPeriod, this.evaluationPeriodRepository, manager);
        const now = new Date();
        const evaluationPeriod = await repository.findOne({
            where: {
                status: evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS,
                startDate: (0, typeorm_2.LessThanOrEqual)(now),
            },
            order: { startDate: 'DESC' },
        });
        return evaluationPeriod || null;
    }
};
exports.EvaluationPeriodValidationService = EvaluationPeriodValidationService;
exports.EvaluationPeriodValidationService = EvaluationPeriodValidationService = EvaluationPeriodValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService])
], EvaluationPeriodValidationService);
//# sourceMappingURL=evaluation-period-validation.service.js.map