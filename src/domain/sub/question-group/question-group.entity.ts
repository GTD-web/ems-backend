import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IQuestionGroup } from './interfaces/question-group.interface';
import type {
  QuestionGroupDto,
  CreateQuestionGroupDto,
} from './question-group.types';
import { EmptyGroupNameException } from './question-group.exceptions';

/**
 * 질문 그룹 엔티티
 * 평가 질문들을 그룹화하여 관리합니다.
 * 하나의 질문은 여러 그룹에 속할 수 있습니다. (QuestionGroupMapping 사용)
 */
@Entity('question_group')
@Index(['isDefault'])
export class QuestionGroup
  extends BaseEntity<QuestionGroupDto>
  implements IQuestionGroup
{
  @Column({
    type: 'varchar',
    length: 200,
    comment: '그룹명 (삭제되지 않은 레코드에 한해 중복 불가)',
  })
  name: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: '기본 그룹 여부',
  })
  isDefault: boolean;

  @Column({
    type: 'boolean',
    default: true,
    comment: '삭제 가능 여부',
  })
  isDeletable: boolean;

  constructor(data?: CreateQuestionGroupDto & { createdBy: string }) {
    super();
    if (data) {
      if (!data.name || data.name.trim() === '') {
        throw new EmptyGroupNameException();
      }

      this.name = data.name;
      this.isDefault = data.isDefault || false;
      this.isDeletable =
        data.isDeletable !== undefined ? data.isDeletable : true;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 그룹명을 업데이트한다
   */
  그룹명업데이트한다(name: string, updatedBy: string): void {
    if (!name || name.trim() === '') {
      throw new EmptyGroupNameException();
    }

    this.name = name;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 기본 그룹 여부를 설정한다
   */
  기본그룹설정한다(isDefault: boolean, updatedBy: string): void {
    this.isDefault = isDefault;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 삭제 가능 여부를 설정한다
   */
  삭제가능여부설정한다(isDeletable: boolean, updatedBy: string): void {
    this.isDeletable = isDeletable;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 그룹이 삭제 가능한지 확인한다
   */
  삭제가능한가(): boolean {
    return this.isDeletable && !this.isDefault;
  }

  /**
   * 그룹이 기본 그룹인지 확인한다
   */
  기본그룹인가(): boolean {
    return this.isDefault;
  }

  /**
   * 그룹명이 유효한지 확인한다
   */
  유효한그룹명인가(): boolean {
    return this.name !== undefined && this.name.trim() !== '';
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): QuestionGroupDto {
    return {
      id: this.id,
      name: this.name,
      isDefault: this.isDefault,
      isDeletable: this.isDeletable,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

