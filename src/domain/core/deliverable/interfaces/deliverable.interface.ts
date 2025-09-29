import type {
  DeliverableStatus,
  DeliverableType,
  DeliverableDto,
} from '../deliverable.types';
import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 산출물 인터페이스
 * WBS 항목별 산출물을 관리하는 인터페이스입니다.
 */
export interface IDeliverable extends IBaseEntity {
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 산출물명 */
  name: string;
  /** 산출물 설명 */
  description?: string;
  /** 산출물 유형 */
  type: DeliverableType;
  /** 상태 */
  status: DeliverableStatus;
  /** 예상 완료일 */
  expectedCompletionDate?: Date;
  /** 실제 완료일 */
  actualCompletionDate?: Date;
  /** 파일 경로 */
  filePath?: string;
  /** 파일 크기 (bytes) */
  fileSize?: number;
  /** MIME 타입 */
  mimeType?: string;

  /**
   * 산출물 정보를 업데이트한다
   * @param name 새로운 산출물명
   * @param description 새로운 설명
   * @param updatedBy 수정자 ID
   */
  정보업데이트한다(
    name?: string,
    description?: string,
    updatedBy?: string,
  ): void;

  /**
   * 산출물 유형을 변경한다
   * @param type 새로운 산출물 유형
   * @param changedBy 변경한 사용자 ID
   */
  유형변경한다(type: DeliverableType, changedBy: string): void;

  /**
   * 예상 완료일을 설정한다
   * @param expectedDate 예상 완료일
   * @param setBy 설정한 사용자 ID
   */
  예상완료일설정한다(expectedDate: Date, setBy: string): void;

  /**
   * 산출물 작업을 시작한다
   * @param startedBy 시작한 사용자 ID
   */
  작업시작한다(startedBy: string): void;

  /**
   * 산출물을 완료한다
   * @param completedBy 완료한 사용자 ID
   */
  완료한다(completedBy: string): void;

  /**
   * 산출물을 거부한다
   * @param rejectedBy 거부한 사용자 ID
   */
  거부한다(rejectedBy: string): void;

  /**
   * 상태를 변경한다
   * @param status 새로운 상태
   * @param changedBy 변경한 사용자 ID
   */
  상태변경한다(status: DeliverableStatus, changedBy: string): void;

  /**
   * 파일 정보를 업데이트한다
   * @param filePath 파일 경로
   * @param fileSize 파일 크기
   * @param mimeType MIME 타입
   * @param updatedBy 수정자 ID
   */
  파일정보업데이트한다(
    filePath: string,
    fileSize: number,
    mimeType: string,
    updatedBy: string,
  ): void;

  /**
   * 파일을 삭제한다
   * @param deletedBy 삭제한 사용자 ID
   */
  파일삭제한다(deletedBy: string): void;

  /**
   * 산출물이 완료되었는지 확인한다
   * @returns 완료 여부
   */
  완료됨(): boolean;

  /**
   * 산출물이 진행중인지 확인한다
   * @returns 진행중 여부
   */
  진행중인가(): boolean;

  /**
   * 산출물이 대기중인지 확인한다
   * @returns 대기중 여부
   */
  대기중인가(): boolean;

  /**
   * 산출물이 거부되었는지 확인한다
   * @returns 거부 여부
   */
  거부됨(): boolean;

  /**
   * 산출물이 지연되었는지 확인한다
   * @returns 지연 여부
   */
  지연됨(): boolean;

  /**
   * 파일이 첨부되어 있는지 확인한다
   * @returns 파일 첨부 여부
   */
  파일첨부됨(): boolean;

  /**
   * 산출물 설명이 있는지 확인한다
   * @returns 설명 존재 여부
   */
  설명있는가(): boolean;

  /**
   * 특정 WBS 항목의 산출물인지 확인한다
   * @param wbsItemId 확인할 WBS 항목 ID
   * @returns WBS 항목 일치 여부
   */
  WBS항목일치하는가(wbsItemId: string): boolean;

  /**
   * 특정 유형의 산출물인지 확인한다
   * @param type 확인할 산출물 유형
   * @returns 유형 일치 여부
   */
  유형일치하는가(type: DeliverableType): boolean;

  /**
   * 완료 소요 시간을 계산한다 (일 단위)
   * @returns 완료 소요 시간 (일)
   */
  완료소요시간계산한다(): number;

  /**
   * 예상 완료일까지 남은 시간을 계산한다 (일 단위)
   * @returns 남은 시간 (일)
   */
  남은시간계산한다(): number;

  /**
   * 산출물을 복사한다
   * @param newWbsItemId 새로운 WBS 항목 ID
   * @param copiedBy 복사한 사용자 ID
   * @returns 복사된 산출물 정보
   */
  산출물복사한다(newWbsItemId: string, copiedBy: string): Partial<IDeliverable>;

  /**
   * 산출물을 DTO로 변환한다
   * @returns 산출물 DTO 객체
   */
  DTO변환한다(): DeliverableDto;
}
