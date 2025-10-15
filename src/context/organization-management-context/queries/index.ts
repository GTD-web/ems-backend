// 쿼리 클래스 export
export * from './get-all-departments.handler';
export * from './get-department.handler';
export * from './get-employees-by-department.handler';
export * from './get-organization-chart.handler';
export * from './get-employee.handler';
export * from './get-all-employees.handler';
export * from './get-manager.handler';
export * from './get-subordinates.handler';
export * from './get-sub-departments.handler';
export * from './get-parent-department.handler';
export * from './get-active-employees.handler';
export * from './get-department-hierarchy.handler';
export * from './get-department-hierarchy-with-employees.handler';

// 핸들러 import
import { GetAllDepartmentsQueryHandler } from './get-all-departments.handler';
import { GetDepartmentQueryHandler } from './get-department.handler';
import { GetEmployeesByDepartmentQueryHandler } from './get-employees-by-department.handler';
import { GetOrganizationChartQueryHandler } from './get-organization-chart.handler';
import { GetEmployeeQueryHandler } from './get-employee.handler';
import { GetAllEmployeesQueryHandler } from './get-all-employees.handler';
import { GetManagerQueryHandler } from './get-manager.handler';
import { GetSubordinatesQueryHandler } from './get-subordinates.handler';
import { GetSubDepartmentsQueryHandler } from './get-sub-departments.handler';
import { GetParentDepartmentQueryHandler } from './get-parent-department.handler';
import { GetActiveEmployeesQueryHandler } from './get-active-employees.handler';
import { GetDepartmentHierarchyQueryHandler } from './get-department-hierarchy.handler';
import { GetDepartmentHierarchyWithEmployeesQueryHandler } from './get-department-hierarchy-with-employees.handler';

export const QUERY_HANDLERS = [
  GetAllDepartmentsQueryHandler,
  GetDepartmentQueryHandler,
  GetEmployeesByDepartmentQueryHandler,
  GetOrganizationChartQueryHandler,
  GetEmployeeQueryHandler,
  GetAllEmployeesQueryHandler,
  GetManagerQueryHandler,
  GetSubordinatesQueryHandler,
  GetSubDepartmentsQueryHandler,
  GetParentDepartmentQueryHandler,
  GetActiveEmployeesQueryHandler,
  GetDepartmentHierarchyQueryHandler,
  GetDepartmentHierarchyWithEmployeesQueryHandler,
];
