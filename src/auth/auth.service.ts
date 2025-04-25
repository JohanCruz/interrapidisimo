import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    private jwtService: JwtService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async comparePasswords(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }

  async validateStudent(email: string, password: string) {
    const student = await this.studentsRepository.findOne({ where: { email } });
    if (!student || !(await this.comparePasswords(password, student.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return student;
  }

  async validateTeacher(email: string, password: string) {
    console.log('Intentando validar profesor:', email);
    const teacher = await this.teachersRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'name'] // Importante: incluir password
    });

    console.log('Profesor encontrado:', teacher);

    if (!teacher) {
      console.log('Profesor no encontrado');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, teacher.password);
    console.log('¿Contraseña válida?:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Contraseña incorrecta');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return teacher;
  }

  async loginStudent(email: string, password: string) {
    const student = await this.validateStudent(email, password);
    const payload = { sub: student.id, email: student.email, role: 'student' };
    const token = this.jwtService.sign(payload);
    
    student.token = token;
    await this.studentsRepository.save(student);
    
    return { token };
  }

  async loginTeacher(email: string, password: string) {
    try {
      const teacher = await this.validateTeacher(email, password);
      const payload = { sub: teacher.id, email: teacher.email, role: 'teacher' };
      const token = this.jwtService.sign(payload);
      
      // Actualizar el token en la base de datos
      await this.teachersRepository.update(teacher.id, { token });
      
      return { 
        token,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email
        }
      };
    } catch (error) {
      console.log('Error en login:', error);
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  async checkEmailExists(email: string) {
    const student = await this.studentsRepository.findOne({ where: { email } });
    const teacher = await this.teachersRepository.findOne({ where: { email } });
    
    if (student || teacher) {
      throw new BadRequestException('El correo electrónico ya está en uso');
    }
    return false;
  }
} 