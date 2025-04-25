import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './entities/teacher.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher, Subject]),
    AuthModule
  ],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TypeOrmModule],
})
export class TeachersModule {} 