import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from '@context/auth-context';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: jest.Mocked<AuthService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockAuthService = {
      토큰검증및사용자동기화: jest.fn(),
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    authService = module.get(AuthService);
    reflector = module.get(Reflector);
  });

  it('가드가 정의되어야 한다', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {},
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
    });

    it('@Public() 데코레이터가 있으면 인증을 건너뛴다', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(authService.토큰검증및사용자동기화).not.toHaveBeenCalled();
    });

    it('토큰이 없으면 UnauthorizedException을 던진다', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        '인증 토큰이 필요합니다.',
      );
    });

    it('유효한 토큰이면 사용자 정보를 Request에 주입하고 true를 반환한다', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers.authorization = 'Bearer valid-token-123';

      const mockSyncResult = {
        user: {
          id: 'employee-uuid-1',
          externalId: 'user-1',
          email: 'test@example.com',
          name: '홍길동',
          employeeNumber: 'E2023001',
          roles: ['admin', 'user'],
          status: '재직중',
        },
        isSynced: true,
      };

      authService.토큰검증및사용자동기화.mockResolvedValue(mockSyncResult);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(authService.토큰검증및사용자동기화).toHaveBeenCalledWith(
        'valid-token-123',
      );
      expect(mockRequest.user).toEqual({
        id: 'employee-uuid-1',
        email: 'test@example.com',
        name: '홍길동',
        employeeNumber: 'E2023001',
        roles: ['admin', 'user'],
      });
    });

    it('토큰이 유효하지 않으면 UnauthorizedException을 던진다', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers.authorization = 'Bearer invalid-token';

      // AuthService에서 토큰이 유효하지 않으면 예외를 던짐
      authService.토큰검증및사용자동기화.mockRejectedValue(
        new UnauthorizedException('유효하지 않은 토큰입니다.'),
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        '유효하지 않은 토큰입니다.',
      );
    });

    it('Bearer 형식이 아니면 UnauthorizedException을 던진다', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers.authorization = 'Basic some-token';

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('토큰 검증 중 에러가 발생하면 UnauthorizedException을 던진다', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers.authorization = 'Bearer token-123';

      authService.토큰검증및사용자동기화.mockRejectedValue(
        new Error('네트워크 에러'),
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        '토큰 검증에 실패했습니다.',
      );
    });
  });
});
