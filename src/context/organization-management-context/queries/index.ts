export * from './organization.queries';
export * from './organization.query-handlers';

import {
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
} from './organization.query-handlers';

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
];
