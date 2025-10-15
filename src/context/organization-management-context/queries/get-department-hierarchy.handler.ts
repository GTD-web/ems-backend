import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DepartmentRepository } from '../../../domain/common/department/department.repository';
import type { DepartmentHierarchyDto } from '../interfaces/organization-management-context.interface';

/**
 * 부서 하이라키 구조 조회 쿼리
 */
export class GetDepartmentHierarchyQuery implements IQuery {}

/**
 * 부서 하이라키 구조 조회 쿼리 핸들러
 */
@QueryHandler(GetDepartmentHierarchyQuery)
@Injectable()
export class GetDepartmentHierarchyQueryHandler
  implements IQueryHandler<GetDepartmentHierarchyQuery>
{
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async execute(
    query: GetDepartmentHierarchyQuery,
  ): Promise<DepartmentHierarchyDto[]> {
    const allDepartments = await this.departmentRepository.findAll();

    // 부서 계층 구조 구성
    // externalId를 키로 사용하여 매핑 (parentDepartmentId가 외부 시스템 ID이기 때문)
    const departmentByExternalId = new Map<string, DepartmentHierarchyDto>();
    const rootDepartments: DepartmentHierarchyDto[] = [];

    // 모든 부서를 맵에 추가 (externalId를 키로 사용, 필수 필드만 포함)
    allDepartments.forEach((dept) => {
      const deptHierarchy: DepartmentHierarchyDto = {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        order: dept.order,
        parentDepartmentId: dept.parentDepartmentId,
        level: 0, // 초기값, 나중에 재계산
        depth: 0, // 초기값, 나중에 재계산
        childrenCount: 0, // 초기값, 나중에 재계산
        totalDescendants: 0, // 초기값, 나중에 재계산
        subDepartments: [],
      };
      departmentByExternalId.set(dept.externalId, deptHierarchy);
    });

    // 부서 계층 구조 구성
    allDepartments.forEach((dept) => {
      const deptHierarchy = departmentByExternalId.get(dept.externalId)!;
      if (dept.parentDepartmentId) {
        // parentDepartmentId는 외부 시스템 ID이므로 externalId로 매칭
        const parent = departmentByExternalId.get(dept.parentDepartmentId);
        if (parent) {
          parent.subDepartments.push(deptHierarchy);
        } else {
          // 부모를 찾을 수 없으면 루트로 취급
          rootDepartments.push(deptHierarchy);
        }
      } else {
        rootDepartments.push(deptHierarchy);
      }
    });

    // 계층 정보 계산 (level, depth, childrenCount, totalDescendants)
    this.calculateHierarchyInfo(rootDepartments, 0);

    return rootDepartments;
  }

  /**
   * 부서 계층 정보를 재귀적으로 계산합니다
   * @param departments 부서 목록
   * @param currentLevel 현재 레벨
   * @returns 해당 부서 트리의 최대 깊이
   */
  private calculateHierarchyInfo(
    departments: DepartmentHierarchyDto[],
    currentLevel: number,
  ): number {
    let maxDepthInLevel = 0;

    for (const dept of departments) {
      // 현재 레벨 설정
      dept.level = currentLevel;

      // 직계 하위 부서 개수
      dept.childrenCount = dept.subDepartments.length;

      if (dept.subDepartments.length === 0) {
        // 하위 부서가 없으면 depth는 0
        dept.depth = 0;
        dept.totalDescendants = 0;
      } else {
        // 재귀적으로 하위 부서의 정보 계산
        const childDepth = this.calculateHierarchyInfo(
          dept.subDepartments,
          currentLevel + 1,
        );

        // 이 부서의 depth는 하위 부서의 최대 depth + 1
        dept.depth = childDepth + 1;

        // 모든 하위 부서 개수 계산 (직계 + 모든 손자 부서)
        dept.totalDescendants = dept.subDepartments.reduce(
          (sum, child) => sum + 1 + child.totalDescendants,
          0,
        );

        // 현재 레벨에서의 최대 깊이 업데이트
        maxDepthInLevel = Math.max(maxDepthInLevel, childDepth + 1);
      }
    }

    return maxDepthInLevel;
  }
}
