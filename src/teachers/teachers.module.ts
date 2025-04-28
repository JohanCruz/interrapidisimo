import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { Teacher } from './entities/teacher.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher, Subject, User]),
    UsersModule
  ],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService]
})
export class TeachersModule {
  constructor() {
    console.log('TeachersModule initialized');
  }
} 