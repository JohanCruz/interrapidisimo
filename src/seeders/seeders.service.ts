import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedersService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async seed(data: { 
    courses: number; 
    teachers: number; 
    students: number;
    courseNames: string[];
  }) {
    // Limpiar datos existentes
    await this.subjectRepository.delete({});
    await this.studentRepository.delete({});
    await this.teacherRepository.delete({});
    await this.userRepository.delete({});

    // Crear profesores
    const teachers = [];
    for (let i = 0; i < data.teachers; i++) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await this.userRepository.save({
        name: `Profesor ${i + 1}`,
        email: `profesor${i + 1}@example.com`,
        password: hashedPassword
      });

      const teacher = await this.teacherRepository.save({
        user,
        totalSubjects: 0
      });
      teachers.push(teacher);
    }

    // Crear materias
    const subjects = [];
    for (let i = 0; i < data.courses; i++) {
      const teacher = teachers[Math.floor(Math.random() * teachers.length)];
      const subject = await this.subjectRepository.save({
        name: data.courseNames[i],
        credits: Math.floor(Math.random() * 3) + 1,
        teacher
      });
      subjects.push(subject);

      // Actualizar totalSubjects del profesor
      await this.teacherRepository.update(teacher.id, {
        totalSubjects: teacher.totalSubjects + 1
      });
    }

    // Crear estudiantes
    const students = [];
    for (let i = 0; i < data.students; i++) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await this.userRepository.save({
        name: `Estudiante ${i + 1}`,
        email: `estudiante${i + 1}@example.com`,
        password: hashedPassword
      });

      const student = await this.studentRepository.save({
        user,
        totalCredits: 0
      });
      students.push(student);

      // Asignar materias aleatorias al estudiante
      const numSubjects = Math.floor(Math.random() * 3) + 1;
      const enrolledSubjects = subjects
        .sort(() => Math.random() - 0.5)
        .slice(0, numSubjects);

      // Actualizar las materias del estudiante
      student.subjects = enrolledSubjects;
      await this.studentRepository.save(student);

      // Actualizar totalCredits del estudiante
      const totalCredits = enrolledSubjects.reduce((sum, subject) => sum + subject.credits, 0);
      await this.studentRepository.update(student.id, {
        totalCredits
      });
    }

    return {
      message: 'Datos sembrados exitosamente',
      teachers: teachers.length,
      subjects: subjects.length,
      students: students.length
    };
  }
}