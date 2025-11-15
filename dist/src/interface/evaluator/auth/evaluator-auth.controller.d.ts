import { AuthService } from '@context/auth-context/auth.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { LoginResponseDto, UserInfoDto } from '@interface/common/dto/auth/login-response.dto';
import { LoginDto } from '@interface/common/dto/auth/login.dto';
export declare class EvaluatorAuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    getMe(user: AuthenticatedUser): Promise<UserInfoDto>;
}
