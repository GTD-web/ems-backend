import { AuthService } from '@context/auth-context/auth.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { LoginDto, LoginResponseDto, UserInfoDto } from './dto';
export declare class UserAuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    getMe(user: AuthenticatedUser): Promise<UserInfoDto>;
}
