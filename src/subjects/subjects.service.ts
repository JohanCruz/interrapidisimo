import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { Teacher } from '../teachers/entities/teacher.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
  ) {}

  private async validateTeacherSubjectsLimit(teacherId: number, currentSubjectId?: number): Promise<void> {
    if (!teacherId) return; // Si no hay profesor, no necesitamos validar

    const subjectsCount = await this.subjectRepository.count({
      where: {
        teacher: { id: teacherId },
        ...(currentSubjectId && { id: Not(currentSubjectId) })
      }
    });

    if (subjectsCount >= 2) {
      throw new BadRequestException('Un profesor no puede tener más de 2 materias asignadas');
    }
  }

  async create(createSubjectDto: any) {
    const teacher = await this.teacherRepository.findOne({
      where: { id: createSubjectDto.teacherId },
      relations: ['user']
    });

    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado');
    }

    const subject = this.subjectRepository.create({
      ...createSubjectDto,
      teacher
    });

    await this.teacherRepository.update(teacher.id, {
      totalSubjects: teacher.totalSubjects + 1
    });

    return this.subjectRepository.save(subject);
  }

  async findAll() {
    console.log('Obteniendo todas las materias');
    
    const subjects = await this.subjectRepository.find({
      relations: [
        'teacher',
        'teacher.user',
        'students',
        'students.user'
      ]
    });

    console.log('Materias encontradas:', subjects.length);
    subjects.forEach(subject => {
      console.log('Detalles de materia:', {
        id: subject.id,
        name: subject.name,
        credits: subject.credits,
        teacherId: subject.teacher?.id,
        teacherName: subject.teacher?.user?.name,
        studentsCount: subject.students?.length
      });
    });

    return subjects;
  }

  async findOne(id: number) {
    console.log('Obteniendo materia con ID:', id);
    
    const subject = await this.subjectRepository.findOne({
      where: { id },
      relations: ['teacher', 'teacher.user', 'students', 'students.user']
    });

    if (!subject) {
      console.log('Materia no encontrada');
      throw new NotFoundException('Materia no encontrada');
    }

    console.log('Materia encontrada:', {
      id: subject.id,
      name: subject.name,
      credits: subject.credits,
      teacherId: subject.teacher?.id,
      teacherName: subject.teacher?.user?.name,
      studentsCount: subject.students?.length
    });

    return subject;
  }

  async getSubjectStats(id: number) {
    const subject = await this.findOne(id);
    return subject;
  }

  async update(id: number, updateSubjectDto: any) {
    const subject = await this.findOne(id);

    if (updateSubjectDto.teacherId) {
      const teacher = await this.teacherRepository.findOne({
        where: { id: updateSubjectDto.teacherId },
        relations: ['user']
      });

      if (!teacher) {
        throw new NotFoundException('Profesor no encontrado');
      }

      // Actualizar totalSubjects del profesor anterior
      await this.teacherRepository.update(subject.teacher.id, {
        totalSubjects: subject.teacher.totalSubjects - 1
      });

      // Actualizar totalSubjects del nuevo profesor
      await this.teacherRepository.update(teacher.id, {
        totalSubjects: teacher.totalSubjects + 1
      });

      subject.teacher = teacher;
    }

    Object.assign(subject, updateSubjectDto);
    return this.subjectRepository.save(subject);
  }

  async remove(id: number) {
    const subject = await this.findOne(id);
    console.log("encontrando id",id, subject);
    
    // Eliminar todas las suscripciones de estudiantes
    if (subject.students && subject.students.length > 0) {
      subject.students = [];
      await this.subjectRepository.save(subject);
    }

    console.log("eliminadas las suscripciones");
    
    
    
    console.log("eliminadas las suscripciones 2");
    await this.subjectRepository.remove(subject);
    return { message: 'Materia eliminada exitosamente' };
  }

  async getAvailableSubjects() {
    console.log('Obteniendo todas las materias disponibles');
    
    const subjects = await this.subjectRepository.find({
      relations: ['teacher', 'teacher.user', 'students', 'students.user']
    });
    
    console.log('Materias encontradas:', subjects.length);
    subjects.forEach(subject => {
      console.log('Detalles de materia disponible:', {
        id: subject.id,
        name: subject.name,
        credits: subject.credits,
        teacherId: subject.teacher?.id,
        teacherName: subject.teacher?.user?.name,
        studentsCount: subject.students?.length
      });
    });
    
    return subjects;
  }
}
