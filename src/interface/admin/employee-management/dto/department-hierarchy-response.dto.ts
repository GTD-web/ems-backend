import { ApiProperty } from '@nestjs/swagger';

/**
 * 부서 하이라키 응답 DTO
 */
export class DepartmentHierarchyResponseDto {
  @ApiProperty({
    description: '부서 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '부서명',
    example: '기술본부',
  })
  name: string;

  @ApiProperty({
    description: '부서 코드',
    example: 'TECH',
  })
  code: string;

  @ApiProperty({
    description: '정렬 순서',
    example: 1,
  })
  order: number;

  @ApiProperty({
    description: '상위 부서의 외부 시스템 ID',
    example: 'PARENT_DEPT_01',
    nullable: true,
  })
  parentDepartmentId: string | null;

  @ApiProperty({
    description: '계층 레벨 (루트=0, 하위로 갈수록 1씩 증가)',
    example: 0,
  })
  level: number;

  @ApiProperty({
    description: '하위 부서의 최대 깊이 (leaf 노드=0)',
    example: 2,
  })
  depth: number;

  @ApiProperty({
    description: '직계 하위 부서 개수',
    example: 3,
  })
  childrenCount: number;

  @ApiProperty({
    description: '모든 하위 부서(직계 + 손자 이하) 개수',
    example: 7,
  })
  totalDescendants: number;

  @ApiProperty({
    description: '하위 부서 배열 (재귀적 구조)',
    type: () => [DepartmentHierarchyResponseDto],
    isArray: true,
    example: [
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: '개발팀',
        code: 'DEV',
        order: 1,
        parentDepartmentId: 'TECH',
        level: 1,
        depth: 0,
        childrenCount: 0,
        totalDescendants: 0,
        subDepartments: [],
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        name: '디자인팀',
        code: 'DESIGN',
        order: 2,
        parentDepartmentId: 'TECH',
        level: 1,
        depth: 0,
        childrenCount: 0,
        totalDescendants: 0,
        subDepartments: [],
      },
    ],
  })
  subDepartments: DepartmentHierarchyResponseDto[];
}

/**
 * 직원 요약 정보 DTO
 */
export class EmployeeSummaryDto {
  @ApiProperty({
    description: '직원 UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: '사번',
    example: 'EMP001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@example.com',
  })
  email: string;

  @ApiProperty({
    description: '직책명',
    example: '부장',
    nullable: true,
  })
  rankName: string | null;

  @ApiProperty({
    description: '직책 코드',
    example: 'RANK_04',
    nullable: true,
  })
  rankCode: string | null;

  @ApiProperty({
    description: '직책 레벨',
    example: 4,
    nullable: true,
  })
  rankLevel: number | null;

  @ApiProperty({
    description: '재직 여부',
    example: true,
  })
  isActive: boolean;
}

/**
 * 직원 포함 부서 하이라키 응답 DTO
 */
export class DepartmentHierarchyWithEmployeesResponseDto {
  @ApiProperty({
    description: '부서 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '부서명',
    example: '기술본부',
  })
  name: string;

  @ApiProperty({
    description: '부서 코드',
    example: 'TECH',
  })
  code: string;

  @ApiProperty({
    description: '정렬 순서',
    example: 1,
  })
  order: number;

  @ApiProperty({
    description: '상위 부서의 외부 시스템 ID',
    example: 'PARENT_DEPT_01',
    nullable: true,
  })
  parentDepartmentId: string | null;

  @ApiProperty({
    description: '계층 레벨 (루트=0, 하위로 갈수록 1씩 증가)',
    example: 0,
  })
  level: number;

  @ApiProperty({
    description: '하위 부서의 최대 깊이 (leaf 노드=0)',
    example: 2,
  })
  depth: number;

  @ApiProperty({
    description: '직계 하위 부서 개수',
    example: 3,
  })
  childrenCount: number;

  @ApiProperty({
    description: '모든 하위 부서(직계 + 손자 이하) 개수',
    example: 7,
  })
  totalDescendants: number;

  @ApiProperty({
    description: '부서 소속 직원 수',
    example: 5,
  })
  employeeCount: number;

  @ApiProperty({
    description: '부서 소속 직원 목록',
    type: () => [EmployeeSummaryDto],
    isArray: true,
  })
  employees: EmployeeSummaryDto[];

  @ApiProperty({
    description: '하위 부서 배열 (재귀적 구조)',
    type: () => [DepartmentHierarchyWithEmployeesResponseDto],
    isArray: true,
    example: [
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: '개발팀',
        code: 'DEV',
        order: 1,
        parentDepartmentId: 'TECH',
        level: 1,
        depth: 0,
        childrenCount: 0,
        totalDescendants: 0,
        employeeCount: 2,
        employees: [
          {
            id: '523e4567-e89b-12d3-a456-426614174010',
            employeeNumber: 'EMP002',
            name: '김개발',
            email: 'kim@example.com',
            rankName: '과장',
            rankCode: 'RANK_03',
            rankLevel: 3,
            isActive: true,
          },
          {
            id: '623e4567-e89b-12d3-a456-426614174011',
            employeeNumber: 'EMP003',
            name: '이코딩',
            email: 'lee@example.com',
            rankName: '대리',
            rankCode: 'RANK_02',
            rankLevel: 2,
            isActive: true,
          },
        ],
        subDepartments: [],
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        name: '디자인팀',
        code: 'DESIGN',
        order: 2,
        parentDepartmentId: 'TECH',
        level: 1,
        depth: 0,
        childrenCount: 0,
        totalDescendants: 0,
        employeeCount: 1,
        employees: [
          {
            id: '723e4567-e89b-12d3-a456-426614174012',
            employeeNumber: 'EMP004',
            name: '박디자인',
            email: 'park@example.com',
            rankName: '사원',
            rankCode: 'RANK_01',
            rankLevel: 1,
            isActive: true,
          },
        ],
        subDepartments: [],
      },
    ],
  })
  subDepartments: DepartmentHierarchyWithEmployeesResponseDto[];
}
