import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RemoveAllNewEmployeesResultDto } from '@interface/common/dto/seed-data';

/**
 * 모든 신규 입사자 삭제 API 데코레이터
 */
export function ApiRemoveAllNewEmployees() {
  return applyDecorators(
    ApiOperation({
      summary: '모든 배치 신규 입사자 제거',
      description: `배치로 추가한 모든 신규 입사자를 제거합니다.

**동작:**
- employeeNumber가 "NEW"로 시작하는 모든 직원을 조회
- 조회된 모든 직원을 DB에서 실제로 삭제 (Hard Delete)
- 삭제된 직원 정보를 반환

**테스트 케이스:**
- 기본 동작: 모든 배치 신규 입사자 제거 성공
- 신규 입사자 없음: 삭제할 직원이 없는 경우 404 에러
- 삭제 후 직원 목록: 삭제 후 직원 목록에서 제거되었는지 확인`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '모든 신규 입사자가 성공적으로 삭제되었습니다.',
      type: RemoveAllNewEmployeesResultDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '삭제할 신규 입사자를 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: '직원 삭제 중 오류가 발생했습니다.',
    }),
  );
}

