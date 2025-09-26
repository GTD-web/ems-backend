import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Department } from './department.entity';
import { DepartmentRepository } from './department.repository';
import { DepartmentSyncService } from './department-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department]),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  providers: [DepartmentRepository, DepartmentSyncService],
  exports: [DepartmentRepository, DepartmentSyncService],
})
export class DepartmentModule {}
