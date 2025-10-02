// 성과평가 컨텍스트 인터페이스 정의
import {
  CreateWbsSelfEvaluationCommand,
  SubmitWbsSelfEvaluationCommand,
  UpdateWbsSelfEvaluationCommand,
} from '../handlers/self-evaluation';
import {
  CreatePeerEvaluationCommand,
  SubmitPeerEvaluationCommand,
  UpdatePeerEvaluationCommand,
} from '../handlers/peer-evaluation';
import {
  CreateDownwardEvaluationCommand,
  SubmitDownwardEvaluationCommand,
  UpdateDownwardEvaluationCommand,
} from '../handlers/downward-evaluation';
import {
  GetEmployeeSelfEvaluationsQuery,
  GetWbsSelfEvaluationDetailQuery,
} from '../handlers/self-evaluation';
import {
  GetPeerEvaluationListQuery,
  GetPeerEvaluationDetailQuery,
} from '../handlers/peer-evaluation';
import {
  GetDownwardEvaluationListQuery,
  GetDownwardEvaluationDetailQuery,
} from '../handlers/downward-evaluation';
import { WbsSelfEvaluationDto } from '@/domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { WbsSelfEvaluationMappingDto } from '@/domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.types';
import {
  WbsSelfEvaluationResponseDto,
  WbsSelfEvaluationBasicDto,
  EmployeeSelfEvaluationsResponseDto,
} from '@/interface/admin/performance-evaluation/dto/wbs-self-evaluation.dto';

/**
 * 성과평가 컨텍스트 서비스 인터페이스
 */
export interface IPerformanceEvaluationService {
  // ==================== 자기평가(성과입력) 관련 메서드 ====================

  /**
   * WBS 자기평가를 생성한다
   */
  WBS자기평가를_생성한다(
    command: CreateWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationResponseDto>;

  /**
   * WBS 자기평가를 수정한다
   */
  WBS자기평가를_수정한다(
    command: UpdateWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationBasicDto>;

  /**
   * WBS 자기평가를 제출한다
   */
  WBS자기평가를_제출한다(
    command: SubmitWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationResponseDto>;

  /**
   * 직원의 자기평가 목록을 조회한다
   */
  직원의_자기평가_목록을_조회한다(
    query: GetEmployeeSelfEvaluationsQuery,
  ): Promise<EmployeeSelfEvaluationsResponseDto>;

  /**
   * WBS 자기평가 상세정보를 조회한다
   */
  WBS자기평가_상세정보를_조회한다(
    query: GetWbsSelfEvaluationDetailQuery,
  ): Promise<any>;

  // ==================== 동료평가 관련 메서드 ====================

  /**
   * 동료평가를 생성한다
   */
  동료평가를_생성한다(command: CreatePeerEvaluationCommand): Promise<string>;

  /**
   * 동료평가를 수정한다
   */
  동료평가를_수정한다(command: UpdatePeerEvaluationCommand): Promise<void>;

  /**
   * 동료평가를 제출한다
   */
  동료평가를_제출한다(command: SubmitPeerEvaluationCommand): Promise<void>;

  /**
   * 동료평가 목록을 조회한다
   */
  동료평가_목록을_조회한다(query: GetPeerEvaluationListQuery): Promise<any>;

  /**
   * 동료평가 상세정보를 조회한다
   */
  동료평가_상세정보를_조회한다(
    query: GetPeerEvaluationDetailQuery,
  ): Promise<any>;

  // ==================== 하향평가 관련 메서드 ====================

  /**
   * 하향평가를 생성한다
   */
  하향평가를_생성한다(
    command: CreateDownwardEvaluationCommand,
  ): Promise<string>;

  /**
   * 하향평가를 수정한다
   */
  하향평가를_수정한다(command: UpdateDownwardEvaluationCommand): Promise<void>;

  /**
   * 하향평가를 제출한다
   */
  하향평가를_제출한다(command: SubmitDownwardEvaluationCommand): Promise<void>;

  /**
   * 하향평가 목록을 조회한다
   */
  하향평가_목록을_조회한다(query: GetDownwardEvaluationListQuery): Promise<any>;

  /**
   * 하향평가 상세정보를 조회한다
   */
  하향평가_상세정보를_조회한다(
    query: GetDownwardEvaluationDetailQuery,
  ): Promise<any>;
}
