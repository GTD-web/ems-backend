import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { validate as isValidUUID } from 'uuid';

/**
 * UUID 파라미터를 파싱하고 유효성을 검사하는 커스텀 데코레이터
 * 잘못된 UUID 형식일 경우 한국어 에러 메시지를 반환합니다.
 *
 * @param paramName - URL 파라미터의 이름 (기본값: 'id')
 * @returns 유효한 UUID 문자열
 */
export const ParseUUID = createParamDecorator(
  (paramName: string, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const value = request.params[paramName];

    // 값이 없거나 빈 문자열인 경우
    if (!value || typeof value !== 'string' || value.trim() === '') {
      throw new BadRequestException(`${paramName} 파라미터가 필요합니다.`);
    }

    // UUID 형식 검증
    if (!isValidUUID(value.trim())) {
      throw new BadRequestException(
        `${paramName} 파라미터는 올바른 UUID 형식이어야 합니다. 입력값: ${value}`,
      );
    }

    return value.trim();
  },
);

/**
 * 'id'라는 이름의 UUID 파라미터를 파싱하고 유효성을 검사하는 커스텀 데코레이터
 * 가장 일반적인 'id' 파라미터에 사용됩니다.
 *
 * @returns 유효한 UUID 문자열
 */
export const ParseId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const value = request.params.id;

    // 값이 없거나 빈 문자열인 경우
    if (!value || typeof value !== 'string' || value.trim() === '') {
      throw new BadRequestException('ID 파라미터가 필요합니다.');
    }

    // UUID 형식 검증
    if (!isValidUUID(value.trim())) {
      throw new BadRequestException(
        `ID는 올바른 UUID 형식이어야 합니다. 입력값: ${value}`,
      );
    }

    return value.trim();
  },
);
