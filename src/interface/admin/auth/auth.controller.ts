import { Body, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '@context/auth-context/auth.service';
import { Login } from './decorators';
import { LoginDto, LoginResponseDto } from './dto';

/**
 * 인증 컨트롤러
 *
 * 로그인, 토큰 갱신 등 인증 관련 API를 제공합니다.
 */
@ApiTags('A-0-0. 인증')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 이메일/패스워드로 로그인
   */
  @Login()
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.authService.로그인한다(
      loginDto.email,
      loginDto.password,
    );

    return {
      user: {
        id: result.user.id,
        externalId: result.user.externalId,
        email: result.user.email,
        name: result.user.name,
        employeeNumber: result.user.employeeNumber,
        roles: result.user.roles,
        status: result.user.status,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}
