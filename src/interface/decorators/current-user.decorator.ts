import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 인증된 사용자 정보
 */
export interface AuthenticatedUser {
  /** 사용자 ID */
  id: string;
  /** 이메일 */
  email: string;
  /** 이름 */
  name: string;
  /** 사번 */
  employeeNumber: string;
  /** EMS-PROD 시스템 역할 */
  roles: string[];
}

/**
 * CurrentUser 데코레이터
 *
 * JWT 인증 가드를 통해 검증된 사용자 정보를 주입받습니다.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return {
 *     id: user.id,
 *     name: user.name,
 *     employeeNumber: user.employeeNumber,
 *   };
 * }
 * ```
 *
 * @example
 * // 특정 필드만 가져오기
 * ```typescript
 * @Post('items')
 * createItem(
 *   @CurrentUser('employeeNumber') employeeNumber: string,
 *   @Body() dto: CreateItemDto,
 * ) {
 *   return this.itemService.create(employeeNumber, dto);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
