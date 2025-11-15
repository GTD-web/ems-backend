// 커맨드 클래스 export
export * from './exclude-employee-from-list.handler';
export * from './include-employee-in-list.handler';
export * from './update-employee-accessibility.handler';

// 핸들러 import
import { ExcludeEmployeeFromListHandler } from './exclude-employee-from-list.handler';
import { IncludeEmployeeInListHandler } from './include-employee-in-list.handler';
import { UpdateEmployeeAccessibilityHandler } from './update-employee-accessibility.handler';

export const COMMAND_HANDLERS = [
  ExcludeEmployeeFromListHandler,
  IncludeEmployeeInListHandler,
  UpdateEmployeeAccessibilityHandler,
];
