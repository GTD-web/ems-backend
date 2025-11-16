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
var Phase6QuestionGenerator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase6QuestionGenerator = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const faker_1 = require("@faker-js/faker");
const question_group_entity_1 = require("../../../domain/sub/question-group/question-group.entity");
const evaluation_question_entity_1 = require("../../../domain/sub/evaluation-question/evaluation-question.entity");
const question_group_mapping_entity_1 = require("../../../domain/sub/question-group-mapping/question-group-mapping.entity");
const types_1 = require("../types");
const utils_1 = require("../utils");
const BATCH_SIZE = 500;
let Phase6QuestionGenerator = Phase6QuestionGenerator_1 = class Phase6QuestionGenerator {
    questionGroupRepository;
    evaluationQuestionRepository;
    questionGroupMappingRepository;
    logger = new common_1.Logger(Phase6QuestionGenerator_1.name);
    constructor(questionGroupRepository, evaluationQuestionRepository, questionGroupMappingRepository) {
        this.questionGroupRepository = questionGroupRepository;
        this.evaluationQuestionRepository = evaluationQuestionRepository;
        this.questionGroupMappingRepository = questionGroupMappingRepository;
    }
    async generate(config, phase1Result) {
        const startTime = Date.now();
        const dist = {
            ...types_1.DEFAULT_STATE_DISTRIBUTION,
            ...config.stateDistribution,
        };
        this.logger.log('Phase 6: 질문 그룹 및 질문 생성');
        const systemAdminId = phase1Result.generatedIds.systemAdminId;
        const { partLeaderGroup, partLeaderQuestions, partLeaderMappings } = await this.생성_파트장평가질문그룹(systemAdminId);
        this.logger.log(`생성 완료: 파트장 평가 질문 그룹 1개, 질문 ${partLeaderQuestions.length}개`);
        const questionGroups = await this.생성_질문그룹들(dist, systemAdminId);
        this.logger.log(`생성 완료: QuestionGroup ${questionGroups.length}개`);
        const questions = await this.생성_평가질문들(dist, systemAdminId);
        this.logger.log(`생성 완료: EvaluationQuestion ${questions.length}개`);
        const groupMappings = await this.생성_질문그룹매핑들(questionGroups, questions, dist, systemAdminId);
        this.logger.log(`생성 완료: QuestionGroupMapping ${groupMappings.length}개`);
        const duration = Date.now() - startTime;
        this.logger.log(`Phase 6 완료 (${duration}ms)`);
        const allQuestionGroups = [partLeaderGroup, ...questionGroups];
        const allQuestions = [...partLeaderQuestions, ...questions];
        const allGroupMappings = [...partLeaderMappings, ...groupMappings];
        return {
            phase: 'Phase6',
            entityCounts: {
                QuestionGroup: allQuestionGroups.length,
                EvaluationQuestion: allQuestions.length,
                QuestionGroupMapping: allGroupMappings.length,
            },
            generatedIds: {
                questionGroupIds: allQuestionGroups.map((qg) => qg.id),
                questionIds: allQuestions.map((q) => q.id),
                questionGroupMappingIds: allGroupMappings.map((qgm) => qgm.id),
                partLeaderQuestionGroupId: partLeaderGroup.id,
                partLeaderQuestionIds: partLeaderQuestions.map((q) => q.id),
            },
            duration,
        };
    }
    async 생성_파트장평가질문그룹(systemAdminId) {
        const partLeaderGroup = new question_group_entity_1.QuestionGroup();
        partLeaderGroup.name = '파트장 평가 질문';
        partLeaderGroup.isDefault = false;
        partLeaderGroup.isDeletable = false;
        partLeaderGroup.createdBy = systemAdminId;
        const [savedGroup] = await this.questionGroupRepository.save([
            partLeaderGroup,
        ]);
        const partLeaderQuestions = [];
        const question1 = new evaluation_question_entity_1.EvaluationQuestion();
        question1.text = '업무 능력은 어떠한가요?';
        question1.minScore = 1;
        question1.maxScore = 5;
        question1.createdBy = systemAdminId;
        partLeaderQuestions.push(question1);
        const question2 = new evaluation_question_entity_1.EvaluationQuestion();
        question2.text = '프로젝트 수행 능력은 어떠한가요?';
        question2.minScore = 1;
        question2.maxScore = 5;
        question2.createdBy = systemAdminId;
        partLeaderQuestions.push(question2);
        const question3 = new evaluation_question_entity_1.EvaluationQuestion();
        question3.text = '부서 관리 능력은 어떠한가요?';
        question3.minScore = 1;
        question3.maxScore = 5;
        question3.createdBy = systemAdminId;
        partLeaderQuestions.push(question3);
        const savedQuestions = await this.evaluationQuestionRepository.save(partLeaderQuestions);
        const partLeaderMappings = [];
        for (let i = 0; i < savedQuestions.length; i++) {
            const mapping = new question_group_mapping_entity_1.QuestionGroupMapping();
            mapping.groupId = savedGroup.id;
            mapping.questionId = savedQuestions[i].id;
            mapping.displayOrder = i;
            mapping.createdBy = systemAdminId;
            partLeaderMappings.push(mapping);
        }
        const savedMappings = await this.questionGroupMappingRepository.save(partLeaderMappings);
        return {
            partLeaderGroup: savedGroup,
            partLeaderQuestions: savedQuestions,
            partLeaderMappings: savedMappings,
        };
    }
    async 생성_질문그룹들(dist, systemAdminId) {
        const groups = [];
        const groupCount = utils_1.ProbabilityUtil.randomInt(dist.questionGroupCount.min, dist.questionGroupCount.max);
        for (let i = 0; i < groupCount; i++) {
            const group = new question_group_entity_1.QuestionGroup();
            group.name = `${faker_1.faker.company.buzzVerb()} ${faker_1.faker.company.buzzNoun()} 그룹 ${i + 1}`;
            group.isDefault =
                Math.random() < dist.questionGroupSpecial.defaultGroupRatio;
            group.isDeletable =
                !group.isDefault &&
                    Math.random() > dist.questionGroupSpecial.nonDeletableRatio;
            group.createdBy = systemAdminId;
            groups.push(group);
        }
        return await this.배치로_저장한다(this.questionGroupRepository, groups, '질문 그룹');
    }
    async 생성_평가질문들(dist, systemAdminId) {
        const questions = [];
        const questionCount = utils_1.ProbabilityUtil.randomInt(15, 30);
        for (let i = 0; i < questionCount; i++) {
            const question = new evaluation_question_entity_1.EvaluationQuestion();
            question.text = faker_1.faker.lorem.sentence() + '?';
            const questionTypeChoice = utils_1.ProbabilityUtil.selectByProbability(dist.questionType);
            if (questionTypeChoice === 'scoreOnly' ||
                questionTypeChoice === 'scoreAndText') {
                question.minScore = 0;
                question.maxScore = 100;
            }
            question.createdBy = systemAdminId;
            questions.push(question);
        }
        return await this.배치로_저장한다(this.evaluationQuestionRepository, questions, '평가 질문');
    }
    async 생성_질문그룹매핑들(questionGroups, questions, dist, systemAdminId) {
        const mappings = [];
        for (const question of questions) {
            const mappingRatioChoice = utils_1.ProbabilityUtil.selectByProbability(dist.questionGroupMappingRatio);
            let groupCount = 1;
            switch (mappingRatioChoice) {
                case 'singleGroup':
                    groupCount = 1;
                    break;
                case 'twoGroups':
                    groupCount = 2;
                    break;
                case 'threeOrMore':
                    groupCount = utils_1.ProbabilityUtil.randomInt(3, 4);
                    break;
            }
            const selectedGroups = this.랜덤_선택(questionGroups, Math.min(groupCount, questionGroups.length));
            for (let i = 0; i < selectedGroups.length; i++) {
                const mapping = new question_group_mapping_entity_1.QuestionGroupMapping();
                mapping.groupId = selectedGroups[i].id;
                mapping.questionId = question.id;
                mapping.displayOrder = i;
                mapping.createdBy = systemAdminId;
                mappings.push(mapping);
            }
        }
        return await this.배치로_저장한다(this.questionGroupMappingRepository, mappings, '질문 그룹 매핑');
    }
    랜덤_선택(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    async 배치로_저장한다(repository, entities, entityName) {
        const saved = [];
        for (let i = 0; i < entities.length; i += BATCH_SIZE) {
            const batch = entities.slice(i, i + BATCH_SIZE);
            const result = await repository.save(batch);
            saved.push(...result);
            this.logger.log(`${entityName} 저장 진행: ${Math.min(i + BATCH_SIZE, entities.length)}/${entities.length}`);
        }
        return saved;
    }
};
exports.Phase6QuestionGenerator = Phase6QuestionGenerator;
exports.Phase6QuestionGenerator = Phase6QuestionGenerator = Phase6QuestionGenerator_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_group_entity_1.QuestionGroup)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_question_entity_1.EvaluationQuestion)),
    __param(2, (0, typeorm_1.InjectRepository)(question_group_mapping_entity_1.QuestionGroupMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], Phase6QuestionGenerator);
//# sourceMappingURL=phase6-question.generator.js.map