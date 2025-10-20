import { SSOClientWrapper } from './sso-client.wrapper';
import { SSOClientConfig } from './interfaces';

describe('SSOClientWrapper', () => {
  let wrapper: SSOClientWrapper;
  const mockConfig: SSOClientConfig = {
    baseUrl: 'https://test.example.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    timeoutMs: 5000,
    retries: 2,
    enableLogging: false,
  };

  beforeEach(() => {
    wrapper = new SSOClientWrapper(mockConfig);
  });

  describe('초기화', () => {
    it('래퍼 인스턴스가 생성되어야 한다', () => {
      expect(wrapper).toBeDefined();
    });

    it('auth 서비스가 정의되어야 한다', () => {
      expect(wrapper.auth).toBeDefined();
      expect(wrapper.auth.로그인한다).toBeDefined();
      expect(wrapper.auth.토큰을검증한다).toBeDefined();
      expect(wrapper.auth.토큰을갱신한다).toBeDefined();
    });

    it('organization 서비스가 정의되어야 한다', () => {
      expect(wrapper.organization).toBeDefined();
      expect(wrapper.organization.직원정보를조회한다).toBeDefined();
      expect(wrapper.organization.여러직원정보를조회한다).toBeDefined();
      expect(wrapper.organization.부서계층구조를조회한다).toBeDefined();
    });

    it('fcm 서비스가 정의되어야 한다', () => {
      expect(wrapper.fcm).toBeDefined();
      expect(wrapper.fcm.FCM토큰을구독한다).toBeDefined();
      expect(wrapper.fcm.FCM토큰을구독해지한다).toBeDefined();
      expect(wrapper.fcm.FCM토큰을조회한다).toBeDefined();
    });
  });

  describe('초기화 전 호출', () => {
    it('초기화하지 않고 메서드를 호출하면 에러를 던져야 한다', async () => {
      await expect(
        wrapper.auth.로그인한다('test@example.com', 'password'),
      ).rejects.toThrow('SSO 클라이언트가 초기화되지 않았습니다');
    });
  });
});
