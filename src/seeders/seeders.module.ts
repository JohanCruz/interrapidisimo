import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedersController } from './seeders.controller';
import { SeedersService } from './seeders.service'; 
import { Student } from '../students/entities/student.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity'; 
import { Subject } from '../subjects/entities/subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Teacher, Subject])],
  controllers: [SeedersController],
  providers: [SeedersService],
})
export class SeedersModule {}