import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Employee } from './employee.entity';
import { EmployeeRepository } from './employee.repository';
import { EmployeeSyncService } from './employee-sync.service';
import { EmployeeService } from './employee.service';
import { EmployeeTestService } from './employee-test.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    EmployeeRepository,
    EmployeeSyncService,
    EmployeeService,
    EmployeeTestService,
  ],
  exports: [
    EmployeeRepository,
    EmployeeSyncService,
    EmployeeService,
    EmployeeTestService,
  ],
})
export class EmployeeModule {}
