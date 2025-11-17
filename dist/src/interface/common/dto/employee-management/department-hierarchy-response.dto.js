"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentHierarchyWithEmployeesResponseDto = exports.EmployeeSummaryDto = exports.DepartmentHierarchyResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class DepartmentHierarchyResponseDto {
    id;
    name;
    code;
    order;
    parentDepartmentId;
    level;
    depth;
    childrenCount;
    totalDescendants;
    subDepartments;
}
exports.DepartmentHierarchyResponseDto = DepartmentHierarchyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서 UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], DepartmentHierarchyResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서명',
        example: '기술본부',
    }),
    __metadata("design:type", String)
], DepartmentHierarchyResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서 코드',
        example: 'TECH',
    }),
    __metadata("design:type", String)
], DepartmentHierarchyResponseDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '정렬 순서',
        example: 1,
    }),
    __metadata("design:type", Number)
], DepartmentHierarchyResponseDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상위 부서의 외부 시스템 ID',
        example: 'PARENT_DEPT_01',
        nullable: true,
    }),
    __metadata("design:type", Object)
], DepartmentHierarchyResponseDto.prototype, "parentDepartmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '계층 레벨 (루트=0, 하위로 갈수록 1씩 증가)',
        example: 0,
    }),
    __metadata("design:type", Number)
], DepartmentHierarchyResponseDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하위 부서의 최대 깊이 (leaf 노드=0)',
        example: 2,
    }),
    __metadata("design:type", Number)
], DepartmentHierarchyResponseDto.prototype, "depth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직계 하위 부서 개수',
        example: 3,
    }),
    __metadata("design:type", Number)
], DepartmentHierarchyResponseDto.prototype, "childrenCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 하위 부서(직계 + 손자 이하) 개수',
        example: 7,
    }),
    __metadata("design:type", Number)
], DepartmentHierarchyResponseDto.prototype, "totalDescendants", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
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
    }),
    __metadata("design:type", Array)
], DepartmentHierarchyResponseDto.prototype, "subDepartments", void 0);
class EmployeeSummaryDto {
    id;
    employeeNumber;
    name;
    email;
    rankName;
    rankCode;
    rankLevel;
    isActive;
}
exports.EmployeeSummaryDto = EmployeeSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 UUID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], EmployeeSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사번',
        example: 'EMP001',
    }),
    __metadata("design:type", String)
], EmployeeSummaryDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EmployeeSummaryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일',
        example: 'hong@example.com',
    }),
    __metadata("design:type", String)
], EmployeeSummaryDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직책명',
        example: '부장',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeSummaryDto.prototype, "rankName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직책 코드',
        example: 'RANK_04',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeSummaryDto.prototype, "rankCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직책 레벨',
        example: 4,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeSummaryDto.prototype, "rankLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '재직 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EmployeeSummaryDto.prototype, "isActive", void 0);
class DepartmentHierarchyWithEmployeesResponseDto {
    id;
    name;
    code;
    order;
    parentDepartmentId;
    level;
    depth;
    childrenCount;
    totalDescendants;
    employeeCount;
    employees;
    subDepartments;
}
exports.DepartmentHierarchyWithEmployeesResponseDto = DepartmentHierarchyWithEmployeesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서 UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서명',
        example: '기술본부',
    }),
    __metadata("design:type", String)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서 코드',
        example: 'TECH',
    }),
    __metadata("design:type", String)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '정렬 순서',
        example: 1,
    }),
    __metadata("design:type", Number)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상위 부서의 외부 시스템 ID',
        example: 'PARENT_DEPT_01',
        nullable: true,
    }),
    __metadata("design:type", Object)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "parentDepartmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '계층 레벨 (루트=0, 하위로 갈수록 1씩 증가)',
        example: 0,
    }),
    __metadata("design:type", Number)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하위 부서의 최대 깊이 (leaf 노드=0)',
        example: 2,
    }),
    __metadata("design:type", Number)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "depth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직계 하위 부서 개수',
        example: 3,
    }),
    __metadata("design:type", Number)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "childrenCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 하위 부서(직계 + 손자 이하) 개수',
        example: 7,
    }),
    __metadata("design:type", Number)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "totalDescendants", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서 소속 직원 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "employeeCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서 소속 직원 목록',
        type: () => [EmployeeSummaryDto],
        isArray: true,
    }),
    __metadata("design:type", Array)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "employees", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
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
    }),
    __metadata("design:type", Array)
], DepartmentHierarchyWithEmployeesResponseDto.prototype, "subDepartments", void 0);
//# sourceMappingURL=department-hierarchy-response.dto.js.map