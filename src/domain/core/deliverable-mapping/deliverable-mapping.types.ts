/**
 * 산출물 맵핑 관련 타입 정의
 */

/**
 * 산출물 맵핑 DTO
 */
export interface DeliverableMappingDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 직원 ID - 산출물을 제출하는 직원 식별자 */
  employeeId: string;
  /** WBS 항목 ID - 산출물이 속한 WBS 항목 식별자 */
  wbsItemId: string;
  /** 산출물 ID - 실제 산출물 엔티티 식별자 */
  deliverableId: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
}

/**
 * 산출물 맵핑 생성 데이터
 */
export interface CreateDeliverableMappingData {
  employeeId: string;
  wbsItemId: string;
  deliverableId: string;
}

/**
 * 산출물 맵핑 업데이트 데이터
 */
export interface UpdateDeliverableMappingData {
  deliverableId?: string;
}

/**
 * 산출물 맵핑 필터
 */
export interface DeliverableMappingFilter {
  employeeId?: string;
  wbsItemId?: string;
  deliverableId?: string;
}
