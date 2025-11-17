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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUnregisteredEmployeesHandler = exports.GetUnregisteredEmployeesQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_employee_mapping_entity_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../../../../domain/common/department/department.entity");
class GetUnregisteredEmployeesQuery {
    evaluationPeriodId;
    constructor(evaluationPeriodId) {
        this.evaluationPeriodId = evaluationPeriodId;
    }
}
exports.GetUnregisteredEmployeesQuery = GetUnregisteredEmployeesQuery;
let GetUnregisteredEmployeesHandler = class GetUnregisteredEmployeesHandler {
    mappingRepository;
    employeeRepository;
    constructor(mappingRepository, employeeRepository) {
        this.mappingRepository = mappingRepository;
        this.employeeRepository = employeeRepository;
    }
    async execute(query) {
        const { evaluationPeriodId } = query;
        const registeredEmployeeIds = await this.mappingRepository
            .createQueryBuilder('mapping')
            .select('mapping.employeeId', 'employeeId')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.deletedAt IS NULL')
            .getRawMany()
            .then((results) => results.map((result) => result.employeeId));
        const unregisteredEmployeesQuery = this.employeeRepository
            .createQueryBuilder('employee')
            .leftJoin(department_entity_1.Department, 'department', 'department.externalId = employee.departmentId AND department.deletedAt IS NULL')
            .select([
            'employee.id AS employee_id',
            'employee.employeeNumber AS employee_employeenumber',
            'employee.name AS employee_name',
            'employee.email AS employee_email',
            'employee.phoneNumber AS employee_phonenumber',
            'employee.status AS employee_status',
            'employee.departmentId AS employee_departmentid',
            'department.name AS department_name',
            'employee.rankName AS employee_rankname',
        ])
            .where('employee.deletedAt IS NULL')
            .andWhere('employee.status = :status', { status: '재직중' })
            .andWhere('employee.isExcludedFromList = :isExcludedFromList', {
            isExcludedFromList: false,
        });
        if (registeredEmployeeIds.length > 0) {
            unregisteredEmployeesQuery.andWhere('employee.id NOT IN (:...registeredIds)', {
                registeredIds: registeredEmployeeIds,
            });
        }
        const results = await unregisteredEmployeesQuery
            .orderBy('employee.name', 'ASC')
            .getRawMany();
        const employees = results.map((result) => ({
            id: result.employee_id,
            employeeNumber: result.employee_employeenumber,
            name: result.employee_name,
            email: result.employee_email,
            phoneNumber: result.employee_phonenumber,
            status: result.employee_status,
            departmentId: result.employee_departmentid,
            departmentName: result.department_name,
            rankName: result.employee_rankname,
        }));
        return {
            evaluationPeriodId,
            employees,
        };
    }
};
exports.GetUnregisteredEmployeesHandler = GetUnregisteredEmployeesHandler;
exports.GetUnregisteredEmployeesHandler = GetUnregisteredEmployeesHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetUnregisteredEmployeesQuery),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GetUnregisteredEmployeesHandler);
//# sourceMappingURL=get-unregistered-employees.handler.js.map