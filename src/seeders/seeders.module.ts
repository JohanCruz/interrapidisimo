import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedersController } from './seeders.controller';
import { SeedersService } from './seeders.service';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Teacher, Subject, User])
  ],
  controllers: [SeedersController],
  providers: [SeedersService]
})
export class SeedersModule {}