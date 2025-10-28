import { StateDistributionConfig } from './seed-scenario.types';

export const DEFAULT_STATE_DISTRIBUTION: Required<StateDistributionConfig> = {
  // Phase 1
  departmentHierarchy: {
    maxDepth: 3,
    childrenPerParent: { min: 0, max: 3 },
    rootDepartmentRatio: 0.2,
  },
  employeeStatus: { active: 0.85, onLeave: 0.05, resigned: 0.1 },
  excludedFromList: 0.03,
  projectStatus: { active: 0.7, completed: 0.25, cancelled: 0.05 },
  projectManagerAssignmentRatio: 0.95,
  wbsHierarchy: {
    maxDepth: 3,
    childrenPerParent: { min: 0, max: 4 },
  },
  wbsStatus: { pending: 0.2, inProgress: 0.6, completed: 0.2 },
  wbsAssignmentRatio: 0.9,

  // Phase 2
  evaluationPeriodStatus: { waiting: 0.3, inProgress: 0.7, completed: 0.0 },
  evaluationPeriodPhase: {
    evaluationSetup: 0.2,
    performance: 0.2,
    selfEvaluation: 0.25,
    peerEvaluation: 0.25,
    closure: 0.1,
  },
  excludedFromEvaluation: 0.05,

  // Phase 4
  wbsCriteriaPerWbs: { min: 2, max: 5 },
  evaluationLineCount: {
    primary: 1,
    secondary: 1,
    additionalMin: 0,
    additionalMax: 2,
  },
  evaluationLineMappingTypes: {
    primaryOnly: 0.3,
    primaryAndSecondary: 0.5,
    withAdditional: 0.2,
  },

  // Phase 5
  deliverablePerWbs: {
    none: 0.15,
    one: 0.3,
    twoToThree: 0.4,
    fourOrMore: 0.15,
  },
  deliverableType: { url: 0.6, nas: 0.4 },

  // Phase 6
  questionGroupCount: { min: 3, max: 8 },
  questionGroupSpecial: { defaultGroupRatio: 0.3, nonDeletableRatio: 0.4 },
  questionsPerGroup: { min: 3, max: 10 },
  questionType: { scoreOnly: 0.4, textOnly: 0.3, scoreAndText: 0.3 },
  questionGroupMappingRatio: {
    singleGroup: 0.6,
    twoGroups: 0.3,
    threeOrMore: 0.1,
  },

  // Phase 7
  selfEvaluationProgress: {
    notStarted: 0.15,
    inProgress: 0.25,
    completed: 0.6,
  },
  downwardEvaluationProgress: {
    notStarted: 0.2,
    inProgress: 0.3,
    completed: 0.5,
  },
  primaryDownwardEvaluationProgress: {
    notStarted: 0.2,
    inProgress: 0.3,
    completed: 0.5,
  },
  secondaryDownwardEvaluationProgress: {
    notStarted: 0.2,
    inProgress: 0.3,
    completed: 0.5,
  },
  downwardEvaluationTypes: { primaryOnly: 0.2, secondaryOnly: 0.1, both: 0.7 },
  downwardEvaluationSelfReference: 0.8,
  peerEvaluationProgress: {
    notStarted: 0.25,
    inProgress: 0.35,
    completed: 0.4,
  },
  peerEvaluatorCount: { one: 0.2, two: 0.4, three: 0.3, fourOrMore: 0.1 },
  peerEvaluationQuestionAssignment: {
    noQuestions: 0.1,
    oneGroup: 0.3,
    twoGroups: 0.4,
    threeOrMore: 0.2,
  },
  finalEvaluationProgress: { notStarted: 0.4, inProgress: 0.2, completed: 0.4 },
  scoreGeneration: {
    min: 60,
    max: 100,
    distribution: 'normal',
    mean: 80,
    stdDev: 10,
  },

  // Phase 8
  evaluationResponseRatio: { noResponse: 0.1, hasResponse: 0.9 },

  // 날짜 생성
  dateGeneration: {
    evaluationPeriod: {
      durationMonths: { min: 6, max: 12 },
      phaseGapDays: 7,
    },
    project: {
      durationMonths: { min: 3, max: 12 },
    },
    wbs: {
      durationDays: { min: 7, max: 90 },
    },
  },
};
