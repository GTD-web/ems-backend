import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Department } from './department.entity';
import { DepartmentRepository } from './department.repository';
import { DepartmentSyncService } from './department-sync.service';
import { DepartmentService } from './department.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department]),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  providers: [DepartmentRepository, DepartmentSyncService, DepartmentService],
  exports: [DepartmentRepository, DepartmentSyncService, DepartmentService],
})
export class DepartmentModule {}
