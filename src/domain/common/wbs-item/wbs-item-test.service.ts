import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WbsItem } from './wbs-item.entity';
import { WbsItemDto, WbsItemStatus } from './wbs-item.types';

/**
 * WBS 항목 테스트용 서비스
 *
 * 테스트 시 사용할 목데이터를 생성하고 관리하는 서비스입니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 */
@Injectable()
export class WbsItemTestService {
  constructor(
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
  ) {}

  /**
   * 테스트용 WBS 항목 목데이터를 생성한다
   * @param projectId 프로젝트 ID
   * @returns 생성된 WBS 항목 목록
   */
  async 테스트용_목데이터를_생성한다(projectId: string): Promise<WbsItemDto[]> {
    // 기존 테스트 데이터 정리
    await this.테스트_데이터를_정리한다();

    const testWbsItems = [
      // 1단계 (최상위) WBS 항목들
      {
        wbsCode: '1.0',
        title: '프로젝트 기획 및 설계',
        status: WbsItemStatus.COMPLETED,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-28'),
        progressPercentage: 100,
        assignedToId: 'emp-001',
        projectId,
        parentWbsId: undefined,
        level: 1,
      },
      {
        wbsCode: '2.0',
        title: '시스템 개발',
        status: WbsItemStatus.IN_PROGRESS,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-08-31'),
        progressPercentage: 65,
        assignedToId: 'emp-003',
        projectId,
        parentWbsId: undefined,
        level: 1,
      },
      {
        wbsCode: '3.0',
        title: '테스트 및 검증',
        status: WbsItemStatus.PENDING,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-10-31'),
        progressPercentage: 0,
        assignedToId: 'emp-005',
        projectId,
        parentWbsId: undefined,
        level: 1,
      },
      {
        wbsCode: '4.0',
        title: '배포 및 운영',
        status: WbsItemStatus.PENDING,
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-12-31'),
        progressPercentage: 0,
        assignedToId: 'emp-007',
        projectId,
        parentWbsId: undefined,
        level: 1,
      },
    ];

    // WBS 항목 엔티티 생성 및 저장
    const wbsItems = testWbsItems.map((wbs) => {
      const wbsItem = new WbsItem(
        wbs.wbsCode,
        wbs.title,
        wbs.status,
        wbs.startDate,
        wbs.endDate,
        wbs.progressPercentage,
        wbs.assignedToId,
        wbs.projectId,
        wbs.parentWbsId,
        wbs.level,
      );
      return wbsItem;
    });

    const savedWbsItems = await this.wbsItemRepository.save(wbsItems);

    // 2단계 WBS 항목들 생성 (시스템 개발 하위)
    const systemDevWbs = savedWbsItems.find((item) => item.wbsCode === '2.0');
    if (systemDevWbs) {
      const subWbsItems = [
        {
          wbsCode: '2.1',
          title: '백엔드 API 개발',
          status: WbsItemStatus.COMPLETED,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-05-31'),
          progressPercentage: 100,
          assignedToId: 'emp-004',
          projectId,
          parentWbsId: systemDevWbs.id,
          level: 2,
        },
        {
          wbsCode: '2.2',
          title: '프론트엔드 개발',
          status: WbsItemStatus.IN_PROGRESS,
          startDate: new Date('2024-04-01'),
          endDate: new Date('2024-07-31'),
          progressPercentage: 75,
          assignedToId: 'emp-005',
          projectId,
          parentWbsId: systemDevWbs.id,
          level: 2,
        },
        {
          wbsCode: '2.3',
          title: '데이터베이스 설계 및 구축',
          status: WbsItemStatus.COMPLETED,
          startDate: new Date('2024-03-15'),
          endDate: new Date('2024-04-30'),
          progressPercentage: 100,
          assignedToId: 'emp-006',
          projectId,
          parentWbsId: systemDevWbs.id,
          level: 2,
        },
        {
          wbsCode: '2.4',
          title: '시스템 통합',
          status: WbsItemStatus.IN_PROGRESS,
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-08-31'),
          progressPercentage: 30,
          assignedToId: 'emp-003',
          projectId,
          parentWbsId: systemDevWbs.id,
          level: 2,
        },
      ];

      const subWbsEntities = subWbsItems.map((sub) => {
        return new WbsItem(
          sub.wbsCode,
          sub.title,
          sub.status,
          sub.startDate,
          sub.endDate,
          sub.progressPercentage,
          sub.assignedToId,
          sub.projectId,
          sub.parentWbsId,
          sub.level,
        );
      });

      const savedSubWbsItems =
        await this.wbsItemRepository.save(subWbsEntities);
      savedWbsItems.push(...savedSubWbsItems);

      // 3단계 WBS 항목들 생성 (백엔드 API 개발 하위)
      const backendWbs = savedSubWbsItems.find(
        (item) => item.wbsCode === '2.1',
      );
      if (backendWbs) {
        const backendSubItems = [
          {
            wbsCode: '2.1.1',
            title: '사용자 인증 API',
            status: WbsItemStatus.COMPLETED,
            startDate: new Date('2024-03-01'),
            endDate: new Date('2024-03-31'),
            progressPercentage: 100,
            assignedToId: 'emp-004',
            projectId,
            parentWbsId: backendWbs.id,
            level: 3,
          },
          {
            wbsCode: '2.1.2',
            title: '평가 관리 API',
            status: WbsItemStatus.COMPLETED,
            startDate: new Date('2024-04-01'),
            endDate: new Date('2024-04-30'),
            progressPercentage: 100,
            assignedToId: 'emp-004',
            projectId,
            parentWbsId: backendWbs.id,
            level: 3,
          },
          {
            wbsCode: '2.1.3',
            title: '보고서 생성 API',
            status: WbsItemStatus.COMPLETED,
            startDate: new Date('2024-05-01'),
            endDate: new Date('2024-05-31'),
            progressPercentage: 100,
            assignedToId: 'emp-004',
            projectId,
            parentWbsId: backendWbs.id,
            level: 3,
          },
        ];

        const backendSubEntities = backendSubItems.map((sub) => {
          return new WbsItem(
            sub.wbsCode,
            sub.title,
            sub.status,
            sub.startDate,
            sub.endDate,
            sub.progressPercentage,
            sub.assignedToId,
            sub.projectId,
            sub.parentWbsId,
            sub.level,
          );
        });

        const savedBackendSubItems =
          await this.wbsItemRepository.save(backendSubEntities);
        savedWbsItems.push(...savedBackendSubItems);
      }
    }

    return savedWbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
  }

  /**
   * 특정 WBS 항목의 테스트 데이터를 생성한다
   * @param wbsData WBS 항목 데이터
   * @returns 생성된 WBS 항목 정보
   */
  async 특정_WBS_테스트데이터를_생성한다(wbsData: {
    wbsCode: string;
    title: string;
    status?: WbsItemStatus;
    startDate?: Date;
    endDate?: Date;
    progressPercentage?: number;
    assignedToId?: string;
    projectId: string;
    parentWbsId?: string;
    level?: number;
  }): Promise<WbsItemDto> {
    const wbsItem = new WbsItem(
      wbsData.wbsCode,
      wbsData.title,
      wbsData.status || WbsItemStatus.PENDING,
      wbsData.startDate,
      wbsData.endDate,
      wbsData.progressPercentage,
      wbsData.assignedToId,
      wbsData.projectId,
      wbsData.parentWbsId,
      wbsData.level || 1,
    );

    const savedWbsItem = await this.wbsItemRepository.save(wbsItem);
    return savedWbsItem.DTO로_변환한다();
  }

  /**
   * 테스트용 랜덤 WBS 항목 데이터를 생성한다
   * @param projectId 프로젝트 ID
   * @param count 생성할 WBS 항목 수
   * @returns 생성된 WBS 항목 목록
   */
  async 랜덤_테스트데이터를_생성한다(
    projectId: string,
    count: number = 10,
  ): Promise<WbsItemDto[]> {
    const wbsItems: WbsItem[] = [];
    const statuses: WbsItemStatus[] = [
      WbsItemStatus.PENDING,
      WbsItemStatus.IN_PROGRESS,
      WbsItemStatus.COMPLETED,
      WbsItemStatus.CANCELLED,
      WbsItemStatus.ON_HOLD,
    ];
    const wbsTypes = [
      '분석',
      '설계',
      '개발',
      '테스트',
      '검토',
      '배포',
      '문서화',
      '통합',
    ];

    for (let i = 0; i < count; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const wbsType = wbsTypes[Math.floor(Math.random() * wbsTypes.length)];
      const startYear = 2024;
      const startMonth = Math.floor(Math.random() * 12);
      const startDay = Math.floor(Math.random() * 28) + 1;
      const duration = Math.floor(Math.random() * 3) + 1; // 1-3개월

      const startDate = new Date(startYear, startMonth, startDay);
      const endDate = new Date(startYear, startMonth + duration, startDay);

      const wbsItem = new WbsItem(
        `TEST${String(i + 1).padStart(3, '0')}`,
        `테스트${wbsType}작업${i + 1}`,
        status,
        startDate,
        endDate,
        Math.floor(Math.random() * 101), // 0-100%
        `emp-${Math.floor(Math.random() * 10) + 1}`,
        projectId,
        undefined,
        1,
      );
      wbsItems.push(wbsItem);
    }

    const savedWbsItems = await this.wbsItemRepository.save(wbsItems);
    return savedWbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
  }

  /**
   * 테스트 데이터를 정리한다
   * @returns 삭제된 WBS 항목 수
   */
  async 테스트_데이터를_정리한다(): Promise<number> {
    // 테스트용 WBS 항목들을 삭제 (wbsCode가 TEST로 시작하거나 특정 패턴을 가진 것들)
    const result = await this.wbsItemRepository
      .createQueryBuilder()
      .delete()
      .where(
        'wbsCode LIKE :pattern1 OR wbsCode LIKE :pattern2 OR title LIKE :pattern3',
        {
          pattern1: 'TEST%',
          pattern2: '테스트%',
          pattern3: '테스트%',
        },
      )
      .execute();

    return result.affected || 0;
  }

  /**
   * 모든 테스트 데이터를 삭제한다
   * @returns 삭제된 WBS 항목 수
   */
  async 모든_테스트데이터를_삭제한다(): Promise<number> {
    const result = await this.wbsItemRepository
      .createQueryBuilder()
      .delete()
      .execute();

    return result.affected || 0;
  }

  /**
   * 상태별 WBS 항목 테스트 데이터를 생성한다
   * @param projectId 프로젝트 ID
   * @param status WBS 항목 상태
   * @param count 생성할 WBS 항목 수
   * @returns 생성된 WBS 항목 목록
   */
  async 상태별_WBS_테스트데이터를_생성한다(
    projectId: string,
    status: WbsItemStatus,
    count: number = 5,
  ): Promise<WbsItemDto[]> {
    const wbsItems: WbsItem[] = [];
    const wbsTypes = [
      '분석',
      '설계',
      '개발',
      '테스트',
      '검토',
      '배포',
      '문서화',
      '통합',
    ];

    for (let i = 0; i < count; i++) {
      const wbsType = wbsTypes[Math.floor(Math.random() * wbsTypes.length)];
      const startYear = 2024;
      const startMonth = Math.floor(Math.random() * 12);
      const startDay = Math.floor(Math.random() * 28) + 1;
      const duration = Math.floor(Math.random() * 3) + 1;

      const startDate = new Date(startYear, startMonth, startDay);
      const endDate = new Date(startYear, startMonth + duration, startDay);

      // 상태에 따른 진행률 설정
      let progressPercentage = 0;
      if (status === WbsItemStatus.COMPLETED) {
        progressPercentage = 100;
      } else if (status === WbsItemStatus.IN_PROGRESS) {
        progressPercentage = Math.floor(Math.random() * 80) + 10; // 10-90%
      } else if (status === WbsItemStatus.ON_HOLD) {
        progressPercentage = Math.floor(Math.random() * 50) + 10; // 10-60%
      }

      const wbsItem = new WbsItem(
        `${status.slice(0, 3).toUpperCase()}${String(i + 1).padStart(3, '0')}`,
        `${status}${wbsType}작업${i + 1}`,
        status,
        startDate,
        endDate,
        progressPercentage,
        `emp-${Math.floor(Math.random() * 10) + 1}`,
        projectId,
        undefined,
        1,
      );
      wbsItems.push(wbsItem);
    }

    const savedWbsItems = await this.wbsItemRepository.save(wbsItems);
    return savedWbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
  }

  /**
   * 담당자별 WBS 항목 테스트 데이터를 생성한다
   * @param projectId 프로젝트 ID
   * @param assignedToId 담당자 ID
   * @param count 생성할 WBS 항목 수
   * @returns 생성된 WBS 항목 목록
   */
  async 담당자별_WBS_테스트데이터를_생성한다(
    projectId: string,
    assignedToId: string,
    count: number = 3,
  ): Promise<WbsItemDto[]> {
    const wbsItems: WbsItem[] = [];
    const wbsTypes = [
      '분석',
      '설계',
      '개발',
      '테스트',
      '검토',
      '배포',
      '문서화',
      '통합',
    ];
    const statuses: WbsItemStatus[] = [
      WbsItemStatus.PENDING,
      WbsItemStatus.IN_PROGRESS,
      WbsItemStatus.COMPLETED,
    ];

    for (let i = 0; i < count; i++) {
      const wbsType = wbsTypes[Math.floor(Math.random() * wbsTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const startYear = 2024;
      const startMonth = Math.floor(Math.random() * 12);
      const startDay = Math.floor(Math.random() * 28) + 1;
      const duration = Math.floor(Math.random() * 3) + 1;

      const startDate = new Date(startYear, startMonth, startDay);
      const endDate = new Date(startYear, startMonth + duration, startDay);

      let progressPercentage = 0;
      if (status === WbsItemStatus.COMPLETED) {
        progressPercentage = 100;
      } else if (status === WbsItemStatus.IN_PROGRESS) {
        progressPercentage = Math.floor(Math.random() * 80) + 10;
      }

      const wbsItem = new WbsItem(
        `${assignedToId.slice(-3).toUpperCase()}${String(i + 1).padStart(3, '0')}`,
        `${assignedToId}담당${wbsType}작업${i + 1}`,
        status,
        startDate,
        endDate,
        progressPercentage,
        assignedToId,
        projectId,
        undefined,
        1,
      );
      wbsItems.push(wbsItem);
    }

    const savedWbsItems = await this.wbsItemRepository.save(wbsItems);
    return savedWbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
  }

  /**
   * 계층구조 WBS 항목 테스트 데이터를 생성한다
   * @param projectId 프로젝트 ID
   * @param maxLevel 최대 레벨
   * @param itemsPerLevel 레벨당 항목 수
   * @returns 생성된 WBS 항목 목록
   */
  async 계층구조_WBS_테스트데이터를_생성한다(
    projectId: string,
    maxLevel: number = 3,
    itemsPerLevel: number = 2,
  ): Promise<WbsItemDto[]> {
    const allWbsItems: WbsItem[] = [];
    const wbsTypes = [
      '분석',
      '설계',
      '개발',
      '테스트',
      '검토',
      '배포',
      '문서화',
      '통합',
    ];

    // 1단계 (최상위) 항목들 생성
    for (let i = 0; i < itemsPerLevel; i++) {
      const wbsType = wbsTypes[Math.floor(Math.random() * wbsTypes.length)];
      const startDate = new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
      );
      const endDate = new Date(
        2024,
        Math.floor(Math.random() * 12) + 3,
        Math.floor(Math.random() * 28) + 1,
      );

      const wbsItem = new WbsItem(
        `${i + 1}.0`,
        `1단계${wbsType}작업${i + 1}`,
        WbsItemStatus.IN_PROGRESS,
        startDate,
        endDate,
        Math.floor(Math.random() * 80) + 10,
        `emp-${Math.floor(Math.random() * 10) + 1}`,
        projectId,
        undefined,
        1,
      );
      allWbsItems.push(wbsItem);
    }

    const savedLevel1Items = await this.wbsItemRepository.save(allWbsItems);
    allWbsItems.length = 0; // 배열 초기화
    allWbsItems.push(...savedLevel1Items);

    // 2단계 이상 항목들 생성
    for (let level = 2; level <= maxLevel; level++) {
      const parentItems = allWbsItems.filter(
        (item) => item.level === level - 1,
      );
      const newLevelItems: WbsItem[] = [];

      for (const parentItem of parentItems) {
        for (let j = 0; j < itemsPerLevel; j++) {
          const wbsType = wbsTypes[Math.floor(Math.random() * wbsTypes.length)];
          const startDate = new Date(
            2024,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1,
          );
          const endDate = new Date(
            2024,
            Math.floor(Math.random() * 12) + 2,
            Math.floor(Math.random() * 28) + 1,
          );

          const wbsItem = new WbsItem(
            `${parentItem.wbsCode}.${j + 1}`,
            `${level}단계${wbsType}작업${j + 1}`,
            WbsItemStatus.PENDING,
            startDate,
            endDate,
            Math.floor(Math.random() * 50),
            `emp-${Math.floor(Math.random() * 10) + 1}`,
            projectId,
            parentItem.id,
            level,
          );
          newLevelItems.push(wbsItem);
        }
      }

      const savedLevelItems = await this.wbsItemRepository.save(newLevelItems);
      allWbsItems.push(...savedLevelItems);
    }

    return allWbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
  }
}
