import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import { AuditLogService } from '@domain/common/audit-log/audit-log.service';
import {
  CreateAuditLogHandler,
  CreateAuditLogCommand,
} from '@context/audit-log-context/handlers/commands/create-audit-log.handler';
import {
  GetAuditLogListHandler,
  GetAuditLogListQuery,
} from '@context/audit-log-context/handlers/queries/get-audit-log-list.handler';
import {
  GetAuditLogDetailHandler,
  GetAuditLogDetailQuery,
} from '@context/audit-log-context/handlers/queries/get-audit-log-detail.handler';

/**
 * AuditLogContext CRUD 테스트
 *
 * 이 테스트는 DataSource를 통해 엔티티에 직접 데이터를 생성하고 조회하는 방식으로 작성되었습니다.
 * 실제 데이터베이스를 사용하여 핸들러의 동작을 검증합니다.
 */
describe('AuditLogContext', () => {
  let createHandler: CreateAuditLogHandler;
  let listHandler: GetAuditLogListHandler;
  let detailHandler: GetAuditLogDetailHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let auditLogRepository: Repository<AuditLog>;

  // 테스트 데이터 ID
  let auditLogId: string;
  let userId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([AuditLog]),
      ],
      providers: [
        AuditLogService,
        CreateAuditLogHandler,
        GetAuditLogListHandler,
        GetAuditLogDetailHandler,
      ],
    }).compile();

    createHandler = module.get<CreateAuditLogHandler>(CreateAuditLogHandler);
    listHandler = module.get<GetAuditLogListHandler>(GetAuditLogListHandler);
    detailHandler = module.get<GetAuditLogDetailHandler>(
      GetAuditLogDetailHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    auditLogRepository = dataSource.getRepository(AuditLog);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);

    userId = systemAdminId;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    await auditLogRepository.clear();
  });

  describe('CreateAuditLogHandler', () => {
    it('Audit 로그를 생성한다', async () => {
      // Given
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 150);
      const createData = {
        requestMethod: 'POST',
        requestUrl: '/admin/test',
        requestPath: '/admin/test',
        requestHeaders: {
          'content-type': 'application/json',
        },
        requestBody: {
          test: 'data',
        },
        requestQuery: {},
        requestIp: '192.168.1.100',
        responseStatusCode: 200,
        responseBody: {
          id: 'test-id',
        },
        userId: userId,
        userEmail: 'test@example.com',
        userName: '테스트 사용자',
        employeeNumber: 'EMP001',
        requestStartTime: startTime,
        requestEndTime: endTime,
        duration: 150,
        requestId: 'req-test-001',
      };
      const command = new CreateAuditLogCommand(createData);

      // When
      const result = await createHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();

      // 데이터베이스에서 확인
      const saved = await auditLogRepository.findOne({
        where: { id: result.id },
      });
      expect(saved).toBeDefined();
      expect(saved?.requestMethod).toBe('POST');
      expect(saved?.requestUrl).toBe('/admin/test');
      expect(saved?.userId).toBe(userId);
      expect(saved?.responseStatusCode).toBe(200);
      expect(saved?.duration).toBe(150);

      auditLogId = result.id;
    });

    it('Query 파라미터가 포함된 Audit 로그를 생성한다', async () => {
      // Given
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 100);
      const createData = {
        requestMethod: 'GET',
        requestUrl: '/admin/test?page=1&limit=10&status=active',
        requestPath: '/admin/test',
        requestHeaders: {},
        requestBody: null,
        requestQuery: {
          page: '1',
          limit: '10',
          status: 'active',
        },
        requestIp: '192.168.1.100',
        responseStatusCode: 200,
        responseBody: {
          items: [],
          total: 0,
        },
        userId: userId,
        userEmail: 'test@example.com',
        userName: '테스트 사용자',
        employeeNumber: 'EMP001',
        requestStartTime: startTime,
        requestEndTime: endTime,
        duration: 100,
        requestId: 'req-test-002',
      };
      const command = new CreateAuditLogCommand(createData);

      // When
      const result = await createHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      const saved = await auditLogRepository.findOne({
        where: { id: result.id },
      });
      expect(saved?.requestQuery).toEqual({
        page: '1',
        limit: '10',
        status: 'active',
      });
    });

    it('에러 응답이 포함된 Audit 로그를 생성한다', async () => {
      // Given
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 50);
      const createData = {
        requestMethod: 'POST',
        requestUrl: '/admin/test',
        requestPath: '/admin/test',
        requestHeaders: {},
        requestBody: {
          test: 'data',
        },
        requestQuery: {},
        requestIp: '192.168.1.100',
        responseStatusCode: 400,
        responseBody: {
          message: 'Bad Request',
          statusCode: 400,
        },
        userId: userId,
        userEmail: 'test@example.com',
        userName: '테스트 사용자',
        employeeNumber: 'EMP001',
        requestStartTime: startTime,
        requestEndTime: endTime,
        duration: 50,
        requestId: 'req-test-003',
      };
      const command = new CreateAuditLogCommand(createData);

      // When
      const result = await createHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      const saved = await auditLogRepository.findOne({
        where: { id: result.id },
      });
      expect(saved?.responseStatusCode).toBe(400);
      expect(saved?.responseBody).toEqual({
        message: 'Bad Request',
        statusCode: 400,
      });
    });
  });

  describe('GetAuditLogListHandler', () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      const now = new Date();
      const auditLogs = [
        {
          requestMethod: 'GET',
          requestUrl: '/admin/test1',
          requestPath: '/admin/test1',
          requestHeaders: {},
          requestBody: null,
          requestQuery: {},
          requestIp: '192.168.1.100',
          responseStatusCode: 200,
          responseBody: {},
          userId: userId,
          userEmail: 'test1@example.com',
          userName: '테스트 사용자1',
          employeeNumber: 'EMP001',
          requestStartTime: new Date(now.getTime() - 1000),
          requestEndTime: new Date(now.getTime() - 900),
          duration: 100,
          requestId: 'req-001',
        },
        {
          requestMethod: 'POST',
          requestUrl: '/admin/test2',
          requestPath: '/admin/test2',
          requestHeaders: {},
          requestBody: { test: 'data' },
          requestQuery: {},
          requestIp: '192.168.1.100',
          responseStatusCode: 201,
          responseBody: { id: 'test-id' },
          userId: userId,
          userEmail: 'test2@example.com',
          userName: '테스트 사용자2',
          employeeNumber: 'EMP002',
          requestStartTime: new Date(now.getTime() - 500),
          requestEndTime: new Date(now.getTime() - 400),
          duration: 100,
          requestId: 'req-002',
        },
        {
          requestMethod: 'GET',
          requestUrl: '/admin/test3',
          requestPath: '/admin/test3',
          requestHeaders: {},
          requestBody: null,
          requestQuery: { page: '1' },
          requestIp: '192.168.1.101',
          responseStatusCode: 200,
          responseBody: {},
          userId: '00000000-0000-0000-0000-000000000002',
          userEmail: 'test3@example.com',
          userName: '테스트 사용자3',
          employeeNumber: 'EMP003',
          requestStartTime: new Date(now.getTime() - 200),
          requestEndTime: new Date(now.getTime() - 100),
          duration: 100,
          requestId: 'req-003',
        },
      ];

      for (const data of auditLogs) {
        const command = new CreateAuditLogCommand(data);
        await createHandler.execute(command);
      }
    });

    it('전체 Audit 로그 목록을 조회한다 (페이징)', async () => {
      // Given
      const query = new GetAuditLogListQuery({}, 1, 10);

      // When
      const result = await listHandler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.items[0].requestMethod).toBeDefined();
      expect(result.items[0].requestUrl).toBeDefined();
    });

    it('사용자 ID로 필터링하여 Audit 로그 목록을 조회한다', async () => {
      // Given
      const query = new GetAuditLogListQuery({ userId: userId }, 1, 10);

      // When
      const result = await listHandler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.items.length).toBe(2); // userId로 생성한 로그는 2개
      expect(result.items.every((log) => log.userId === userId)).toBe(true);
    });

    it('직원 번호로 필터링하여 Audit 로그 목록을 조회한다', async () => {
      // Given
      const query = new GetAuditLogListQuery(
        { employeeNumber: 'EMP001' },
        1,
        10,
      );

      // When
      const result = await listHandler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].employeeNumber).toBe('EMP001');
    });

    it('HTTP 메서드로 필터링하여 Audit 로그 목록을 조회한다', async () => {
      // Given
      const query = new GetAuditLogListQuery({ requestMethod: 'POST' }, 1, 10);

      // When
      const result = await listHandler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].requestMethod).toBe('POST');
    });

    it('요청 URL로 필터링하여 Audit 로그 목록을 조회한다', async () => {
      // Given
      const query = new GetAuditLogListQuery(
        { requestUrl: '/admin/test1' },
        1,
        10,
      );

      // When
      const result = await listHandler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].requestUrl).toContain('/admin/test1');
    });

    it('응답 상태 코드로 필터링하여 Audit 로그 목록을 조회한다', async () => {
      // Given
      const query = new GetAuditLogListQuery(
        { responseStatusCode: 201 },
        1,
        10,
      );

      // When
      const result = await listHandler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].responseStatusCode).toBe(201);
    });

    it('기간으로 필터링하여 Audit 로그 목록을 조회한다', async () => {
      // Given
      const now = new Date();
      const startDate = new Date(now.getTime() - 600);
      const endDate = new Date(now.getTime() - 100);
      const query = new GetAuditLogListQuery({ startDate, endDate }, 1, 10);

      // When
      const result = await listHandler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((log) => {
        expect(log.requestStartTime.getTime()).toBeGreaterThanOrEqual(
          startDate.getTime(),
        );
        expect(log.requestStartTime.getTime()).toBeLessThanOrEqual(
          endDate.getTime(),
        );
      });
    });

    it('페이징으로 Audit 로그 목록을 조회한다', async () => {
      // Given
      const query1 = new GetAuditLogListQuery({}, 1, 2);
      const query2 = new GetAuditLogListQuery({}, 2, 2);

      // When
      const page1 = await listHandler.execute(query1);
      const page2 = await listHandler.execute(query2);

      // Then
      expect(page1.items.length).toBe(2);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);
      expect(page2.items.length).toBe(1);
      expect(page2.page).toBe(2);
      expect(page2.limit).toBe(2);
      expect(page1.items[0].id).not.toBe(page2.items[0].id);
    });

    it('복합 필터로 Audit 로그 목록을 조회한다', async () => {
      // Given
      const query = new GetAuditLogListQuery(
        {
          userId: userId,
          requestMethod: 'GET',
          responseStatusCode: 200,
        },
        1,
        10,
      );

      // When
      const result = await listHandler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].userId).toBe(userId);
      expect(result.items[0].requestMethod).toBe('GET');
      expect(result.items[0].responseStatusCode).toBe(200);
    });
  });

  describe('GetAuditLogDetailHandler', () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 150);
      const command = new CreateAuditLogCommand({
        requestMethod: 'POST',
        requestUrl: '/admin/test-detail',
        requestPath: '/admin/test-detail',
        requestHeaders: {
          'content-type': 'application/json',
        },
        requestBody: {
          test: 'detail data',
        },
        requestQuery: {
          id: '123',
        },
        requestIp: '192.168.1.100',
        responseStatusCode: 200,
        responseBody: {
          id: 'test-detail-id',
          status: 'success',
        },
        userId: userId,
        userEmail: 'test@example.com',
        userName: '테스트 사용자',
        employeeNumber: 'EMP001',
        requestStartTime: startTime,
        requestEndTime: endTime,
        duration: 150,
        requestId: 'req-detail-001',
      });
      const result = await createHandler.execute(command);
      auditLogId = result.id;
    });

    it('Audit 로그 상세 정보를 조회한다', async () => {
      // Given
      const query = new GetAuditLogDetailQuery(auditLogId);

      // When
      const result = await detailHandler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result?.id).toBe(auditLogId);
      expect(result?.requestMethod).toBe('POST');
      expect(result?.requestUrl).toBe('/admin/test-detail');
      expect(result?.requestPath).toBe('/admin/test-detail');
      expect(result?.requestHeaders).toEqual({
        'content-type': 'application/json',
      });
      expect(result?.requestBody).toEqual({
        test: 'detail data',
      });
      expect(result?.requestQuery).toEqual({
        id: '123',
      });
      expect(result?.requestIp).toBe('192.168.1.100');
      expect(result?.responseStatusCode).toBe(200);
      expect(result?.responseBody).toEqual({
        id: 'test-detail-id',
        status: 'success',
      });
      expect(result?.userId).toBe(userId);
      expect(result?.userEmail).toBe('test@example.com');
      expect(result?.userName).toBe('테스트 사용자');
      expect(result?.employeeNumber).toBe('EMP001');
      expect(result?.duration).toBe(150);
      expect(result?.requestId).toBe('req-detail-001');
    });

    it('존재하지 않는 Audit 로그를 조회하면 null을 반환한다', async () => {
      // Given
      const query = new GetAuditLogDetailQuery(
        '00000000-0000-0000-0000-000000000999',
      );

      // When
      const result = await detailHandler.execute(query);

      // Then
      expect(result).toBeNull();
    });
  });
});
