import { OrganizationManagementService } from '@context/organization-management-context';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import {
  ROLES_GUARD_OPTIONS,
  RolesGuard,
  RolesGuardOptions,
} from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let organizationManagementService: jest.Mocked<OrganizationManagementService>;

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const mockOrganizationManagementService = {
      사번으로_접근가능한가: jest.fn(),
    };

    // admin 접근 가능 여부 확인 활성화 옵션
    const guardOptions: RolesGuardOptions = {
      rolesRequiringAccessibilityCheck: ['admin'],
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: OrganizationManagementService,
          useValue: mockOrganizationManagementService,
        },
        {
          provide: ROLES_GUARD_OPTIONS,
          useValue: guardOptions,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
    organizationManagementService = module.get(OrganizationManagementService);
  });

  it('가드가 정의되어야 한다', () => {
    expect(guard).toBeDefined();

    testResults.push({
      testName: '가드가 정의되어야 한다',
      result: {
        success: true,
        message: 'RolesGuard가 정상적으로 생성되었습니다.',
      },
    });
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

    it('@Roles() 데코레이터가 없으면 통과한다', async () => {
      reflector.getAllAndOverride.mockReturnValue(null);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);

      testResults.push({
        testName: '@Roles() 데코레이터가 없으면 통과한다',
        result: {
          success: true,
          requiredRoles: null,
          canActivate: result,
        },
      });
    });

    it('필요한 역할이 빈 배열이면 통과한다', async () => {
      reflector.getAllAndOverride.mockReturnValue([]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);

      testResults.push({
        testName: '필요한 역할이 빈 배열이면 통과한다',
        result: {
          success: true,
          requiredRoles: [],
          canActivate: result,
        },
      });
    });

    it('사용자가 필요한 역할을 가지고 있으면 통과한다 (admin이 아닌 경우)', async () => {
      reflector.getAllAndOverride.mockReturnValue(['user']);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(
        organizationManagementService.사번으로_접근가능한가,
      ).not.toHaveBeenCalled();

      testResults.push({
        testName:
          '사용자가 필요한 역할을 가지고 있으면 통과한다 (admin이 아닌 경우)',
        result: {
          success: true,
          requiredRoles: ['user'],
          userRoles: mockRequest.user.roles,
          canActivate: result,
          accessibilityCheckCalled: false,
        },
      });
    });

    it('사용자가 여러 역할 중 하나라도 가지고 있으면 통과한다', async () => {
      reflector.getAllAndOverride.mockReturnValue(['admin', 'manager']);
      // admin 역할이 포함되어 있으므로 접근 가능 여부 확인 필요
      organizationManagementService.사번으로_접근가능한가.mockResolvedValue(
        true,
      );

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(
        organizationManagementService.사번으로_접근가능한가,
      ).toHaveBeenCalledWith('E2023001');

      testResults.push({
        testName: '사용자가 여러 역할 중 하나라도 가지고 있으면 통과한다',
        result: {
          success: true,
          requiredRoles: ['admin', 'manager'],
          userRoles: mockRequest.user.roles,
          canActivate: result,
          accessibilityCheckCalled: true,
          isAccessible: true,
        },
      });
    });

    it('사용자가 필요한 역할을 가지고 있지 않으면 ForbiddenException을 던진다', async () => {
      reflector.getAllAndOverride.mockReturnValue(['super-admin']);

      let errorThrown = false;
      let errorMessage = '';
      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }

      expect(errorThrown).toBe(true);
      expect(errorMessage).toContain('이 작업을 수행할 권한이 없습니다');

      testResults.push({
        testName:
          '사용자가 필요한 역할을 가지고 있지 않으면 ForbiddenException을 던진다',
        result: {
          success: true,
          requiredRoles: ['super-admin'],
          userRoles: mockRequest.user.roles,
          errorThrown: errorThrown,
          errorMessage: errorMessage,
        },
      });
    });

    it('사용자 역할이 빈 배열이면 ForbiddenException을 던진다', async () => {
      mockRequest.user.roles = [];
      reflector.getAllAndOverride.mockReturnValue(['admin']);

      let errorThrown = false;
      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error) {
        errorThrown = true;
      }

      expect(errorThrown).toBe(true);

      testResults.push({
        testName: '사용자 역할이 빈 배열이면 ForbiddenException을 던진다',
        result: {
          success: true,
          requiredRoles: ['admin'],
          userRoles: [],
          errorThrown: errorThrown,
        },
      });
    });

    it('사용자 정보가 없으면 ForbiddenException을 던진다', async () => {
      mockRequest.user = undefined;
      reflector.getAllAndOverride.mockReturnValue(['admin']);

      let errorThrown = false;
      let errorMessage = '';
      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }

      expect(errorThrown).toBe(true);
      expect(errorMessage).toBe('인증 정보가 없습니다.');

      testResults.push({
        testName: '사용자 정보가 없으면 ForbiddenException을 던진다',
        result: {
          success: true,
          requiredRoles: ['admin'],
          user: null,
          errorThrown: errorThrown,
          errorMessage: errorMessage,
        },
      });
    });

    describe('admin 역할 검증 시 접근 가능 여부 확인 (2중 보안)', () => {
      beforeEach(() => {
        mockRequest.user.roles = ['admin'];
        reflector.getAllAndOverride.mockReturnValue(['admin']);
        // 각 테스트 전에 모킹 함수 초기화
        organizationManagementService.사번으로_접근가능한가.mockClear();
      });

      it('admin 역할이 필요한 경우, 접근 가능한 사용자는 통과한다', async () => {
        organizationManagementService.사번으로_접근가능한가.mockResolvedValue(
          true,
        );

        const result = await guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
        expect(
          organizationManagementService.사번으로_접근가능한가,
        ).toHaveBeenCalledWith('E2023001');
        expect(
          organizationManagementService.사번으로_접근가능한가,
        ).toHaveBeenCalledTimes(1);

        testResults.push({
          testName: 'admin 역할이 필요한 경우, 접근 가능한 사용자는 통과한다',
          result: {
            success: true,
            requiredRoles: ['admin'],
            userRoles: mockRequest.user.roles,
            employeeNumber: mockRequest.user.employeeNumber,
            isAccessible: true,
            canActivate: result,
            accessibilityCheckCalled: true,
          },
        });
      });

      it('admin 역할이 필요한 경우, 접근 불가능한 사용자는 ForbiddenException을 던진다', async () => {
        organizationManagementService.사번으로_접근가능한가.mockResolvedValue(
          false,
        );

        let errorThrown = false;
        let errorMessage = '';
        try {
          await guard.canActivate(mockExecutionContext);
        } catch (error) {
          errorThrown = true;
          errorMessage = error.message;
        }

        expect(errorThrown).toBe(true);
        expect(errorMessage).toBe(
          '시스템 접근 권한이 없습니다. 관리자에게 문의하세요.',
        );

        // 두 번 호출되었지만 (await expect를 두 번 호출했으므로), 각 호출마다 한 번씩 호출됨
        expect(
          organizationManagementService.사번으로_접근가능한가,
        ).toHaveBeenCalledWith('E2023001');
        expect(
          organizationManagementService.사번으로_접근가능한가,
        ).toHaveBeenCalledTimes(1);

        testResults.push({
          testName:
            'admin 역할이 필요한 경우, 접근 불가능한 사용자는 ForbiddenException을 던진다',
          result: {
            success: true,
            requiredRoles: ['admin'],
            userRoles: mockRequest.user.roles,
            employeeNumber: mockRequest.user.employeeNumber,
            isAccessible: false,
            errorThrown: errorThrown,
            errorMessage: errorMessage,
            accessibilityCheckCalled: true,
          },
        });
      });

      it('admin 역할이 필요하지만 사용자가 admin 역할을 가지고 있지 않으면 접근 가능 여부 확인을 하지 않는다', async () => {
        mockRequest.user.roles = ['user'];
        organizationManagementService.사번으로_접근가능한가.mockResolvedValue(
          false,
        );

        let errorThrown = false;
        try {
          await guard.canActivate(mockExecutionContext);
        } catch (error) {
          errorThrown = true;
        }

        expect(errorThrown).toBe(true);
        expect(
          organizationManagementService.사번으로_접근가능한가,
        ).not.toHaveBeenCalled();

        testResults.push({
          testName:
            'admin 역할이 필요하지만 사용자가 admin 역할을 가지고 있지 않으면 접근 가능 여부 확인을 하지 않는다',
          result: {
            success: true,
            requiredRoles: ['admin'],
            userRoles: ['user'],
            errorThrown: errorThrown,
            accessibilityCheckCalled: false,
          },
        });
      });

      it('admin 역할이 필요하지 않은 경우, 접근 가능 여부 확인을 하지 않는다', async () => {
        mockRequest.user.roles = ['user'];
        reflector.getAllAndOverride.mockReturnValue(['user']);
        organizationManagementService.사번으로_접근가능한가.mockResolvedValue(
          false,
        );

        const result = await guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
        expect(
          organizationManagementService.사번으로_접근가능한가,
        ).not.toHaveBeenCalled();

        testResults.push({
          testName:
            'admin 역할이 필요하지 않은 경우, 접근 가능 여부 확인을 하지 않는다',
          result: {
            success: true,
            requiredRoles: ['user'],
            userRoles: ['user'],
            canActivate: result,
            accessibilityCheckCalled: false,
          },
        });
      });

      it('admin 역할이 필요한 경우, 여러 역할 중 admin이 포함되어 있으면 접근 가능 여부를 확인한다', async () => {
        mockRequest.user.roles = ['admin', 'manager', 'user'];
        reflector.getAllAndOverride.mockReturnValue(['admin', 'manager']);
        organizationManagementService.사번으로_접근가능한가.mockResolvedValue(
          true,
        );

        const result = await guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
        expect(
          organizationManagementService.사번으로_접근가능한가,
        ).toHaveBeenCalledWith('E2023001');

        testResults.push({
          testName:
            'admin 역할이 필요한 경우, 여러 역할 중 admin이 포함되어 있으면 접근 가능 여부를 확인한다',
          result: {
            success: true,
            requiredRoles: ['admin', 'manager'],
            userRoles: ['admin', 'manager', 'user'],
            employeeNumber: mockRequest.user.employeeNumber,
            isAccessible: true,
            canActivate: result,
            accessibilityCheckCalled: true,
          },
        });
      });
    });
  });

  afterAll(() => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(__dirname, 'roles-guard-test-result.json');
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);
  });
});
