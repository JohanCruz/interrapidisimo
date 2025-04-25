import { Subject } from 'src/subjects/entities/subject.entity';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    private authService: AuthService,
  ) {}

  async getEnrolledSubjects(studentId: number) {
    const student = await this.studentsRepository.findOne({
      where: { id: studentId },
      relations: {
        subjects: {
          teacher: true,
          students: true
        }
      }
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    return student.subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      teacher: subject.teacher,
      students: subject.students.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email
      }))
    }));
  }

  async enrollInSubject(studentId: number, subjectId: number) {
    // Buscar estudiante con sus materias actuales
    const student = await this.studentsRepository.findOne({
      where: { id: studentId },
      relations: {
        subjects: {
          teacher: true
        }
      }
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    // Verificar si ya está inscrito en 3 materias
    if (student.subjects.length >= 3) {
      throw new BadRequestException('Ya estás inscrito en el máximo de materias permitidas (3)');
    }

    // Buscar la materia a inscribir
    const subject = await this.subjectsRepository.findOne({
      where: { id: subjectId },
      relations: {
        teacher: true,
        students: true
      }
    });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    // Verificar si ya está inscrito en esta materia
    const alreadyEnrolled = student.subjects.some(s => s.id === subjectId);
    if (alreadyEnrolled) {
      throw new BadRequestException('Ya estás inscrito en esta materia');
    }

    // Verificar si ya tiene una materia con el mismo profesor
    const hasTeacher = student.subjects.some(s => s.teacher.id === subject.teacher.id);
    if (hasTeacher) {
      throw new BadRequestException('Ya tienes una materia con este profesor');
    }

    // Inscribir al estudiante
    student.subjects.push(subject);
    await this.studentsRepository.save(student);

    return {
      message: 'Inscripción exitosa',
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        credits: subject.credits,
        teacher: subject.teacher
      }
    };
  }

  async unenrollFromSubject(studentId: number, subjectId: number) {
    // Buscar estudiante con sus materias
    const student = await this.studentsRepository.findOne({
      where: { id: studentId },
      relations: {
        subjects: true
      }
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    // Verificar si está inscrito en la materia
    const subjectIndex = student.subjects.findIndex(s => s.id === subjectId);
    if (subjectIndex === -1) {
      throw new NotFoundException('No estás inscrito en esta materia');
    }

    // Remover la materia
    student.subjects = student.subjects.filter(s => s.id !== subjectId);
    await this.studentsRepository.save(student);

    return {
      message: 'Inscripción cancelada exitosamente'
    };
  }

  async registrarEstudiante(studentData: any) {
    await this.authService.checkEmailExists(studentData.email);
    
    if (studentData.password.length !== 5) {
      throw new BadRequestException('La contraseña debe tener exactamente 5 caracteres');
    }

    const hashedPassword = await bcrypt.hash(studentData.password, 10);
    const student = this.studentsRepository.create({
      ...studentData,
      password: hashedPassword
    });
    return await this.studentsRepository.save(student);
  }

  async inscribirMaterias(studentId: number, subjectIds: number[]) {
    if (subjectIds.length > 3) {
      throw new BadRequestException('Solo se pueden seleccionar 3 materias');
    }

    const student = await this.studentsRepository.findOne({
      where: { id: studentId },
      relations: ['subjects', 'subjects.Teacher'],
    });

    const subjects = await this.subjectsRepository.findByIds(subjectIds);

    // Verificar que no haya materias con el mismo Teacher
    const teachersIds = new Set();
    for (const subject of subjects) {
      if (teachersIds.has(subject.teacher.id)) {
        throw new BadRequestException('No puedes tener clases con el mismo Teacher');
      }
      teachersIds.add(subject.teacher.id);
    }

    student.subjects = subjects;
    student.totalCredits = subjects.length * 3;

    return await this.studentsRepository.save(student);
  }

  async obtenerCompanerosClase(studentId: number) {
    const student = await this.studentsRepository.findOne({
      where: { id: studentId },
      relations: ['subjects', 'subjects.students'],
    });

    const companerosPorMateria = {};
    for (const subject of student.subjects) {
      companerosPorMateria[subject.name] = subject.students
        .filter(e => e.id !== studentId)
        .map(e => e.name);
    }

    return companerosPorMateria;
  }

  async obtenerTodosEstudiantes() {
    return await this.studentsRepository.find({
      relations: ['subjects'],
    });
  }
} 