/**
 * WbsItemTestService 사용 예시
 *
 * 이 파일은 WbsItemTestService의 사용법을 보여주는 예시입니다.
 * 실제 테스트에서 참고하여 사용하세요.
 */

import { WbsItemTestService } from './wbs-item-test.service';
import { WbsItemStatus } from './wbs-item.types';

/**
 * 테스트 서비스 사용 예시 클래스
 */
export class WbsItemTestUsageExample {
  constructor(private readonly wbsItemTestService: WbsItemTestService) {}

  /**
   * 기본 테스트 데이터 생성 예시
   */
  async 기본_테스트데이터_생성_예시(projectId: string) {
    // 1. 기본 목데이터 생성 (계층구조 포함)
    const wbsItems =
      await this.wbsItemTestService.테스트용_목데이터를_생성한다(projectId);
    console.log('생성된 WBS 항목 수:', wbsItems.length);
    console.log(
      '진행중인 WBS 항목들:',
      wbsItems.filter((w) => w.isInProgress),
    );

    // 2. 특정 WBS 항목 생성
    const customWbsItem =
      await this.wbsItemTestService.특정_WBS_테스트데이터를_생성한다({
        wbsCode: 'CUSTOM-001',
        title: '커스텀 WBS 작업',
        status: WbsItemStatus.IN_PROGRESS,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        progressPercentage: 50,
        assignedToId: 'custom-assignee',
        projectId,
        level: 1,
      });
    console.log('커스텀 WBS 항목 생성:', customWbsItem);

    // 3. 랜덤 테스트 데이터 생성
    const randomWbsItems =
      await this.wbsItemTestService.랜덤_테스트데이터를_생성한다(projectId, 5);
    console.log('랜덤 WBS 항목 생성:', randomWbsItems.length);

    // 4. 상태별 WBS 항목 데이터 생성
    const completedWbsItems =
      await this.wbsItemTestService.상태별_WBS_테스트데이터를_생성한다(
        projectId,
        WbsItemStatus.COMPLETED,
        3,
      );
    console.log('완료된 WBS 항목 생성:', completedWbsItems.length);

    // 5. 담당자별 WBS 항목 데이터 생성
    const assigneeWbsItems =
      await this.wbsItemTestService.담당자별_WBS_테스트데이터를_생성한다(
        projectId,
        'test-assignee-001',
        2,
      );
    console.log('담당자별 WBS 항목 생성:', assigneeWbsItems.length);

    // 6. 계층구조 WBS 항목 데이터 생성
    const hierarchicalWbsItems =
      await this.wbsItemTestService.계층구조_WBS_테스트데이터를_생성한다(
        projectId,
        3,
        2,
      );
    console.log('계층구조 WBS 항목 생성:', hierarchicalWbsItems.length);

    return {
      basic: wbsItems,
      custom: customWbsItem,
      random: randomWbsItems,
      completed: completedWbsItems,
      assignee: assigneeWbsItems,
      hierarchical: hierarchicalWbsItems,
    };
  }

  /**
   * 테스트 데이터 정리 예시
   */
  async 테스트데이터_정리_예시() {
    // 1. 테스트 데이터만 정리
    const deletedCount =
      await this.wbsItemTestService.테스트_데이터를_정리한다();
    console.log('삭제된 테스트 데이터 수:', deletedCount);

    // 2. 모든 데이터 삭제 (주의: 운영 환경에서 사용 금지)
    // const allDeletedCount = await this.wbsItemTestService.모든_테스트데이터를_삭제한다();
    // console.log('삭제된 모든 데이터 수:', allDeletedCount);
  }

  /**
   * 전체 테스트 시나리오 예시
   */
  async 전체_테스트_시나리오(projectId: string) {
    try {
      console.log('=== 테스트 데이터 생성 시작 ===');

      // 1. 기본 테스트 데이터 생성
      const testData = await this.기본_테스트데이터_생성_예시(projectId);

      console.log('=== 테스트 완료 ===');
      console.log('생성된 WBS 항목 수:', testData.basic.length);
      console.log(
        '진행중인 WBS 항목 수:',
        testData.basic.filter((w) => w.isInProgress).length,
      );
      console.log(
        '완료된 WBS 항목 수:',
        testData.basic.filter((w) => w.isCompleted).length,
      );
      console.log(
        '대기중인 WBS 항목 수:',
        testData.basic.filter((w) => w.isPending).length,
      );

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
export class WbsItemTestHelpers {
  constructor(private readonly wbsItemTestService: WbsItemTestService) {}

  /**
   * E2E 테스트용 기본 데이터 설정
   */
  async E2E_테스트용_데이터_설정(projectId: string) {
    return await this.wbsItemTestService.테스트용_목데이터를_생성한다(projectId);
  }

  /**
   * E2E 테스트용 데이터 정리
   */
  async E2E_테스트용_데이터_정리() {
    return await this.wbsItemTestService.테스트_데이터를_정리한다();
  }

  /**
   * 특정 테스트 케이스용 데이터 생성
   */
  async 특정_테스트케이스용_데이터_생성(testCase: string, projectId: string) {
    switch (testCase) {
      case 'completed':
        return await this.wbsItemTestService.상태별_WBS_테스트데이터를_생성한다(
          projectId,
          WbsItemStatus.COMPLETED,
          5,
        );
      case 'in_progress':
        return await this.wbsItemTestService.상태별_WBS_테스트데이터를_생성한다(
          projectId,
          WbsItemStatus.IN_PROGRESS,
          8,
        );
      case 'pending':
        return await this.wbsItemTestService.상태별_WBS_테스트데이터를_생성한다(
          projectId,
          WbsItemStatus.PENDING,
          3,
        );
      case 'assignee':
        return await this.wbsItemTestService.담당자별_WBS_테스트데이터를_생성한다(
          projectId,
          'test-assignee',
          5,
        );
      case 'hierarchical':
        return await this.wbsItemTestService.계층구조_WBS_테스트데이터를_생성한다(
          projectId,
          4,
          3,
        );
      case 'random':
        return await this.wbsItemTestService.랜덤_테스트데이터를_생성한다(projectId, 15);
      case 'basic':
      default:
        return await this.wbsItemTestService.테스트용_목데이터를_생성한다(projectId);
    }
  }
}
