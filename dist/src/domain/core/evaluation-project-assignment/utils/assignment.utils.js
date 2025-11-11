"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentUtils = void 0;
class AssignmentUtils {
    static 할당고유키생성한다(periodId, employeeId, projectId) {
        return `${periodId}:${employeeId}:${projectId}`;
    }
    static 할당고유키파싱한다(uniqueKey) {
        const parts = uniqueKey.split(':');
        if (parts.length !== 3) {
            throw new Error('유효하지 않은 할당 고유 키 형식입니다.');
        }
        return {
            periodId: parts[0],
            employeeId: parts[1],
            projectId: parts[2],
        };
    }
    static 할당날짜유효한가(assignedDate, periodStartDate, periodEndDate) {
        return assignedDate >= periodStartDate && assignedDate <= periodEndDate;
    }
    static 할당후경과시간계산한다(assignedDate, currentDate) {
        const now = currentDate || new Date();
        const diffInTime = now.getTime() - assignedDate.getTime();
        return Math.floor(diffInTime / (1000 * 60 * 60));
    }
    static 할당후경과일수계산한다(assignedDate, currentDate) {
        const now = currentDate || new Date();
        const diffInTime = now.getTime() - assignedDate.getTime();
        return Math.floor(diffInTime / (1000 * 60 * 60 * 24));
    }
    static 최근할당인가(assignedDate, currentDate) {
        const elapsedHours = this.할당후경과시간계산한다(assignedDate, currentDate);
        return elapsedHours <= 24;
    }
    static 오래된할당인가(assignedDate, currentDate) {
        const elapsedDays = this.할당후경과일수계산한다(assignedDate, currentDate);
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
    static 할당일기준정렬한다(assignments, order = 'DESC') {
        return [...assignments].sort((a, b) => {
            const dateA = new Date(a.assignedDate).getTime();
            const dateB = new Date(b.assignedDate).getTime();
            return order === 'ASC' ? dateA - dateB : dateB - dateA;
        });
    }
    static 기간내할당필터링한다(assignments, startDate, endDate) {
        return assignments.filter((assignment) => {
            const assignedDate = new Date(assignment.assignedDate);
            return assignedDate >= startDate && assignedDate <= endDate;
        });
    }
    static 할당통계계산한다(assignments) {
        const uniquePeriods = new Set(assignments.map((a) => a.periodId));
        const uniqueEmployees = new Set(assignments.map((a) => a.employeeId));
        const uniqueProjects = new Set(assignments.map((a) => a.projectId));
        const recentCount = assignments.filter((a) => this.최근할당인가(a.assignedDate)).length;
        const oldCount = assignments.filter((a) => this.오래된할당인가(a.assignedDate)).length;
        return {
            totalCount: assignments.length,
            periodCount: uniquePeriods.size,
            employeeCount: uniqueEmployees.size,
            projectCount: uniqueProjects.size,
            recentCount,
            oldCount,
        };
    }
    static 할당ID목록생성한다(assignments) {
        return assignments.map((assignment) => assignment.id);
    }
    static 중복할당찾기(assignments) {
        const groups = assignments.reduce((acc, assignment) => {
            const key = this.할당고유키생성한다(assignment.periodId, assignment.employeeId, assignment.projectId);
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(assignment);
            return acc;
        }, {});
        return Object.fromEntries(Object.entries(groups).filter(([_, assignments]) => assignments.length > 1));
    }
}
exports.AssignmentUtils = AssignmentUtils;
//# sourceMappingURL=assignment.utils.js.map