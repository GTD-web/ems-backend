import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  RemoveNewEmployeesDto,
  RemoveNewEmployeesResultDto,
} from '../../dto/seed-data';

export const ApiRemoveNewEmployees = () =>
  applyDecorators(
    ApiOperation({
      summary: '신규 입사자 삭제 (되돌리기)',
      description: `특정 배치로 추가된 신규 입사자들을 삭제합니다.

**동작:**
- 배치 번호(타임스탬프)로 추가된 직원들을 조회
- 해당 직원들을 soft delete 처리
- 삭제된 직원 목록을 반환

**배치 번호 확인 방법:**
- 신규 입사자 추가 시 생성된 직원 번호의 접두사 패턴 사용
- 예: NEW1732512345001 → 배치 번호는 NEW1732512345
- 직원 번호 형식: NEW{타임스탬프}{순번3자리}

**테스트 케이스:**
- 정상 삭제: 유효한 배치 번호로 해당 배치의 모든 직원 삭제
- 존재하지 않는 배치: 해당 배치 번호로 추가된 직원이 없는 경우 404 에러
- 잘못된 형식: 배치 번호 형식이 맞지 않는 경우 400 에러
- 이미 삭제된 직원: 이미 삭제된 직원은 제외하고 처리
- 부분 실패: 일부 직원 삭제 실패 시 성공한 직원은 삭제되고 오류 정보 반환`,
    }),
    ApiBody({
      type: RemoveNewEmployeesDto,
      examples: {
        basic: {
          summary: '배치 번호로 삭제',
          description: '신규 입사자 추가 시 생성된 배치 번호로 해당 배치 직원 전체 삭제',
          value: {
            batchNumber: 'NEW1732512345',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: '신규 입사자가 성공적으로 삭제되었습니다.',
      type: RemoveNewEmployeesResultDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (배치 번호 형식 오류)',
    }),
    ApiResponse({
      status: 404,
      description: '해당 배치 번호로 추가된 직원을 찾을 수 없음',
    }),
    ApiResponse({
      status: 500,
      description: '서버 오류 (직원 삭제 중 오류 발생)',
    }),
  );

