import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Employee } from './employee.entity';
import { EmployeeRepository } from './employee.repository';
import { EmployeeSyncService } from './employee-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  providers: [EmployeeRepository, EmployeeSyncService],
  exports: [EmployeeRepository, EmployeeSyncService],
})
export class EmployeeModule {}
