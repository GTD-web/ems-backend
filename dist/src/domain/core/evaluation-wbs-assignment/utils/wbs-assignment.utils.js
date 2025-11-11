"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsAssignmentUtils = void 0;
class WbsAssignmentUtils {
    static WBS할당고유키생성한다(periodId, employeeId, projectId, wbsItemId) {
        return `${periodId}:${employeeId}:${projectId}:${wbsItemId}`;
    }
    static WBS할당고유키파싱한다(uniqueKey) {
        const parts = uniqueKey.split(':');
        if (parts.length !== 4) {
            throw new Error('유효하지 않은 WBS 할당 고유 키 형식입니다.');
        }
        return {
            periodId: parts[0],
            employeeId: parts[1],
            projectId: parts[2],
            wbsItemId: parts[3],
        };
    }
    static WBS할당날짜유효한가(assignedDate, periodStartDate, periodEndDate) {
        return assignedDate >= periodStartDate && assignedDate <= periodEndDate;
    }
    static WBS할당후경과시간계산한다(assignedDate, currentDate) {
        const now = currentDate || new Date();
        const diffInTime = now.getTime() - assignedDate.getTime();
        return Math.floor(diffInTime / (1000 * 60 * 60));
    }
    static WBS할당후경과일수계산한다(assignedDate, currentDate) {
        const now = currentDate || new Date();
        const diffInTime = now.getTime() - assignedDate.getTime();
        return Math.floor(diffInTime / (1000 * 60 * 60 * 24));
    }
    static 최근WBS할당인가(assignedDate, currentDate) {
        const elapsedHours = this.WBS할당후경과시간계산한다(assignedDate, currentDate);
        return elapsedHours <= 24;
    }
    static 오래된WBS할당인가(assignedDate, currentDate) {
        const elapsedDays = this.WBS할당후경과일수계산한다(assignedDate, currentDate);
        return elapsedDays >= 7;
    }
    static 평가기간별그룹화한다(assignments) {
        return assignments.reduce((groups, assignment) => {
            const { periodId } = assignment;
            if (!groups[periodId]) {
                groups[periodId] = [];
            }
            groups[periodId].push(assignment);
            return groups;
        }, {});
    }
    static 직원별그룹화한다(assignments) {
        return assignments.reduce((groups, assignment) => {
            const { employeeId } = assignment;
            if (!groups[employeeId]) {
                groups[employeeId] = [];
            }
            groups[employeeId].push(assignment);
            return groups;
        }, {});
    }
    static 프로젝트별그룹화한다(assignments) {
        return assignments.reduce((groups, assignment) => {
            const { projectId } = assignment;
            if (!groups[projectId]) {
                groups[projectId] = [];
            }
            groups[projectId].push(assignment);
            return groups;
        }, {});
    }
    static WBS항목별그룹화한다(assignments) {
        return assignments.reduce((groups, assignment) => {
            const { wbsItemId } = assignment;
            if (!groups[wbsItemId]) {
                groups[wbsItemId] = [];
            }
            groups[wbsItemId].push(assignment);
            return groups;
        }, {});
    }
    static WBS할당일기준정렬한다(assignments, order = 'DESC') {
        return [...assignments].sort((a, b) => {
            const dateA = new Date(a.assignedDate).getTime();
            const dateB = new Date(b.assignedDate).getTime();
            return order === 'ASC' ? dateA - dateB : dateB - dateA;
        });
    }
    static 기간내WBS할당필터링한다(assignments, startDate, endDate) {
        return assignments.filter((assignment) => {
            const assignedDate = new Date(assignment.assignedDate);
            return assignedDate >= startDate && assignedDate <= endDate;
        });
    }
    static WBS할당통계계산한다(assignments) {
        const uniquePeriods = new Set(assignments.map((a) => a.periodId));
        const uniqueEmployees = new Set(assignments.map((a) => a.employeeId));
        const uniqueProjects = new Set(assignments.map((a) => a.projectId));
        const uniqueWbsItems = new Set(assignments.map((a) => a.wbsItemId));
        const recentCount = assignments.filter((a) => this.최근WBS할당인가(a.assignedDate)).length;
        const oldCount = assignments.filter((a) => this.오래된WBS할당인가(a.assignedDate)).length;
        return {
            totalCount: assignments.length,
            periodCount: uniquePeriods.size,
            employeeCount: uniqueEmployees.size,
            projectCount: uniqueProjects.size,
            wbsItemCount: uniqueWbsItems.size,
            recentCount,
            oldCount,
        };
    }
    static WBS할당ID목록생성한다(assignments) {
        return assignments.map((assignment) => assignment.id);
    }
    static 중복WBS할당찾기(assignments) {
        const groups = assignments.reduce((acc, assignment) => {
            const key = this.WBS할당고유키생성한다(assignment.periodId, assignment.employeeId, assignment.projectId, assignment.wbsItemId);
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(assignment);
            return acc;
        }, {});
        return Object.fromEntries(Object.entries(groups).filter(([_, assignments]) => assignments.length > 1));
    }
    static 프로젝트직원매트릭스생성한다(assignments) {
        const matrix = {};
        assignments.forEach((assignment) => {
            const { projectId, employeeId, wbsItemId } = assignment;
            if (!matrix[projectId]) {
                matrix[projectId] = {};
            }
            if (!matrix[projectId][employeeId]) {
                matrix[projectId][employeeId] = [];
            }
            if (!matrix[projectId][employeeId].includes(wbsItemId)) {
                matrix[projectId][employeeId].push(wbsItemId);
            }
        });
        return matrix;
    }
    static 직원별작업부하계산한다(assignments) {
        const workload = {};
        assignments.forEach((assignment) => {
            const { employeeId, projectId, wbsItemId } = assignment;
            if (!workload[employeeId]) {
                workload[employeeId] = {
                    totalAssignments: 0,
                    projectCount: 0,
                    wbsItemCount: 0,
                };
            }
            workload[employeeId].totalAssignments++;
        });
        Object.keys(workload).forEach((employeeId) => {
            const employeeAssignments = assignments.filter((a) => a.employeeId === employeeId);
            const uniqueProjects = new Set(employeeAssignments.map((a) => a.projectId));
            const uniqueWbsItems = new Set(employeeAssignments.map((a) => a.wbsItemId));
            workload[employeeId].projectCount = uniqueProjects.size;
            workload[employeeId].wbsItemCount = uniqueWbsItems.size;
        });
        return workload;
    }
    static WBS계층정보추출한다(wbsCode) {
        const parts = wbsCode.split('.');
        const level = parts.length;
        const parentCode = level > 1 ? parts.slice(0, -1).join('.') : null;
        return {
            level,
            parentCode,
            isLeaf: true,
            depth: level - 1,
        };
    }
    static WBS할당유효성검증한다(assignment) {
        const errors = [];
        if (!assignment.periodId?.trim()) {
            errors.push('평가기간 ID가 필요합니다.');
        }
        if (!assignment.employeeId?.trim()) {
            errors.push('직원 ID가 필요합니다.');
        }
        if (!assignment.projectId?.trim()) {
            errors.push('프로젝트 ID가 필요합니다.');
        }
        if (!assignment.wbsItemId?.trim()) {
            errors.push('WBS 항목 ID가 필요합니다.');
        }
        if (!assignment.assignedDate || isNaN(assignment.assignedDate.getTime())) {
            errors.push('유효한 할당일이 필요합니다.');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.WbsAssignmentUtils = WbsAssignmentUtils;
//# sourceMappingURL=wbs-assignment.utils.js.map