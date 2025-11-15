import { AuthService } from '@context/auth-context/auth.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { LoginDto } from '@interface/common/dto/auth/login.dto';
import { LoginResponseDto } from '@interface/common/dto/auth/login-response.dto';
import { UserInfoDto } from '@interface/common/dto/auth/login-response.dto';
export declare class UserAuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    getMe(user: AuthenticatedUser): Promise<UserInfoDto>;
}
