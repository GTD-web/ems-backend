import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SSOService } from './sso.service';

describe('SSOService', () => {
  let service: SSOService;
  let mockAuthService: any;
  let mockOrganizationService: any;
  let mockFcmService: any;
  let mockSSOClient: any;

  beforeEach(async () => {
    // Mock 서비스 생성
    mockAuthService = {
      로그인한다: jest.fn(),
      토큰을검증한다: jest.fn(),
      토큰을갱신한다: jest.fn(),
      비밀번호를확인한다: jest.fn(),
      비밀번호를변경한다: jest.fn(),
    };

    mockOrganizationService = {
      직원정보를조회한다: jest.fn(),
      여러직원정보를조회한다: jest.fn(),
      부서계층구조를조회한다: jest.fn(),
    };

    mockFcmService = {
      FCM토큰을구독한다: jest.fn(),
      FCM토큰을구독해지한다: jest.fn(),
      FCM토큰을조회한다: jest.fn(),
      여러직원의FCM토큰을조회한다: jest.fn(),
    };

    // Mock SSO Client 생성
    mockSSOClient = {
      초기화한다: jest.fn(),
      auth: mockAuthService,
      organization: mockOrganizationService,
      fcm: mockFcmService,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SSOService,
        {
          provide: 'SSO_CLIENT',
          useValue: mockSSOClient,
        },
        {
          provide: 'SSO_SYSTEM_NAME',
          useValue: 'EMS-PROD',
        },
      ],
    }).compile();

    service = module.get<SSOService>(SSOService);
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('로그인한다', () => {
    it('EMS-PROD 시스템 역할이 있으면 로그인에 성공해야 한다', async () => {
      const mockResult = {
        id: 'user-1',
        email: 'test@example.com',
        name: '홍길동',
        employeeNumber: 'E2023001',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        systemRoles: {
          'EMS-PROD': ['admin', 'user'],
        },
      };

      mockAuthService.로그인한다.mockResolvedValue(mockResult);

      const result = await service.로그인한다('test@example.com', 'password');

      expect(mockAuthService.로그인한다).toHaveBeenCalledWith(
        'test@example.com',
        'password',
      );
      expect(result).toEqual(mockResult);
    });

    it('systemRoles가 없으면 ForbiddenException을 던져야 한다', async () => {
      const mockResult = {
        id: 'user-1',
        email: 'test@example.com',
        name: '홍길동',
        employeeNumber: 'E2023001',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        // systemRoles 없음
      };

      mockAuthService.로그인한다.mockResolvedValue(mockResult);

      await expect(
        service.로그인한다('test@example.com', 'password'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('EMS-PROD 시스템 역할이 없으면 ForbiddenException을 던져야 한다', async () => {
      const mockResult = {
        id: 'user-1',
        email: 'test@example.com',
        name: '홍길동',
        employeeNumber: 'E2023001',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        systemRoles: {
          'RMS-PROD': ['resourceManager'], // EMS-PROD가 아닌 다른 시스템
        },
      };

      mockAuthService.로그인한다.mockResolvedValue(mockResult);

      await expect(
        service.로그인한다('test@example.com', 'password'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('EMS-PROD 시스템 역할 배열이 비어있으면 ForbiddenException을 던져야 한다', async () => {
      const mockResult = {
        id: 'user-1',
        email: 'test@example.com',
        name: '홍길동',
        employeeNumber: 'E2023001',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        systemRoles: {
          'EMS-PROD': [], // 빈 배열
        },
      };

      mockAuthService.로그인한다.mockResolvedValue(mockResult);

      await expect(
        service.로그인한다('test@example.com', 'password'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('토큰을검증한다', () => {
    it('valid가 true이면 토큰 검증에 성공해야 한다', async () => {
      const mockResult = {
        valid: true,
        id: 'user-1',
        email: 'test@example.com',
        name: '홍길동',
        employeeNumber: 'E2023001',
      };

      mockAuthService.토큰을검증한다.mockResolvedValue(mockResult);

      const result = await service.토큰을검증한다('access-token');

      expect(mockAuthService.토큰을검증한다).toHaveBeenCalledWith(
        'access-token',
      );
      expect(result).toEqual(mockResult);
    });

    it('valid가 false이면 UnauthorizedException을 던져야 한다', async () => {
      const mockResult = {
        valid: false,
      };

      mockAuthService.토큰을검증한다.mockResolvedValue(mockResult);

      await expect(service.토큰을검증한다('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.토큰을검증한다('invalid-token')).rejects.toThrow(
        '유효하지 않은 토큰입니다.',
      );
    });
  });

  describe('직원정보를조회한다', () => {
    it('SSO 클라이언트의 직원 정보 조회 메서드를 호출해야 한다', async () => {
      const mockResult = {
        id: 'emp-1',
        employeeNumber: 'E2023001',
        name: '홍길동',
        email: 'test@example.com',
        isTerminated: false,
      };

      mockOrganizationService.직원정보를조회한다.mockResolvedValue(mockResult);

      const result = await service.직원정보를조회한다({
        employeeNumber: 'E2023001',
        withDetail: true,
      });

      expect(mockOrganizationService.직원정보를조회한다).toHaveBeenCalledWith({
        employeeNumber: 'E2023001',
        withDetail: true,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('사번으로직원을조회한다 (편의 메서드)', () => {
    it('상세 정보 포함하여 직원을 조회해야 한다', async () => {
      const mockResult = {
        id: 'emp-1',
        employeeNumber: 'E2023001',
        name: '홍길동',
        email: 'test@example.com',
        isTerminated: false,
      };

      mockOrganizationService.직원정보를조회한다.mockResolvedValue(mockResult);

      const result = await service.사번으로직원을조회한다('E2023001');

      expect(mockOrganizationService.직원정보를조회한다).toHaveBeenCalledWith({
        employeeNumber: 'E2023001',
        withDetail: true,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('FCM토큰을구독한다', () => {
    it('SSO 클라이언트의 FCM 토큰 구독 메서드를 호출해야 한다', async () => {
      const mockResult = {
        success: true,
        fcmToken: 'fcm-token-123',
        employeeNumber: 'E2023001',
        deviceType: 'android' as const,
      };

      mockFcmService.FCM토큰을구독한다.mockResolvedValue(mockResult);

      const result = await service.FCM토큰을구독한다({
        employeeNumber: 'E2023001',
        fcmToken: 'fcm-token-123',
        deviceType: 'android',
      });

      expect(mockFcmService.FCM토큰을구독한다).toHaveBeenCalledWith({
        employeeNumber: 'E2023001',
        fcmToken: 'fcm-token-123',
        deviceType: 'android',
      });
      expect(result).toEqual(mockResult);
    });
  });
});
