import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    private jwtService: JwtService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async comparePasswords(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }

  async validateStudent(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['student']
    });

    if (!user || !user.student) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  async validateTeacher(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['teacher']
    });

    if (!user || !user.teacher) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  async loginStudent(email: string, password: string) {
    const user = await this.validateStudent(email, password);
    
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email
    });

    await this.userRepository.update(user.id, { token });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      token,
      studentId: user.student.id,
      totalCredits: user.student.totalCredits
    };
  }

  async loginTeacher(email: string, password: string) {
    const user = await this.validateTeacher(email, password);
    
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email
    });

    await this.userRepository.update(user.id, { token });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      token,
      teacherId: user.teacher.id,
      totalSubjects: user.teacher.totalSubjects
    };
  }

  async checkEmailExists(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new UnauthorizedException('El correo electrónico ya está en uso');
    }
    return false;
  }
} 