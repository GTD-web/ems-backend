import { applyDecorators, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '@interface/decorators';
import { LoginDto, LoginResponseDto } from '../dto';

/**
 * 로그인 API 데코레이터
 */
export function Login() {
  return applyDecorators(
    Public(), // JWT 인증 우회
    Post('login'),
    HttpCode(HttpStatus.OK), // 로그인은 200 OK 반환
    ApiOperation({
      summary: '이메일/패스워드로 로그인',
      description: `이메일과 패스워드로 SSO 서버에 로그인합니다.

**동작:**
- SSO 서버에 로그인 요청
- EMS-PROD 시스템 역할 자동 검증
- Employee 정보 동기화 (생성/업데이트)
- 역할 정보 저장
- 사용자 정보 및 JWT 토큰 반환

**테스트 케이스:**
- 정상 로그인: 유효한 이메일과 패스워드로 로그인 성공
- 사용자 정보 반환: id, email, name, employeeNumber, roles, status 포함
- 토큰 반환: accessToken, refreshToken 포함
- 역할 검증: EMS-PROD 시스템 역할이 있어야 로그인 가능
- 잘못된 이메일 형식: 400 에러
- 필수 필드 누락: email 또는 password 누락 시 400 에러
- 잘못된 인증 정보: 이메일 또는 패스워드 불일치 시 401 에러 (SSO 서버에서 검증)
- 권한 없음: EMS-PROD 시스템 역할이 없는 경우 403 에러`,
    }),
    ApiBody({
      type: LoginDto,
      description: '로그인 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '로그인 성공',
      type: LoginResponseDto,
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (유효성 검증 실패)',
      schema: {
        example: {
          message: ['이메일은 필수입니다.'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: '인증 실패 (이메일 또는 패스워드 불일치)',
      schema: {
        example: {
          message: '이메일 또는 패스워드가 올바르지 않습니다.',
          error: 'Unauthorized',
          statusCode: 401,
        },
      },
    }),
    ApiForbiddenResponse({
      description: '권한 없음 (EMS-PROD 시스템 역할 없음)',
      schema: {
        example: {
          message: '이 시스템에 대한 접근 권한이 없습니다.',
          error: 'Forbidden',
          statusCode: 403,
        },
      },
    }),
  );
}
