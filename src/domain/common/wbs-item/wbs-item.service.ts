import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WbsItem } from './wbs-item.entity';
import {
  CreateWbsItemDto,
  UpdateWbsItemDto,
  WbsItemDto,
  WbsItemFilter,
  WbsItemListOptions,
  WbsItemStatus,
  WbsTreeNode,
} from './wbs-item.types';

/**
 * WBS 항목 도메인 서비스
 *
 * WBS 항목 엔티티의 비즈니스 로직을 담당하는 서비스입니다.
 */
@Injectable()
export class WbsItemService {
  constructor(
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
  ) {}

  /**
   * 새로운 WBS 항목을 생성한다
   * @param data WBS 항목 생성 데이터
   * @param createdBy 생성자 ID
   * @returns 생성된 WBS 항목 정보
   */
  async 생성한다(
    data: CreateWbsItemDto,
    createdBy: string,
  ): Promise<WbsItemDto> {
    // WBS 코드 중복 검사 (같은 프로젝트 내에서)
    const existingWbsItem = await this.wbsItemRepository.findOne({
      where: {
        wbsCode: data.wbsCode,
        projectId: data.projectId,
        deletedAt: IsNull(),
      },
    });

    if (existingWbsItem) {
      throw new Error(
        `프로젝트 내 WBS 코드 ${data.wbsCode}는 이미 사용 중입니다.`,
      );
    }

    // 상위 WBS 항목 검증 (있는 경우)
    if (data.parentWbsId) {
      const parentWbs = await this.wbsItemRepository.findOne({
        where: { id: data.parentWbsId, deletedAt: IsNull() },
      });

      if (!parentWbs) {
        throw new Error(
          `상위 WBS 항목 ID ${data.parentWbsId}를 찾을 수 없습니다.`,
        );
      }

      if (parentWbs.projectId !== data.projectId) {
        throw new Error('상위 WBS 항목과 프로젝트가 일치하지 않습니다.');
      }

      // 레벨 검증 (상위 항목의 레벨 + 1이어야 함)
      if (data.level !== parentWbs.level + 1) {
        throw new Error(
          `WBS 레벨은 상위 항목 레벨(${parentWbs.level}) + 1이어야 합니다.`,
        );
      }
    } else {
      // 최상위 항목인 경우 레벨은 1이어야 함
      if (data.level !== 1) {
        throw new Error('최상위 WBS 항목의 레벨은 1이어야 합니다.');
      }
    }

    const wbsItem = WbsItem.생성한다(data, createdBy);
    const savedWbsItem = await this.wbsItemRepository.save(wbsItem);
    return savedWbsItem.DTO로_변환한다();
  }

  /**
   * WBS 항목 정보를 수정한다
   * @param id WBS 항목 ID
   * @param data 수정할 데이터
   * @param updatedBy 수정자 ID
   * @returns 수정된 WBS 항목 정보
   */
  async 수정한다(
    id: string,
    data: UpdateWbsItemDto,
    updatedBy: string,
  ): Promise<WbsItemDto> {
    const wbsItem = await this.wbsItemRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!wbsItem) {
      throw new Error(`ID ${id}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
    }

    // WBS 코드 중복 검사 (코드가 변경되는 경우)
    if (data.wbsCode && data.wbsCode !== wbsItem.wbsCode) {
      const existingWbsItem = await this.wbsItemRepository.findOne({
        where: {
          wbsCode: data.wbsCode,
          projectId: data.projectId || wbsItem.projectId,
          deletedAt: IsNull(),
        },
      });

      if (existingWbsItem && existingWbsItem.id !== id) {
        throw new Error(
          `프로젝트 내 WBS 코드 ${data.wbsCode}는 이미 사용 중입니다.`,
        );
      }
    }

    // 상위 WBS 항목 검증 (변경되는 경우)
    if (data.parentWbsId !== undefined) {
      if (data.parentWbsId) {
        const parentWbs = await this.wbsItemRepository.findOne({
          where: { id: data.parentWbsId, deletedAt: IsNull() },
        });

        if (!parentWbs) {
          throw new Error(
            `상위 WBS 항목 ID ${data.parentWbsId}를 찾을 수 없습니다.`,
          );
        }

        if (parentWbs.projectId !== (data.projectId || wbsItem.projectId)) {
          throw new Error('상위 WBS 항목과 프로젝트가 일치하지 않습니다.');
        }

        // 자기 자신을 상위로 설정하는 것 방지
        if (data.parentWbsId === id) {
          throw new Error('자기 자신을 상위 WBS 항목으로 설정할 수 없습니다.');
        }

        // 순환 참조 방지 (간단한 검사)
        const descendants = await this.하위_WBS_조회한다(id);
        if (descendants.some((desc) => desc.id === data.parentWbsId)) {
          throw new Error(
            '순환 참조가 발생합니다. 하위 WBS 항목을 상위로 설정할 수 없습니다.',
          );
        }
      }
    }

    // 진행률 검증 (0-100 범위)
    if (data.progressPercentage !== undefined) {
      if (data.progressPercentage < 0 || data.progressPercentage > 100) {
        throw new Error('진행률은 0-100 범위여야 합니다.');
      }
    }

    wbsItem.업데이트한다(data, updatedBy);
    const savedWbsItem = await this.wbsItemRepository.save(wbsItem);
    return savedWbsItem.DTO로_변환한다();
  }

  /**
   * WBS 항목을 삭제한다 (소프트 삭제)
   * @param id WBS 항목 ID
   * @param deletedBy 삭제자 ID
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    const wbsItem = await this.wbsItemRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!wbsItem) {
      throw new Error(`ID ${id}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
    }

    // 하위 WBS 항목이 있는지 확인
    const childrenCount = await this.wbsItemRepository.count({
      where: { parentWbsId: id, deletedAt: IsNull() },
    });

    if (childrenCount > 0) {
      throw new Error(
        '하위 WBS 항목이 있는 경우 삭제할 수 없습니다. 먼저 하위 항목을 삭제하세요.',
      );
    }

    wbsItem.삭제한다(deletedBy);
    await this.wbsItemRepository.save(wbsItem);
  }

  /**
   * ID로 WBS 항목을 조회한다
   * @param id WBS 항목 ID
   * @returns WBS 항목 정보 (없으면 null)
   */
  async ID로_조회한다(id: string): Promise<WbsItemDto | null> {
    const wbsItem = await this.wbsItemRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    return wbsItem ? wbsItem.DTO로_변환한다() : null;
  }

  /**
   * WBS 코드로 WBS 항목을 조회한다
   * @param wbsCode WBS 코드
   * @param projectId 프로젝트 ID
   * @returns WBS 항목 정보 (없으면 null)
   */
  async WBS코드로_조회한다(
    wbsCode: string,
    projectId: string,
  ): Promise<WbsItemDto | null> {
    const wbsItem = await this.wbsItemRepository.findOne({
      where: { wbsCode, projectId, deletedAt: IsNull() },
    });

    return wbsItem ? wbsItem.DTO로_변환한다() : null;
  }

  /**
   * 필터 조건으로 WBS 항목 목록을 조회한다
   * @param filter 필터 조건
   * @returns WBS 항목 목록
   */
  async 필터_조회한다(filter: WbsItemFilter): Promise<WbsItemDto[]> {
    const queryBuilder = this.wbsItemRepository.createQueryBuilder('wbsItem');
    queryBuilder.where('wbsItem.deletedAt IS NULL');

    if (filter.status) {
      queryBuilder.andWhere('wbsItem.status = :status', {
        status: filter.status,
      });
    }

    if (filter.assignedToId) {
      queryBuilder.andWhere('wbsItem.assignedToId = :assignedToId', {
        assignedToId: filter.assignedToId,
      });
    }

    if (filter.projectId) {
      queryBuilder.andWhere('wbsItem.projectId = :projectId', {
        projectId: filter.projectId,
      });
    }

    if (filter.parentWbsId) {
      queryBuilder.andWhere('wbsItem.parentWbsId = :parentWbsId', {
        parentWbsId: filter.parentWbsId,
      });
    }

    if (filter.level) {
      queryBuilder.andWhere('wbsItem.level = :level', {
        level: filter.level,
      });
    }

    if (filter.startDateFrom) {
      queryBuilder.andWhere('wbsItem.startDate >= :startDateFrom', {
        startDateFrom: filter.startDateFrom,
      });
    }

    if (filter.startDateTo) {
      queryBuilder.andWhere('wbsItem.startDate <= :startDateTo', {
        startDateTo: filter.startDateTo,
      });
    }

    if (filter.endDateFrom) {
      queryBuilder.andWhere('wbsItem.endDate >= :endDateFrom', {
        endDateFrom: filter.endDateFrom,
      });
    }

    if (filter.endDateTo) {
      queryBuilder.andWhere('wbsItem.endDate <= :endDateTo', {
        endDateTo: filter.endDateTo,
      });
    }

    if (filter.progressMin !== undefined) {
      queryBuilder.andWhere('wbsItem.progressPercentage >= :progressMin', {
        progressMin: filter.progressMin,
      });
    }

    if (filter.progressMax !== undefined) {
      queryBuilder.andWhere('wbsItem.progressPercentage <= :progressMax', {
        progressMax: filter.progressMax,
      });
    }

    const wbsItems = await queryBuilder.getMany();
    return wbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
  }

  /**
   * 프로젝트별 WBS 항목 목록을 조회한다
   * @param projectId 프로젝트 ID
   * @returns 프로젝트 WBS 항목 목록
   */
  async 프로젝트별_조회한다(projectId: string): Promise<WbsItemDto[]> {
    const wbsItems = await this.wbsItemRepository.find({
      where: { projectId, deletedAt: IsNull() },
      order: { level: 'ASC', wbsCode: 'ASC' },
    });

    return wbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
  }

  /**
   * 담당자별 WBS 항목 목록을 조회한다
   * @param assignedToId 담당자 ID
   * @returns 담당자 WBS 항목 목록
   */
  async 담당자별_조회한다(assignedToId: string): Promise<WbsItemDto[]> {
    const wbsItems = await this.wbsItemRepository.find({
      where: { assignedToId, deletedAt: IsNull() },
      order: { startDate: 'ASC' },
    });

    return wbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
  }

  /**
   * 상위 WBS 항목의 하위 항목들을 조회한다
   * @param parentWbsId 상위 WBS 항목 ID
   * @returns 하위 WBS 항목 목록
   */
  async 하위_WBS_조회한다(parentWbsId: string): Promise<WbsItemDto[]> {
    const wbsItems = await this.wbsItemRepository.find({
      where: { parentWbsId, deletedAt: IsNull() },
      order: { wbsCode: 'ASC' },
    });

    return wbsItems.map((wbsItem) => wbsItem.DTO로_변환한다());
  }

  /**
   * 프로젝트의 WBS 계층 구조 트리를 조회한다
   * @param projectId 프로젝트 ID
   * @returns WBS 트리 구조
   */
  async WBS_트리_조회한다(projectId: string): Promise<WbsTreeNode[]> {
    const allWbsItems = await this.프로젝트별_조회한다(projectId);

    // 최상위 항목들 (parentWbsId가 null인 항목들)
    const rootItems = allWbsItems.filter((item) => !item.parentWbsId);

    const buildTree = (
      parentId: string | null,
      depth: number = 0,
    ): WbsTreeNode[] => {
      const children = allWbsItems.filter(
        (item) => item.parentWbsId === parentId,
      );

      return children.map((wbsItem) => {
        const childNodes = buildTree(wbsItem.id, depth + 1);

        return {
          wbsItem,
          children: childNodes,
          depth,
          hasChildren: childNodes.length > 0,
        };
      });
    };

    return buildTree(null);
  }

  /**
   * WBS 항목이 존재하는지 확인한다
   * @param id WBS 항목 ID
   * @returns 존재 여부
   */
  async 존재하는가(id: string): Promise<boolean> {
    const count = await this.wbsItemRepository.count({
      where: { id, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * WBS 코드가 존재하는지 확인한다 (같은 프로젝트 내에서)
   * @param wbsCode WBS 코드
   * @param projectId 프로젝트 ID
   * @param excludeId 제외할 WBS 항목 ID (수정 시 자신 제외용)
   * @returns 존재 여부
   */
  async WBS코드가_존재하는가(
    wbsCode: string,
    projectId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.wbsItemRepository.createQueryBuilder('wbsItem');
    queryBuilder.where('wbsItem.wbsCode = :wbsCode', { wbsCode });
    queryBuilder.andWhere('wbsItem.projectId = :projectId', { projectId });
    queryBuilder.andWhere('wbsItem.deletedAt IS NULL');

    if (excludeId) {
      queryBuilder.andWhere('wbsItem.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * WBS 항목 상태를 변경한다
   * @param id WBS 항목 ID
   * @param status 새로운 상태
   * @param updatedBy 수정자 ID
   * @returns 수정된 WBS 항목 정보
   */
  async 상태_변경한다(
    id: string,
    status: WbsItemStatus,
    updatedBy: string,
  ): Promise<WbsItemDto> {
    const wbsItem = await this.wbsItemRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!wbsItem) {
      throw new Error(`ID ${id}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
    }

    wbsItem.status = status;

    // 완료 상태로 변경 시 진행률을 100%로 설정
    if (status === WbsItemStatus.COMPLETED) {
      wbsItem.progressPercentage = 100;
    }

    wbsItem.수정자를_설정한다(updatedBy);

    const savedWbsItem = await this.wbsItemRepository.save(wbsItem);
    return savedWbsItem.DTO로_변환한다();
  }

  /**
   * WBS 항목 진행률을 업데이트한다
   * @param id WBS 항목 ID
   * @param progressPercentage 진행률 (0-100)
   * @param updatedBy 수정자 ID
   * @returns 수정된 WBS 항목 정보
   */
  async 진행률_업데이트한다(
    id: string,
    progressPercentage: number,
    updatedBy: string,
  ): Promise<WbsItemDto> {
    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new Error('진행률은 0-100 범위여야 합니다.');
    }

    const wbsItem = await this.wbsItemRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!wbsItem) {
      throw new Error(`ID ${id}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
    }

    wbsItem.progressPercentage = progressPercentage;

    // 진행률이 100%가 되면 완료 상태로 변경
    if (
      progressPercentage === 100 &&
      wbsItem.status !== WbsItemStatus.COMPLETED
    ) {
      wbsItem.status = WbsItemStatus.COMPLETED;
    }
    // 진행률이 0%보다 크고 100%보다 작으면 진행 중 상태로 변경
    else if (
      progressPercentage > 0 &&
      progressPercentage < 100 &&
      wbsItem.status === WbsItemStatus.PENDING
    ) {
      wbsItem.status = WbsItemStatus.IN_PROGRESS;
    }

    wbsItem.수정자를_설정한다(updatedBy);

    const savedWbsItem = await this.wbsItemRepository.save(wbsItem);
    return savedWbsItem.DTO로_변환한다();
  }
}
