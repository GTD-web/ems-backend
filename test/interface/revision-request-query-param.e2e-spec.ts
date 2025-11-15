import { BaseE2ETest } from '../base-e2e.spec';
import { RevisionRequestApiClient } from '../usecase/scenarios/api-clients/revision-request.api-client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 재작성 요청 API Query 파라미터 변환 E2E 테스트
 *
 * 실제 HTTP 요청을 통해 isCompleted=false가 올바르게 처리되는지 확인합니다.
 */
describe('재작성 요청 API Query 파라미터 변환 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let apiClient: RevisionRequestApiClient;

  // 테스트 결과 저장용
  const testResults: any[] = [];

  // ANSI 이스케이프 코드를 제거하는 헬퍼 함수
  function stripAnsiCodes(str: string): string {
    if (!str) return str;
    return str
      .replace(/\u001b\[[0-9;]*m/g, '')
      .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\u001b\[?[0-9;]*[a-zA-Z]/g, '');
  }

  // 에러 객체에서 읽기 가능한 메시지를 추출하는 함수
  function extractErrorMessage(error: any): string {
    if (!error) return '';

    let message = '';
    if (error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = String(error);
    }

    message = stripAnsiCodes(message);

    if (error.stack) {
      const stack = stripAnsiCodes(error.stack);
      if (stack && !stack.includes(message)) {
        message = `${message}\n\nStack:\n${stack}`;
      }
    }

    return message;
  }

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    apiClient = new RevisionRequestApiClient(testSuite);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'revision-request-query-param-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);

    await testSuite.closeApp();
  });

  describe('GET /admin/revision-requests/me - isCompleted 파라미터 변환', () => {
    it('isCompleted=false로 요청했을 때 false로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        'isCompleted=false로 요청했을 때 false로 필터링되어야 한다';

      try {
        // Given - isCompleted=false로 요청
        result = await apiClient.getMyRevisionRequests({
          isCompleted: false,
        });

        // Then - 모든 결과가 isCompleted=false여야 함
        result.forEach((item: any) => {
          expect(item.isCompleted).toBe(false);
          expect(item.isCompleted).not.toBe(true); // ❌ true가 되어서는 안 됨
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: false },
            resultCount: result.length,
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isCompleted=true로 요청했을 때 true로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        'isCompleted=true로 요청했을 때 true로 필터링되어야 한다';

      try {
        // Given - isCompleted=true로 요청
        result = await apiClient.getMyRevisionRequests({
          isCompleted: true,
        });

        // Then - 모든 결과가 isCompleted=true여야 함
        result.forEach((item: any) => {
          expect(item.isCompleted).toBe(true);
          expect(item.isCompleted).not.toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: true },
            resultCount: result.length,
            allItemsHaveIsCompletedTrue: result.every(
              (item: any) => item.isCompleted === true,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isCompleted 파라미터 없이 요청했을 때 모든 상태의 요청이 반환되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        'isCompleted 파라미터 없이 요청했을 때 모든 상태의 요청이 반환되어야 한다';

      try {
        // Given - isCompleted 파라미터 없이 요청
        result = await apiClient.getMyRevisionRequests({});

        // Then - 결과가 반환되어야 함 (빈 배열일 수도 있음)
        expect(Array.isArray(result)).toBe(true);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: {},
            resultCount: result.length,
            isArray: Array.isArray(result),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: {},
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=false와 isCompleted=false를 함께 사용할 때도 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        'isRead=false와 isCompleted=false를 함께 사용할 때도 올바르게 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getMyRevisionRequests({
          isRead: false,
          isCompleted: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(false);
          expect(item.isCompleted).toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false, isCompleted: false },
            resultCount: result.length,
            allItemsHaveIsReadFalse: result.every(
              (item: any) => item.isRead === false,
            ),
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false, isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  describe('GET /admin/revision-requests - isCompleted 파라미터 변환', () => {
    it('isCompleted=false로 요청했을 때 false로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        'isCompleted=false로 요청했을 때 false로 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getRevisionRequests({
          isCompleted: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isCompleted).toBe(false);
          expect(item.isCompleted).not.toBe(true);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: false },
            resultCount: result.length,
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isCompleted=true로 요청했을 때 true로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        'isCompleted=true로 요청했을 때 true로 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getRevisionRequests({
          isCompleted: true,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isCompleted).toBe(true);
          expect(item.isCompleted).not.toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: true },
            resultCount: result.length,
            allItemsHaveIsCompletedTrue: result.every(
              (item: any) => item.isCompleted === true,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });
});
