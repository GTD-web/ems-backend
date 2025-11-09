import { EntityManager } from 'typeorm';
import type { EvaluationPeriodStatus, EvaluationPeriodPhase, EvaluationPeriodFilter, CreateEvaluationPeriodDto, UpdateEvaluationPeriodDto } from '../evaluation-period.types';
import type { IEvaluationPeriod } from './evaluation-period.interface';
export interface IEvaluationPeriodService {
    ID로_조회한다(id: string, manager?: EntityManager): Promise<IEvaluationPeriod | null>;
    이름으로_조회한다(name: string, manager?: EntityManager): Promise<IEvaluationPeriod | null>;
    전체_조회한다(manager?: EntityManager): Promise<IEvaluationPeriod[]>;
    상태별_조회한다(status: EvaluationPeriodStatus, manager?: EntityManager): Promise<IEvaluationPeriod[]>;
    단계별_조회한다(phase: EvaluationPeriodPhase, manager?: EntityManager): Promise<IEvaluationPeriod[]>;
    활성화된_평가기간_조회한다(manager?: EntityManager): Promise<IEvaluationPeriod[]>;
    현재_진행중_평가기간_조회한다(manager?: EntityManager): Promise<IEvaluationPeriod | null>;
    완료된_평가기간_조회한다(manager?: EntityManager): Promise<IEvaluationPeriod[]>;
    필터_조회한다(filter: EvaluationPeriodFilter, manager?: EntityManager): Promise<IEvaluationPeriod[]>;
    생성한다(createDto: CreateEvaluationPeriodDto, createdBy: string, manager?: EntityManager): Promise<IEvaluationPeriod>;
    업데이트한다(id: string, updateDto: UpdateEvaluationPeriodDto, updatedBy: string, manager?: EntityManager): Promise<IEvaluationPeriod>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    시작한다(id: string, startedBy: string, manager?: EntityManager): Promise<IEvaluationPeriod>;
    완료한다(id: string, completedBy: string, manager?: EntityManager): Promise<IEvaluationPeriod>;
    단계_변경한다(id: string, targetPhase: EvaluationPeriodPhase, changedBy: string, manager?: EntityManager): Promise<IEvaluationPeriod>;
    수동허용설정_변경한다(id: string, criteriaSettingEnabled?: boolean, selfEvaluationSettingEnabled?: boolean, finalEvaluationSettingEnabled?: boolean, changedBy?: string, manager?: EntityManager): Promise<IEvaluationPeriod>;
    자기평가_달성률최대값_설정한다(id: string, maxRate: number, setBy: string, manager?: EntityManager): Promise<IEvaluationPeriod>;
}
