/**
 * DepartmentTestService 사용 예시
 *
 * 이 파일은 DepartmentTestService의 사용법을 보여주는 예시입니다.
 * 실제 테스트에서 참고하여 사용하세요.
 */

import { DepartmentTestService } from './department-test.service';

/**
 * 테스트 서비스 사용 예시 클래스
 */
export class DepartmentTestUsageExample {
  constructor(private readonly departmentTestService: DepartmentTestService) {}

  /**
   * 기본 테스트 데이터 생성 예시
   */
  async 기본_테스트데이터_생성_예시() {
    // 1. 기본 목데이터 생성 (계층구조 포함)
    const departments =
      await this.departmentTestService.테스트용_목데이터를_생성한다();
    console.log('생성된 부서 수:', departments.length);
    console.log(
      '최상위 부서들:',
      departments.filter((d) => d.isRootDepartment),
    );

    // 2. 특정 부서 생성
    const customDepartment =
      await this.departmentTestService.특정_부서_테스트데이터를_생성한다({
        name: '커스텀부서',
        code: 'CUSTOM',
        externalId: 'custom-001',
        order: 100,
        managerId: 'custom-manager',
      });
    console.log('커스텀 부서 생성:', customDepartment);

    // 3. 랜덤 테스트 데이터 생성
    const randomDepartments =
      await this.departmentTestService.랜덤_테스트데이터를_생성한다(5);
    console.log('랜덤 부서 생성:', randomDepartments.length);

    // 4. 계층구조 테스트 데이터 생성
    const hierarchicalDepartments =
      await this.departmentTestService.계층구조_테스트데이터를_생성한다(3, 2);
    console.log('계층구조 부서 생성:', hierarchicalDepartments.length);

    return {
      basic: departments,
      custom: customDepartment,
      random: randomDepartments,
      hierarchical: hierarchicalDepartments,
    };
  }

  /**
   * 테스트 데이터 정리 예시
   */
  async 테스트데이터_정리_예시() {
    // 1. 테스트 데이터만 정리
    const deletedCount =
      await this.departmentTestService.테스트_데이터를_정리한다();
    console.log('삭제된 테스트 데이터 수:', deletedCount);

    // 2. 모든 데이터 삭제 (주의: 운영 환경에서 사용 금지)
    // const allDeletedCount = await this.departmentTestService.모든_테스트데이터를_삭제한다();
    // console.log('삭제된 모든 데이터 수:', allDeletedCount);
  }

  /**
   * 전체 테스트 시나리오 예시
   */
  async 전체_테스트_시나리오() {
    try {
      console.log('=== 테스트 데이터 생성 시작 ===');

      // 1. 기본 테스트 데이터 생성
      const testData = await this.기본_테스트데이터_생성_예시();

      console.log('=== 테스트 완료 ===');
      console.log('생성된 부서 수:', testData.basic.length);

      return {
        testData,
      };
    } catch (error) {
      console.error('테스트 실행 중 오류:', error);
      throw error;
    } finally {
      // 2. 테스트 데이터 정리
      console.log('=== 테스트 데이터 정리 ===');
      await this.테스트데이터_정리_예시();
    }
  }
}

/**
 * E2E 테스트에서 사용할 수 있는 헬퍼 함수들
 */
export class DepartmentTestHelpers {
  constructor(private readonly departmentTestService: DepartmentTestService) {}

  /**
   * E2E 테스트용 기본 데이터 설정
   */
  async E2E_테스트용_데이터_설정() {
    return await this.departmentTestService.테스트용_목데이터를_생성한다();
  }

  /**
   * E2E 테스트용 데이터 정리
   */
  async E2E_테스트용_데이터_정리() {
    return await this.departmentTestService.테스트_데이터를_정리한다();
  }

  /**
   * 특정 테스트 케이스용 데이터 생성
   */
  async 특정_테스트케이스용_데이터_생성(testCase: string) {
    switch (testCase) {
      case 'hierarchy':
        return await this.departmentTestService.계층구조_테스트데이터를_생성한다(
          4,
          3,
        );
      case 'random':
        return await this.departmentTestService.랜덤_테스트데이터를_생성한다(
          20,
        );
      case 'basic':
      default:
        return await this.departmentTestService.테스트용_목데이터를_생성한다();
    }
  }
}
