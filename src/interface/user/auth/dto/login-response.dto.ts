import { ApiProperty } from '@nestjs/swagger';

/**
 * 사용자 정보 DTO
 */
export class UserInfoDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: 'SSO 사용자 ID',
    example: 'sso-user-id-123',
  })
  externalId: string;

  @ApiProperty({
    description: '이메일',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '사번',
    example: 'E2023001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: '역할 목록',
    example: ['admin', 'manager', 'user'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: '직원 상태',
    example: '재직중',
  })
  status: string;
}

/**
 * 로그인 응답 DTO
 */
export class LoginResponseDto {
  @ApiProperty({
    description: '사용자 정보',
    type: UserInfoDto,
  })
  user: UserInfoDto;

  @ApiProperty({
    description: '액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
