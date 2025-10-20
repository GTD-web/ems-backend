import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
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
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: '홍길동',
          employeeNumber: 'E2023001',
          roles: ['admin', 'user'],
        },
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
    });

    it('@Roles() 데코레이터가 없으면 통과한다', () => {
      reflector.getAllAndOverride.mockReturnValue(null);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('필요한 역할이 빈 배열이면 통과한다', () => {
      reflector.getAllAndOverride.mockReturnValue([]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('사용자가 필요한 역할을 가지고 있으면 통과한다', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('사용자가 여러 역할 중 하나라도 가지고 있으면 통과한다', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin', 'manager']);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('사용자가 필요한 역할을 가지고 있지 않으면 ForbiddenException을 던진다', () => {
      reflector.getAllAndOverride.mockReturnValue(['super-admin']);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        '이 작업을 수행할 권한이 없습니다. 필요한 역할: super-admin',
      );
    });

    it('사용자 역할이 빈 배열이면 ForbiddenException을 던진다', () => {
      mockRequest.user.roles = [];
      reflector.getAllAndOverride.mockReturnValue(['admin']);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('사용자 정보가 없으면 ForbiddenException을 던진다', () => {
      mockRequest.user = undefined;
      reflector.getAllAndOverride.mockReturnValue(['admin']);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        '인증 정보가 없습니다.',
      );
    });
  });
});
