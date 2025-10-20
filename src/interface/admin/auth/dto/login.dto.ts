import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * 로그인 요청 DTO
 */
export class LoginDto {
  @ApiProperty({
    description: '이메일',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: '이메일은 필수입니다.' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({
    description: '패스워드',
    example: 'password123',
  })
  @IsNotEmpty({ message: '패스워드는 필수입니다.' })
  @IsString()
  password: string;
}
