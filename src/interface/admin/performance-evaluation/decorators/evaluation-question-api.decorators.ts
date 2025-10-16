import {
  applyDecorators,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import {
  CreateQuestionGroupDto,
  UpdateQuestionGroupDto,
  QuestionGroupResponseDto,
  CreateEvaluationQuestionDto,
  UpdateEvaluationQuestionDto,
  EvaluationQuestionResponseDto,
  AddQuestionToGroupDto,
  UpdateQuestionDisplayOrderDto,
  QuestionGroupMappingResponseDto,
  SuccessResponseDto,
} from '../dto/evaluation-question.dto';

// ==================== 질문 그룹 API ====================

/**
 * 질문 그룹 생성 API 데코레이터
 */
export function CreateQuestionGroup() {
  return applyDecorators(
    Post('question-groups'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '질문 그룹 생성',
      description: `평가 질문을 그룹으로 관리하기 위한 질문 그룹을 생성합니다.

**동작:**
- 새로운 질문 그룹 생성
- 그룹명은 중복될 수 없음
- 기본 그룹 설정 가능

**테스트 케이스:**
- 기본 생성: 그룹명을 지정하여 질문 그룹 생성
- 기본 그룹 설정: isDefault를 true로 설정하여 기본 그룹 생성
- createdBy 포함: 생성자 ID 포함하여 생성 가능
- 응답 구조 검증: 응답에 id와 message 필드 포함
- 그룹명 중복: 동일한 그룹명으로 생성 시 409 에러
- 그룹명 누락: name 필드 누락 시 400 에러
- 빈 그룹명: 빈 문자열로 생성 시 400 에러`,
    }),
    ApiBody({
      type: CreateQuestionGroupDto,
      description: '질문 그룹 생성 정보',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: '질문 그룹이 성공적으로 생성되었습니다.',
      type: SuccessResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 동일한 그룹명이 존재합니다.',
    }),
  );
}

/**
 * 질문 그룹 수정 API 데코레이터
 */
export function UpdateQuestionGroup() {
  return applyDecorators(
    Put('question-groups/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '질문 그룹 수정',
      description: `질문 그룹 정보를 수정합니다.

**동작:**
- 질문 그룹의 이름 또는 기본 그룹 설정 변경
- 변경된 그룹명이 다른 그룹과 중복되지 않아야 함

**테스트 케이스:**
- 그룹명 수정: name 필드로 그룹명 변경
- 기본 그룹 설정: isDefault를 true로 변경하여 기본 그룹으로 설정
- 부분 수정: 일부 필드만 포함하여 수정 가능
- 존재하지 않는 그룹: 잘못된 ID로 요청 시 404 에러
- 그룹명 중복: 다른 그룹과 중복되는 이름으로 변경 시 409 에러
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '질문 그룹 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      type: UpdateQuestionGroupDto,
      description: '질문 그룹 수정 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '질문 그룹이 성공적으로 수정되었습니다.',
      type: SuccessResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '질문 그룹을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 동일한 그룹명이 존재합니다.',
    }),
  );
}

/**
 * 질문 그룹 삭제 API 데코레이터
 */
export function DeleteQuestionGroup() {
  return applyDecorators(
    Delete('question-groups/:id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({
      summary: '질문 그룹 삭제',
      description: `질문 그룹을 삭제합니다.

**동작:**
- 질문 그룹을 Soft Delete 처리
- 기본 그룹은 삭제 불가
- 삭제 불가능으로 설정된 그룹은 삭제 불가

**테스트 케이스:**
- 정상 삭제: 삭제 가능한 그룹 삭제
- 기본 그룹 삭제 시도: isDefault가 true인 그룹 삭제 시 400 에러
- 삭제 불가 그룹: isDeletable이 false인 그룹 삭제 시 400 에러
- 존재하지 않는 그룹: 잘못된 ID로 요청 시 404 에러
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '질문 그룹 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: '질문 그룹이 성공적으로 삭제되었습니다.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '삭제할 수 없는 그룹입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '질문 그룹을 찾을 수 없습니다.',
    }),
  );
}

/**
 * 질문 그룹 조회 API 데코레이터
 */
export function GetQuestionGroup() {
  return applyDecorators(
    Get('question-groups/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '질문 그룹 조회',
      description: `질문 그룹 상세 정보를 조회합니다.

**동작:**
- 질문 그룹 ID로 상세 정보 조회

**테스트 케이스:**
- 정상 조회: 유효한 ID로 그룹 정보 조회
- 응답 구조 검증: 응답에 id, name, isDefault, isDeletable 등의 필드 포함
- 존재하지 않는 그룹: 잘못된 ID로 요청 시 404 에러
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '질문 그룹 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '질문 그룹 정보 조회 성공',
      type: QuestionGroupResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '질문 그룹을 찾을 수 없습니다.',
    }),
  );
}

/**
 * 질문 그룹 목록 조회 API 데코레이터
 */
export function GetQuestionGroups() {
  return applyDecorators(
    Get('question-groups'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '질문 그룹 목록 조회',
      description: `전체 질문 그룹 목록을 조회합니다.

**동작:**
- 삭제되지 않은 모든 질문 그룹 조회
- 생성일시 오름차순으로 정렬

**테스트 케이스:**
- 전체 목록 조회: 모든 질문 그룹 조회
- 빈 배열 반환: 등록된 그룹이 없을 경우 빈 배열 반환
- 응답 구조 검증: 각 항목에 필수 필드 포함`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '질문 그룹 목록 조회 성공',
      type: [QuestionGroupResponseDto],
    }),
  );
}

/**
 * 기본 질문 그룹 조회 API 데코레이터
 */
export function GetDefaultQuestionGroup() {
  return applyDecorators(
    Get('question-groups/default'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '기본 질문 그룹 조회',
      description: `기본으로 설정된 질문 그룹을 조회합니다.

**동작:**
- isDefault가 true인 그룹 조회

**테스트 케이스:**
- 기본 그룹 조회: isDefault가 true인 그룹 조회
- 기본 그룹 없음: 기본 그룹이 설정되지 않은 경우 404 에러`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '기본 질문 그룹 조회 성공',
      type: QuestionGroupResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '기본 질문 그룹이 설정되지 않았습니다.',
    }),
  );
}

// ==================== 평가 질문 API ====================

/**
 * 평가 질문 생성 API 데코레이터
 */
export function CreateEvaluationQuestion() {
  return applyDecorators(
    Post('evaluation-questions'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '평가 질문 생성',
      description: `새로운 평가 질문을 생성합니다.

**동작:**
- 평가에 사용할 질문 생성
- 질문 내용은 중복될 수 없음
- 점수 범위 설정 가능 (최소/최대 점수)

**테스트 케이스:**
- 기본 생성: 질문 내용만 지정하여 생성
- 점수 범위 포함: minScore, maxScore를 포함하여 생성
- 응답 구조 검증: 응답에 id와 message 필드 포함
- 질문 내용 중복: 동일한 질문 내용으로 생성 시 409 에러
- 질문 내용 누락: text 필드 누락 시 400 에러
- 잘못된 점수 범위: minScore >= maxScore인 경우 400 에러`,
    }),
    ApiBody({
      type: CreateEvaluationQuestionDto,
      description: '평가 질문 생성 정보',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: '평가 질문이 성공적으로 생성되었습니다.',
      type: SuccessResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 동일한 질문 내용이 존재합니다.',
    }),
  );
}

/**
 * 평가 질문 수정 API 데코레이터
 */
export function UpdateEvaluationQuestion() {
  return applyDecorators(
    Put('evaluation-questions/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가 질문 수정',
      description: `평가 질문 정보를 수정합니다.

**동작:**
- 질문 내용 또는 점수 범위 변경
- 변경된 질문 내용이 다른 질문과 중복되지 않아야 함

**테스트 케이스:**
- 질문 내용 수정: text 필드로 질문 내용 변경
- 점수 범위 수정: minScore, maxScore 변경
- 부분 수정: 일부 필드만 포함하여 수정 가능
- 존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러
- 질문 내용 중복: 다른 질문과 중복되는 내용으로 변경 시 409 에러
- 잘못된 점수 범위: minScore >= maxScore인 경우 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '평가 질문 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      type: UpdateEvaluationQuestionDto,
      description: '평가 질문 수정 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '평가 질문이 성공적으로 수정되었습니다.',
      type: SuccessResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '평가 질문을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 동일한 질문 내용이 존재합니다.',
    }),
  );
}

/**
 * 평가 질문 삭제 API 데코레이터
 */
export function DeleteEvaluationQuestion() {
  return applyDecorators(
    Delete('evaluation-questions/:id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({
      summary: '평가 질문 삭제',
      description: `평가 질문을 삭제합니다.

**동작:**
- 평가 질문을 Soft Delete 처리
- 응답이 있는 질문은 삭제 불가

**테스트 케이스:**
- 정상 삭제: 응답이 없는 질문 삭제
- 응답 있는 질문 삭제: 응답이 있는 질문 삭제 시 400 에러
- 존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '평가 질문 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: '평가 질문이 성공적으로 삭제되었습니다.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '삭제할 수 없는 질문입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '평가 질문을 찾을 수 없습니다.',
    }),
  );
}

/**
 * 평가 질문 조회 API 데코레이터
 */
export function GetEvaluationQuestion() {
  return applyDecorators(
    Get('evaluation-questions/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가 질문 조회',
      description: `평가 질문 상세 정보를 조회합니다.

**동작:**
- 평가 질문 ID로 상세 정보 조회

**테스트 케이스:**
- 정상 조회: 유효한 ID로 질문 정보 조회
- 응답 구조 검증: 응답에 id, text, minScore, maxScore 등의 필드 포함
- 존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '평가 질문 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '평가 질문 정보 조회 성공',
      type: EvaluationQuestionResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '평가 질문을 찾을 수 없습니다.',
    }),
  );
}

/**
 * 평가 질문 목록 조회 API 데코레이터
 */
export function GetEvaluationQuestions() {
  return applyDecorators(
    Get('evaluation-questions'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가 질문 목록 조회',
      description: `전체 평가 질문 목록을 조회합니다.

**동작:**
- 삭제되지 않은 모든 평가 질문 조회
- 생성일시 오름차순으로 정렬

**테스트 케이스:**
- 전체 목록 조회: 모든 평가 질문 조회
- 빈 배열 반환: 등록된 질문이 없을 경우 빈 배열 반환
- 응답 구조 검증: 각 항목에 필수 필드 포함`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '평가 질문 목록 조회 성공',
      type: [EvaluationQuestionResponseDto],
    }),
  );
}

/**
 * 평가 질문 복사 API 데코레이터
 */
export function CopyEvaluationQuestion() {
  return applyDecorators(
    Post('evaluation-questions/:id/copy'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '평가 질문 복사',
      description: `기존 평가 질문을 복사하여 새로운 질문을 생성합니다.

**동작:**
- 기존 질문의 내용과 점수 범위를 복사
- 질문 내용에 "(복사본)" 접미사 추가

**테스트 케이스:**
- 정상 복사: 유효한 ID로 질문 복사
- 복사본 표시: 복사된 질문 내용에 "(복사본)" 포함
- 응답 구조 검증: 응답에 새로운 질문의 id 포함
- 존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '복사할 평가 질문 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: '평가 질문이 성공적으로 복사되었습니다.',
      type: SuccessResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '복사할 평가 질문을 찾을 수 없습니다.',
    }),
  );
}

// ==================== 질문-그룹 매핑 API ====================

/**
 * 그룹에 질문 추가 API 데코레이터
 */
export function AddQuestionToGroup() {
  return applyDecorators(
    Post('question-group-mappings'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '그룹에 질문 추가',
      description: `질문을 특정 그룹에 추가합니다.

**동작:**
- 질문과 그룹을 매핑하여 추가
- 동일한 질문이 여러 그룹에 속할 수 있음
- 표시 순서 지정 가능

**테스트 케이스:**
- 정상 추가: groupId, questionId, displayOrder를 지정하여 추가
- 응답 구조 검증: 응답에 매핑 id 포함
- 중복 매핑 방지: 동일한 그룹에 동일한 질문 추가 시 409 에러
- 존재하지 않는 그룹: 유효하지 않은 groupId로 요청 시 404 에러
- 존재하지 않는 질문: 유효하지 않은 questionId로 요청 시 404 에러
- 필수 필드 누락: groupId, questionId, displayOrder 중 하나라도 누락 시 400 에러`,
    }),
    ApiBody({
      type: AddQuestionToGroupDto,
      description: '그룹-질문 매핑 정보',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: '그룹에 질문이 성공적으로 추가되었습니다.',
      type: SuccessResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '그룹 또는 질문을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 해당 그룹에 질문이 추가되어 있습니다.',
    }),
  );
}

/**
 * 그룹에서 질문 제거 API 데코레이터
 */
export function RemoveQuestionFromGroup() {
  return applyDecorators(
    Delete('question-group-mappings/:mappingId'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({
      summary: '그룹에서 질문 제거',
      description: `그룹에서 특정 질문을 제거합니다.

**동작:**
- 질문-그룹 매핑을 Soft Delete 처리
- 질문 자체는 삭제되지 않음

**테스트 케이스:**
- 정상 제거: 유효한 매핑 ID로 제거
- 존재하지 않는 매핑: 잘못된 ID로 요청 시 404 에러
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'mappingId',
      description: '질문-그룹 매핑 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: '그룹에서 질문이 성공적으로 제거되었습니다.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '매핑 정보를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 질문 표시 순서 변경 API 데코레이터
 */
export function UpdateQuestionDisplayOrder() {
  return applyDecorators(
    Patch('question-group-mappings/:mappingId/display-order'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '질문 표시 순서 변경',
      description: `그룹 내 질문의 표시 순서를 변경합니다.

**동작:**
- 질문-그룹 매핑의 표시 순서 변경
- 질문이 표시되는 순서 조정

**테스트 케이스:**
- 정상 변경: displayOrder 값으로 순서 변경
- 존재하지 않는 매핑: 잘못된 ID로 요청 시 404 에러
- 음수 순서: displayOrder가 음수인 경우 400 에러
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'mappingId',
      description: '질문-그룹 매핑 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      type: UpdateQuestionDisplayOrderDto,
      description: '표시 순서 변경 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '질문 표시 순서가 성공적으로 변경되었습니다.',
      type: SuccessResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '매핑 정보를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 그룹의 질문 목록 조회 API 데코레이터
 */
export function GetGroupQuestions() {
  return applyDecorators(
    Get('question-groups/:groupId/questions'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '그룹의 질문 목록 조회',
      description: `특정 그룹에 속한 질문 목록을 조회합니다.

**동작:**
- 그룹에 매핑된 모든 질문 조회
- 표시 순서(displayOrder) 오름차순으로 정렬

**테스트 케이스:**
- 정상 조회: 유효한 groupId로 질문 목록 조회
- 빈 배열 반환: 질문이 없는 그룹의 경우 빈 배열 반환
- 응답 구조 검증: 각 매핑 정보에 id, groupId, questionId, displayOrder 포함
- 순서 정렬: displayOrder 오름차순으로 정렬
- 존재하지 않는 그룹: 잘못된 ID로 요청 시 빈 배열 반환`,
    }),
    ApiParam({
      name: 'groupId',
      description: '질문 그룹 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '그룹의 질문 목록 조회 성공',
      type: [QuestionGroupMappingResponseDto],
    }),
  );
}

/**
 * 질문이 속한 그룹 목록 조회 API 데코레이터
 */
export function GetQuestionGroupsByQuestion() {
  return applyDecorators(
    Get('evaluation-questions/:questionId/groups'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '질문이 속한 그룹 목록 조회',
      description: `특정 질문이 속한 그룹 목록을 조회합니다.

**동작:**
- 질문에 매핑된 모든 그룹 조회
- 한 질문이 여러 그룹에 속할 수 있음

**테스트 케이스:**
- 정상 조회: 유효한 questionId로 그룹 목록 조회
- 빈 배열 반환: 어떤 그룹에도 속하지 않은 질문의 경우 빈 배열 반환
- 응답 구조 검증: 각 매핑 정보에 id, groupId, questionId, displayOrder 포함
- 존재하지 않는 질문: 잘못된 ID로 요청 시 빈 배열 반환`,
    }),
    ApiParam({
      name: 'questionId',
      description: '평가 질문 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '질문이 속한 그룹 목록 조회 성공',
      type: [QuestionGroupMappingResponseDto],
    }),
  );
}
