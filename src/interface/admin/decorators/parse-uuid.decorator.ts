import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { validate as isValidUUID } from 'uuid';

/**
 * UUID 파라미터를 파싱하고 검증하는 커스텀 데코레이터
 *
 * 기본 ParseUUIDPipe와 달리 한국어 에러 메시지를 제공합니다.
 *
 * @example
 * ```typescript
 * @Get(':id')
 * async getDetail(@ParseUUID('id') id: string) {
 *   return await this.service.getDetail(id);
 * }
 * ```
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
 * ID 파라미터 전용 UUID 파싱 데코레이터
 *
 * @ParseUUID('id')의 단축형입니다.
 *
 * @example
 * ```typescript
 * @Get(':id')
 * async getDetail(@ParseId() id: string) {
 *   return await this.service.getDetail(id);
 * }
 * ```
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
