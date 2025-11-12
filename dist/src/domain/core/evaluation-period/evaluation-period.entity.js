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
exports.EvaluationPeriod = void 0;
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const class_transformer_1 = require("class-transformer");
const typeorm_1 = require("typeorm");
const evaluation_period_exceptions_1 = require("./evaluation-period.exceptions");
const evaluation_period_types_1 = require("./evaluation-period.types");
let EvaluationPeriod = class EvaluationPeriod extends base_entity_1.BaseEntity {
    name;
    startDate;
    endDate;
    description;
    status;
    currentPhase;
    evaluationSetupDeadline;
    performanceDeadline;
    selfEvaluationDeadline;
    peerEvaluationDeadline;
    completedDate;
    criteriaSettingEnabled;
    selfEvaluationSettingEnabled;
    finalEvaluationSettingEnabled;
    manuallySetFields = [];
    maxSelfEvaluationRate;
    gradeRanges;
    평가기간_시작한다(startedBy) {
        if (!this.시작_가능한가()) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodStatusTransitionException(this.status, evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS, '평가 기간은 대기 상태에서만 시작할 수 있습니다.');
        }
        this.status = evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS;
        this.currentPhase = evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP;
        this.criteriaSettingEnabled = false;
        this.selfEvaluationSettingEnabled = false;
        this.finalEvaluationSettingEnabled = false;
        this.updatedBy = startedBy;
        this.updatedAt = new Date();
    }
    평가기간_완료한다(completedBy) {
        if (!this.완료_가능한가()) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodStatusTransitionException(this.status, evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED, '평가 기간은 진행 중 상태에서만 완료할 수 있습니다.');
        }
        this.status = evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED;
        this.currentPhase = evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE;
        this.completedDate = new Date();
        this.criteriaSettingEnabled = false;
        this.selfEvaluationSettingEnabled = false;
        this.finalEvaluationSettingEnabled = false;
        this.manuallySetFields = [];
        this.updatedBy = completedBy;
        this.updatedAt = new Date();
    }
    평가기간_대기상태로_되돌린다(resetBy) {
        if (this.status !== evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodStatusTransitionException(this.status, evaluation_period_types_1.EvaluationPeriodStatus.WAITING, '진행 중인 평가 기간만 대기 상태로 되돌릴 수 있습니다.');
        }
        this.status = evaluation_period_types_1.EvaluationPeriodStatus.WAITING;
        this.currentPhase = evaluation_period_types_1.EvaluationPeriodPhase.WAITING;
        this.updatedBy = resetBy;
        this.updatedAt = new Date();
    }
    평가설정_단계로_이동한다(movedBy) {
        if (!this.단계전이_유효한가(evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP)) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodStatusTransitionException(this.status, evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS, '평가설정 단계로 이동할 수 없습니다.');
        }
        this.status = evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS;
        this.currentPhase = evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP;
        if (!this.수동설정이_있는가('criteriaSettingEnabled')) {
            this.criteriaSettingEnabled = false;
        }
        if (!this.수동설정이_있는가('selfEvaluationSettingEnabled')) {
            this.selfEvaluationSettingEnabled = false;
        }
        if (!this.수동설정이_있는가('finalEvaluationSettingEnabled')) {
            this.finalEvaluationSettingEnabled = false;
        }
        this.updatedBy = movedBy;
        this.updatedAt = new Date();
    }
    업무수행_단계로_이동한다(movedBy) {
        if (!this.단계전이_유효한가(evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE)) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodStatusTransitionException(this.status, evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS, '업무 수행 단계로 이동할 수 없습니다.');
        }
        this.status = evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS;
        this.currentPhase = evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE;
        if (!this.수동설정이_있는가('criteriaSettingEnabled')) {
            this.criteriaSettingEnabled = false;
        }
        if (!this.수동설정이_있는가('selfEvaluationSettingEnabled')) {
            this.selfEvaluationSettingEnabled = false;
        }
        if (!this.수동설정이_있는가('finalEvaluationSettingEnabled')) {
            this.finalEvaluationSettingEnabled = false;
        }
        this.updatedBy = movedBy;
        this.updatedAt = new Date();
    }
    자기평가_단계로_이동한다(movedBy) {
        if (!this.단계전이_유효한가(evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION)) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodStatusTransitionException(this.status, evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS, '자기 평가 단계로 이동할 수 없습니다.');
        }
        this.status = evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS;
        this.currentPhase = evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION;
        if (!this.수동설정이_있는가('criteriaSettingEnabled')) {
            this.criteriaSettingEnabled = false;
        }
        if (!this.수동설정이_있는가('selfEvaluationSettingEnabled')) {
            this.selfEvaluationSettingEnabled = false;
        }
        if (!this.수동설정이_있는가('finalEvaluationSettingEnabled')) {
            this.finalEvaluationSettingEnabled = false;
        }
        this.updatedBy = movedBy;
        this.updatedAt = new Date();
    }
    하향동료평가_단계로_이동한다(movedBy) {
        if (!this.단계전이_유효한가(evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION)) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodStatusTransitionException(this.status, evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS, '하향/동료 평가 단계로 이동할 수 없습니다.');
        }
        this.status = evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS;
        this.currentPhase = evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION;
        if (!this.수동설정이_있는가('criteriaSettingEnabled')) {
            this.criteriaSettingEnabled = false;
        }
        if (!this.수동설정이_있는가('selfEvaluationSettingEnabled')) {
            this.selfEvaluationSettingEnabled = false;
        }
        if (!this.수동설정이_있는가('finalEvaluationSettingEnabled')) {
            this.finalEvaluationSettingEnabled = false;
        }
        this.updatedBy = movedBy;
        this.updatedAt = new Date();
    }
    종결_단계로_이동한다(movedBy) {
        if (!this.단계전이_유효한가(evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE)) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodStatusTransitionException(this.status, evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS, '종결 단계로 이동할 수 없습니다.');
        }
        this.status = evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS;
        this.currentPhase = evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE;
        if (!this.수동설정이_있는가('criteriaSettingEnabled')) {
            this.criteriaSettingEnabled = false;
        }
        if (!this.수동설정이_있는가('selfEvaluationSettingEnabled')) {
            this.selfEvaluationSettingEnabled = false;
        }
        if (!this.수동설정이_있는가('finalEvaluationSettingEnabled')) {
            this.finalEvaluationSettingEnabled = false;
        }
        this.updatedBy = movedBy;
        this.updatedAt = new Date();
    }
    자기평가_달성률최대값_설정한다(maxRate, setBy) {
        if (!this.자기평가_달성률_유효한가(maxRate)) {
            throw new evaluation_period_exceptions_1.InvalidSelfEvaluationRateException(maxRate);
        }
        if (this.status === evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED) {
            throw new evaluation_period_exceptions_1.SelfEvaluationRateSettingNotAllowedException(this.id, this.status, '완료된 평가 기간의 달성률은 변경할 수 없습니다.');
        }
        this.maxSelfEvaluationRate = maxRate;
        this.updatedBy = setBy;
        this.updatedAt = new Date();
    }
    시작_가능한가() {
        return this.status === evaluation_period_types_1.EvaluationPeriodStatus.WAITING;
    }
    완료_가능한가() {
        return this.status === evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS;
    }
    활성화된_상태인가() {
        return this.status === evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS;
    }
    완료된_상태인가() {
        return this.status === evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED;
    }
    대기_단계인가() {
        return this.currentPhase === evaluation_period_types_1.EvaluationPeriodPhase.WAITING;
    }
    평가설정_단계인가() {
        return this.currentPhase === evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP;
    }
    업무수행_단계인가() {
        return this.currentPhase === evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE;
    }
    자기평가_단계인가() {
        return this.currentPhase === evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION;
    }
    하향동료평가_단계인가() {
        return this.currentPhase === evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION;
    }
    종결_단계인가() {
        return this.currentPhase === evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE;
    }
    평가기간_내인가() {
        const now = new Date();
        return (now >= this.startDate && (this.endDate ? now <= this.endDate : false));
    }
    만료된_상태인가() {
        const now = new Date();
        return this.endDate ? now > this.endDate : false;
    }
    상태전이_유효한가(targetStatus) {
        const validTransitions = {
            [evaluation_period_types_1.EvaluationPeriodStatus.WAITING]: [evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS],
            [evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS]: [
                evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED,
                evaluation_period_types_1.EvaluationPeriodStatus.WAITING,
            ],
            [evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED]: [],
        };
        return validTransitions[this.status]?.includes(targetStatus) ?? false;
    }
    단계전이_유효한가(targetPhase) {
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
        if (!this.currentPhase) {
            return targetPhase === evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP;
        }
        return (validPhaseTransitions[this.currentPhase]?.includes(targetPhase) ?? false);
    }
    자기평가_달성률_유효한가(rate) {
        return rate >= 0 && rate <= 200 && Number.isInteger(rate);
    }
    자기평가_달성률_최대값() {
        return this.maxSelfEvaluationRate;
    }
    정보_업데이트한다(name, description, updatedBy) {
        if (name !== undefined) {
            if (!name.trim()) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodRequiredDataMissingException('평가 기간명은 필수입니다.');
            }
            this.name = name.trim();
        }
        if (description !== undefined) {
            this.description = description.trim() || undefined;
        }
        if (updatedBy) {
            this.updatedBy = updatedBy;
        }
        this.updatedAt = new Date();
    }
    일정_업데이트한다(startDate, endDate, updatedBy) {
        const newStartDate = startDate || this.startDate;
        const newEndDate = endDate || this.endDate;
        if (newEndDate && newStartDate >= newEndDate) {
            throw new evaluation_period_exceptions_1.InvalidEvaluationPeriodDateRangeException('시작일은 종료일보다 이전이어야 합니다.');
        }
        if (startDate)
            this.startDate = startDate;
        if (endDate)
            this.endDate = endDate;
        if (updatedBy) {
            this.updatedBy = updatedBy;
        }
        this.updatedAt = new Date();
    }
    단계별_마감일_업데이트한다(evaluationSetupDeadline, performanceDeadline, selfEvaluationDeadline, peerEvaluationDeadline, updatedBy) {
        if (evaluationSetupDeadline !== undefined)
            this.evaluationSetupDeadline = evaluationSetupDeadline;
        if (performanceDeadline !== undefined)
            this.performanceDeadline = performanceDeadline;
        if (selfEvaluationDeadline !== undefined)
            this.selfEvaluationDeadline = selfEvaluationDeadline;
        if (peerEvaluationDeadline !== undefined)
            this.peerEvaluationDeadline = peerEvaluationDeadline;
        if (updatedBy) {
            this.updatedBy = updatedBy;
        }
        this.updatedAt = new Date();
    }
    단계_마감일_설정한다(phase, deadline, setBy) {
        switch (phase) {
            case evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP:
                this.evaluationSetupDeadline = deadline;
                break;
            case evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE:
                this.performanceDeadline = deadline;
                break;
            case evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION:
                this.selfEvaluationDeadline = deadline;
                break;
            case evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION:
                this.peerEvaluationDeadline = deadline;
                break;
            default:
                throw new Error(`지원하지 않는 단계입니다: ${phase}`);
        }
        this.updatedBy = setBy;
        this.updatedAt = new Date();
    }
    단계_마감일_조회한다(phase) {
        switch (phase) {
            case evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP:
                return this.evaluationSetupDeadline || null;
            case evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE:
                return this.performanceDeadline || null;
            case evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION:
                return this.selfEvaluationDeadline || null;
            case evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION:
                return this.peerEvaluationDeadline || null;
            default:
                return null;
        }
    }
    단계_마감된_상태인가(phase) {
        const deadline = this.단계_마감일_조회한다(phase);
        if (!deadline)
            return false;
        const now = new Date();
        return now > deadline;
    }
    등급구간_설정한다(gradeRanges, setBy) {
        this.등급구간_유효성_검증한다(gradeRanges);
        this.gradeRanges = [...gradeRanges].sort((a, b) => b.minRange - a.minRange);
        this.updatedBy = setBy;
        this.updatedAt = new Date();
    }
    점수로_등급_조회한다(score) {
        if (!this.gradeRanges || this.gradeRanges.length === 0) {
            return null;
        }
        const gradeRange = this.gradeRanges.find((range) => score >= range.minRange && score <= range.maxRange);
        if (!gradeRange) {
            return null;
        }
        let subGrade = evaluation_period_types_1.SubGradeType.NONE;
        let finalGrade = gradeRange.grade;
        if (gradeRange.subGrades && gradeRange.subGrades.length > 0) {
            const subGradeInfo = gradeRange.subGrades.find((sub) => score >= sub.minRange && score <= sub.maxRange);
            if (subGradeInfo) {
                subGrade = subGradeInfo.type;
                finalGrade = `${gradeRange.grade}${subGrade === evaluation_period_types_1.SubGradeType.PLUS
                    ? '+'
                    : subGrade === evaluation_period_types_1.SubGradeType.MINUS
                        ? '-'
                        : ''}`;
            }
        }
        return {
            score,
            grade: gradeRange.grade,
            subGrade,
            finalGrade,
        };
    }
    등급구간_유효성_검증한다(gradeRanges) {
        if (!gradeRanges || gradeRanges.length === 0) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException('등급 구간은 최소 1개 이상 설정되어야 합니다.');
        }
        const grades = gradeRanges.map((range) => range.grade);
        const uniqueGrades = new Set(grades);
        if (grades.length !== uniqueGrades.size) {
            throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException('중복된 등급이 존재합니다.');
        }
        for (const range of gradeRanges) {
            if (range.minRange >= range.maxRange) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException(`등급 ${range.grade}의 최소 범위는 최대 범위보다 작아야 합니다.`);
            }
            if (range.minRange < 0 || range.maxRange > 1000) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException(`등급 ${range.grade}의 점수 범위는 0-1000 사이여야 합니다.`);
            }
        }
        const sortedRanges = [...gradeRanges].sort((a, b) => a.minRange - b.minRange);
        for (let i = 0; i < sortedRanges.length - 1; i++) {
            const current = sortedRanges[i];
            const next = sortedRanges[i + 1];
            if (current.maxRange >= next.minRange) {
                throw new evaluation_period_exceptions_1.EvaluationPeriodBusinessRuleViolationException(`등급 ${current.grade}와 ${next.grade}의 점수 범위가 겹칩니다.`);
            }
        }
    }
    등급구간_설정됨() {
        return this.gradeRanges && this.gradeRanges.length > 0;
    }
    등급구간_조회한다(grade) {
        if (!this.gradeRanges) {
            return null;
        }
        return this.gradeRanges.find((range) => range.grade === grade) || null;
    }
    DTO_변환한다() {
        return {
            id: this.id,
            name: this.name,
            startDate: this.startDate,
            endDate: this.endDate,
            description: this.description,
            status: this.status,
            currentPhase: this.currentPhase,
            evaluationSetupDeadline: this.evaluationSetupDeadline,
            performanceDeadline: this.performanceDeadline,
            selfEvaluationDeadline: this.selfEvaluationDeadline,
            peerEvaluationDeadline: this.peerEvaluationDeadline,
            completedDate: this.completedDate,
            criteriaSettingEnabled: this.criteriaSettingEnabled,
            selfEvaluationSettingEnabled: this.selfEvaluationSettingEnabled,
            finalEvaluationSettingEnabled: this.finalEvaluationSettingEnabled,
            maxSelfEvaluationRate: this.maxSelfEvaluationRate,
            gradeRanges: this.gradeRanges || [],
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
    DTO로_변환한다() {
        return this.DTO_변환한다();
    }
    수동설정이_있는가(field) {
        return this.manuallySetFields.includes(field);
    }
    평가기준설정_수동허용_활성화한다(enabledBy) {
        this.criteriaSettingEnabled = true;
        if (!this.manuallySetFields.includes('criteriaSettingEnabled')) {
            this.manuallySetFields.push('criteriaSettingEnabled');
        }
        this.updatedBy = enabledBy;
        this.updatedAt = new Date();
    }
    평가기준설정_수동허용_비활성화한다(disabledBy) {
        this.criteriaSettingEnabled = false;
        if (!this.manuallySetFields.includes('criteriaSettingEnabled')) {
            this.manuallySetFields.push('criteriaSettingEnabled');
        }
        this.updatedBy = disabledBy;
        this.updatedAt = new Date();
    }
    자기평가설정_수동허용_활성화한다(enabledBy) {
        this.selfEvaluationSettingEnabled = true;
        if (!this.manuallySetFields.includes('selfEvaluationSettingEnabled')) {
            this.manuallySetFields.push('selfEvaluationSettingEnabled');
        }
        this.updatedBy = enabledBy;
        this.updatedAt = new Date();
    }
    자기평가설정_수동허용_비활성화한다(disabledBy) {
        this.selfEvaluationSettingEnabled = false;
        if (!this.manuallySetFields.includes('selfEvaluationSettingEnabled')) {
            this.manuallySetFields.push('selfEvaluationSettingEnabled');
        }
        this.updatedBy = disabledBy;
        this.updatedAt = new Date();
    }
    하향동료평가설정_수동허용_활성화한다(enabledBy) {
        this.finalEvaluationSettingEnabled = true;
        if (!this.manuallySetFields.includes('finalEvaluationSettingEnabled')) {
            this.manuallySetFields.push('finalEvaluationSettingEnabled');
        }
        this.updatedBy = enabledBy;
        this.updatedAt = new Date();
    }
    하향동료평가설정_수동허용_비활성화한다(disabledBy) {
        this.finalEvaluationSettingEnabled = false;
        if (!this.manuallySetFields.includes('finalEvaluationSettingEnabled')) {
            this.manuallySetFields.push('finalEvaluationSettingEnabled');
        }
        this.updatedBy = disabledBy;
        this.updatedAt = new Date();
    }
};
exports.EvaluationPeriod = EvaluationPeriod;
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        comment: '평가 기간명',
    }),
    __metadata("design:type", String)
], EvaluationPeriod.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        comment: '평가 기간 시작일',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value instanceof Date ? value.toISOString() : value),
    __metadata("design:type", Date)
], EvaluationPeriod.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        comment: '평가 기간 종료일',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value instanceof Date ? value.toISOString() : value),
    __metadata("design:type", Date)
], EvaluationPeriod.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '평가 기간 설명',
    }),
    __metadata("design:type", String)
], EvaluationPeriod.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [...Object.values(evaluation_period_types_1.EvaluationPeriodStatus)],
        default: 'waiting',
        comment: '평가 기간 상태',
    }),
    __metadata("design:type", String)
], EvaluationPeriod.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [...Object.values(evaluation_period_types_1.EvaluationPeriodPhase)],
        default: 'waiting',
        nullable: true,
        comment: '현재 진행 단계',
    }),
    __metadata("design:type", String)
], EvaluationPeriod.prototype, "currentPhase", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        comment: '평가설정 단계 마감일',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value instanceof Date ? value.toISOString() : value),
    __metadata("design:type", Date)
], EvaluationPeriod.prototype, "evaluationSetupDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        comment: '업무 수행 단계 마감일',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value instanceof Date ? value.toISOString() : value),
    __metadata("design:type", Date)
], EvaluationPeriod.prototype, "performanceDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        comment: '자기 평가 단계 마감일',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value instanceof Date ? value.toISOString() : value),
    __metadata("design:type", Date)
], EvaluationPeriod.prototype, "selfEvaluationDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        comment: '하향/동료평가 단계 마감일',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value instanceof Date ? value.toISOString() : value),
    __metadata("design:type", Date)
], EvaluationPeriod.prototype, "peerEvaluationDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        comment: '평가 완료일',
    }),
    __metadata("design:type", Date)
], EvaluationPeriod.prototype, "completedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '평가 기준 설정 수동 허용 여부',
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriod.prototype, "criteriaSettingEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '자기 평가 설정 수동 허용 여부',
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriod.prototype, "selfEvaluationSettingEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '하향/동료평가 설정 수동 허용 여부',
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriod.prototype, "finalEvaluationSettingEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'json',
        nullable: true,
        comment: '수동으로 설정된 항목들',
    }),
    __metadata("design:type", Array)
], EvaluationPeriod.prototype, "manuallySetFields", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        default: 120,
        comment: '자기평가 달성률 최대값 (%)',
    }),
    __metadata("design:type", Number)
], EvaluationPeriod.prototype, "maxSelfEvaluationRate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'json',
        nullable: true,
        comment: '등급 구간 설정 (JSON)',
    }),
    __metadata("design:type", Array)
], EvaluationPeriod.prototype, "gradeRanges", void 0);
exports.EvaluationPeriod = EvaluationPeriod = __decorate([
    (0, typeorm_1.Entity)('evaluation_period'),
    (0, typeorm_1.Index)(['name'], { unique: true }),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['currentPhase']),
    (0, typeorm_1.Index)(['startDate']),
    (0, typeorm_1.Index)(['endDate']),
    (0, typeorm_1.Index)(['maxSelfEvaluationRate'])
], EvaluationPeriod);
//# sourceMappingURL=evaluation-period.entity.js.map