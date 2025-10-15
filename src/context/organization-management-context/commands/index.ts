// 커맨드 클래스 export
export * from './exclude-employee-from-list.handler';
export * from './include-employee-in-list.handler';

// 핸들러 import
import { ExcludeEmployeeFromListHandler } from './exclude-employee-from-list.handler';
import { IncludeEmployeeInListHandler } from './include-employee-in-list.handler';

export const COMMAND_HANDLERS = [
  ExcludeEmployeeFromListHandler,
  IncludeEmployeeInListHandler,
];
