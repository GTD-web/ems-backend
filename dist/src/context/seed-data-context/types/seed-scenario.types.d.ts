export declare enum SeedScenario {
    MINIMAL = "minimal",
    WITH_PERIOD = "with_period",
    WITH_ASSIGNMENTS = "with_assignments",
    WITH_SETUP = "with_setup",
    FULL = "full"
}
export interface SeedDataConfig {
    scenario: SeedScenario;
    clearExisting: boolean;
    dataScale: {
        departmentCount: number;
        employeeCount: number;
        projectCount: number;
        wbsPerProject: number;
    };
    evaluationConfig?: {
        periodCount: number;
    };
    stateDistribution?: StateDistributionConfig;
    useRealDepartments?: boolean;
    useRealEmployees?: boolean;
    currentUserId?: string;
}
export interface StateDistributionConfig {
    departmentHierarchy?: {
        maxDepth: number;
        childrenPerParent: {
            min: number;
            max: number;
        };
        rootDepartmentRatio: number;
    };
    employeeStatus?: {
        active: number;
        onLeave: number;
        resigned: number;
    };
    excludedFromList?: number;
    projectStatus?: {
        active: number;
        completed: number;
        cancelled: number;
    };
    projectManagerAssignmentRatio?: number;
    wbsHierarchy?: {
        maxDepth: number;
        childrenPerParent: {
            min: number;
            max: number;
        };
    };
    wbsStatus?: {
        pending: number;
        inProgress: number;
        completed: number;
    };
    wbsAssignmentRatio?: number;
    evaluationPeriodStatus?: {
        waiting: number;
        inProgress: number;
        completed: number;
    };
    evaluationPeriodPhase?: {
        evaluationSetup: number;
        performance: number;
        selfEvaluation: number;
        peerEvaluation: number;
        closure: number;
    };
    excludedFromEvaluation?: number;
    wbsCriteriaPerWbs?: {
        min: number;
        max: number;
    };
    evaluationLineCount?: {
        primary: number;
        secondary: number;
        additionalMin: number;
        additionalMax: number;
    };
    evaluationLineMappingTypes?: {
        primaryOnly: number;
        primaryAndSecondary: number;
        withAdditional: number;
    };
    deliverablePerWbs?: {
        none: number;
        one: number;
        twoToThree: number;
        fourOrMore: number;
    };
    deliverableType?: {
        url: number;
        nas: number;
    };
    questionGroupCount?: {
        min: number;
        max: number;
    };
    questionGroupSpecial?: {
        defaultGroupRatio: number;
        nonDeletableRatio: number;
    };
    questionsPerGroup?: {
        min: number;
        max: number;
    };
    questionType?: {
        scoreOnly: number;
        textOnly: number;
        scoreAndText: number;
    };
    questionGroupMappingRatio?: {
        singleGroup: number;
        twoGroups: number;
        threeOrMore: number;
    };
    selfEvaluationProgress?: {
        notStarted: number;
        inProgress: number;
        completed: number;
    };
    downwardEvaluationProgress?: {
        notStarted: number;
        inProgress: number;
        completed: number;
    };
    primaryDownwardEvaluationProgress?: {
        notStarted: number;
        inProgress: number;
        completed: number;
    };
    secondaryDownwardEvaluationProgress?: {
        notStarted: number;
        inProgress: number;
        completed: number;
    };
    downwardEvaluationTypes?: {
        primaryOnly: number;
        secondaryOnly: number;
        both: number;
    };
    downwardEvaluationSelfReference?: number;
    peerEvaluationProgress?: {
        notStarted: number;
        inProgress: number;
        completed: number;
    };
    peerEvaluatorCount?: {
        one: number;
        two: number;
        three: number;
        fourOrMore: number;
    };
    peerEvaluationQuestionAssignment?: {
        noQuestions: number;
        oneGroup: number;
        twoGroups: number;
        threeOrMore: number;
    };
    finalEvaluationProgress?: {
        notStarted: number;
        inProgress: number;
        completed: number;
    };
    scoreGeneration?: {
        min: number;
        max: number;
        distribution: 'normal' | 'uniform';
        mean?: number;
        stdDev?: number;
    };
    evaluationResponseRatio?: {
        noResponse: number;
        hasResponse: number;
    };
    dateGeneration?: {
        evaluationPeriod: {
            durationMonths: {
                min: number;
                max: number;
            };
            phaseGapDays: number;
        };
        project: {
            durationMonths: {
                min: number;
                max: number;
            };
        };
        wbs: {
            durationDays: {
                min: number;
                max: number;
            };
        };
    };
}
export interface GeneratorResult {
    phase: string;
    entityCounts: Record<string, number>;
    generatedIds: Record<string, string[] | string>;
    stateDistribution?: Record<string, Record<string, number>>;
    duration: number;
    errors?: string[];
}
