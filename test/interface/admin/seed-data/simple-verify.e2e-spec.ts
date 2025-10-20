import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('간단 데이터 검증', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  afterEach(async () => {
    await testSuite.cleanupAfterTest();
  });

  it('MINIMAL 시나리오 데이터 생성 확인', async () => {
    // Given
    const config = {
      scenario: 'minimal',
      clearExisting: true,
      dataScale: {
        departmentCount: 5,
        employeeCount: 10,
        projectCount: 3,
        wbsPerProject: 5,
      },
    };

    // When
    const response = await testSuite
      .request()
      .post('/admin/seed/generate')
      .send(config)
      .expect(201);

    // Then: API 응답 확인
    console.log('\n========== API 응답 ==========');
    console.log(JSON.stringify(response.body, null, 2));

    // 데이터베이스 직접 확인
    const deptCount = await dataSource.query(
      'SELECT COUNT(*) as count FROM department WHERE "deletedAt" IS NULL',
    );
    const empCount = await dataSource.query(
      'SELECT COUNT(*) as count FROM employee WHERE "deletedAt" IS NULL',
    );
    const projCount = await dataSource.query(
      'SELECT COUNT(*) as count FROM project WHERE "deletedAt" IS NULL',
    );
    const wbsCount = await dataSource.query(
      'SELECT COUNT(*) as count FROM wbs_item WHERE "deletedAt" IS NULL',
    );

    console.log('\n========== 실제 생성된 데이터 ==========');
    console.log(`Department: ${deptCount[0].count}개`);
    console.log(`Employee: ${empCount[0].count}개`);
    console.log(`Project: ${projCount[0].count}개`);
    console.log(`WbsItem: ${wbsCount[0].count}개`);

    // 샘플 데이터 확인
    const sampleEmps = await dataSource.query(`
      SELECT "employeeNumber", name, status
      FROM employee 
      WHERE "deletedAt" IS NULL
      LIMIT 5
    `);

    console.log('\n========== Employee 샘플 ==========');
    sampleEmps.forEach((emp: any, idx: number) => {
      console.log(
        `${idx + 1}. ${emp.employeeNumber} - ${emp.name} (${emp.status})`,
      );
    });

    const sampleProjs = await dataSource.query(`
      SELECT "projectCode", name, status
      FROM project 
      WHERE "deletedAt" IS NULL
    `);

    console.log('\n========== Project 샘플 ==========');
    sampleProjs.forEach((proj: any, idx: number) => {
      console.log(
        `${idx + 1}. ${proj.projectCode} - ${proj.name} (${proj.status})`,
      );
    });

    // 기본 검증
    expect(parseInt(empCount[0].count)).toBe(10);
    expect(parseInt(projCount[0].count)).toBe(3);
    expect(response.body.success).toBe(true);
  });

  it('WITH_ASSIGNMENTS 시나리오 데이터 생성 확인', async () => {
    // Given
    const config = {
      scenario: 'with_assignments',
      clearExisting: true,
      dataScale: {
        departmentCount: 3,
        employeeCount: 5,
        projectCount: 2,
        wbsPerProject: 3,
      },
      evaluationConfig: {
        periodCount: 1,
      },
    };

    // When
    const response = await testSuite
      .request()
      .post('/admin/seed/generate')
      .send(config)
      .expect(201);

    // Then
    console.log('\n========== WITH_ASSIGNMENTS 응답 ==========');
    console.log(JSON.stringify(response.body, null, 2));

    const periodCount = await dataSource.query(
      'SELECT COUNT(*) as count FROM evaluation_period WHERE "deletedAt" IS NULL',
    );
    const projAssignCount = await dataSource.query(
      'SELECT COUNT(*) as count FROM evaluation_project_assignment WHERE "deletedAt" IS NULL',
    );
    const wbsAssignCount = await dataSource.query(
      'SELECT COUNT(*) as count FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL',
    );

    console.log('\n========== Phase 2-3 데이터 ==========');
    console.log(`EvaluationPeriod: ${periodCount[0].count}개`);
    console.log(`ProjectAssignment: ${projAssignCount[0].count}개`);
    console.log(`WbsAssignment: ${wbsAssignCount[0].count}개`);

    expect(parseInt(periodCount[0].count)).toBe(1);
    expect(parseInt(projAssignCount[0].count)).toBeGreaterThan(0);
    expect(parseInt(wbsAssignCount[0].count)).toBeGreaterThan(0);
  });
});
