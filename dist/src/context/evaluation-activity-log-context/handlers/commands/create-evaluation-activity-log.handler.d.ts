import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationActivityLogService } from '@domain/core/evaluation-activity-log/evaluation-activity-log.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import type { EvaluationActivityLogDto } from '@domain/core/evaluation-activity-log/evaluation-activity-log.types';
export declare class 평가활동내역을생성한다 {
    readonly periodId: string;
    readonly employeeId: string;
    readonly activityType: string;
    readonly activityAction: string;
    readonly activityTitle?: string | undefined;
    readonly activityDescription?: string | undefined;
    readonly relatedEntityType?: string | undefined;
    readonly relatedEntityId?: string | undefined;
    readonly performedBy?: string | undefined;
    readonly performedByName?: string | undefined;
    readonly activityMetadata?: Record<string, any> | undefined;
    readonly activityDate?: Date | undefined;
    constructor(periodId: string, employeeId: string, activityType: string, activityAction: string, activityTitle?: string | undefined, activityDescription?: string | undefined, relatedEntityType?: string | undefined, relatedEntityId?: string | undefined, performedBy?: string | undefined, performedByName?: string | undefined, activityMetadata?: Record<string, any> | undefined, activityDate?: Date | undefined);
}
export declare class CreateEvaluationActivityLogHandler implements ICommandHandler<평가활동내역을생성한다, EvaluationActivityLogDto> {
    private readonly activityLogService;
    private readonly employeeService;
    private readonly logger;
    constructor(activityLogService: EvaluationActivityLogService, employeeService: EmployeeService);
    execute(command: 평가활동내역을생성한다): Promise<EvaluationActivityLogDto>;
    private 액션을_텍스트로_변환한다;
    private 객체명을_추출한다;
    private 조사를_결정한다;
}
