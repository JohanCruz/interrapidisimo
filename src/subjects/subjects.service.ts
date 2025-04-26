import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { Teacher } from '../teachers/entities/teacher.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
  ) {}

  private async validateTeacherSubjectsLimit(teacherId: number, currentSubjectId?: number): Promise<void> {
    if (!teacherId) return; // Si no hay profesor, no necesitamos validar

    const subjectsCount = await this.subjectsRepository.count({
      where: {
        teacher: { id: teacherId },
        ...(currentSubjectId && { id: Not(currentSubjectId) })
      }
    });

    if (subjectsCount >= 2) {
      throw new BadRequestException('Un profesor no puede tener más de 2 materias asignadas');
    }
  }

  async create(subjectData: any) {
    if (subjectData.teacher?.id) {
      await this.validateTeacherSubjectsLimit(subjectData.teacher.id);
    }

    const subject = this.subjectsRepository.create(subjectData);
    return await this.subjectsRepository.save(subject);
  }

  async findAll() {
    return this.subjectsRepository.find({
      relations: ['students', 'teacher'],
      select: {
        students:{
          id: true,
          name: true,
          email: true
        },
        teacher: {
          id: true,
          name: true,
          email: true
        }
      }
    });
  }

  async findOne(id: number) {
    const subject = await this.subjectsRepository.findOne({
      where: { id },
      relations: {
        teacher: true,
        students: true
      },
      select: {
        id: true,
        name: true,
        code: true,
        credits: true,
        teacher: {
          id: true,
          name: true,
          email: true
        },
        students: {
          id: true,
          name: true,
          email: true
        }
      }
    });

    if (!subject) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    // Formatear la respuesta para mejor legibilidad
    return {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      teacher: subject.teacher ? {
        id: subject.teacher.id,
        name: subject.teacher.name,
        email: subject.teacher.email
      } : null,
      studentsEnrolled: subject.students ? subject.students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email
      })) : [],
      totalStudents: subject.students ? subject.students.length : 0
    };
  }

  async update(id: number, updateData: any) {
    const subject = await this.subjectsRepository.findOne({
      where: { id },
      relations: { teacher: true }
    });

    if (!subject) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    if (updateData.teacher?.id) {
      await this.validateTeacherSubjectsLimit(updateData.teacher.id, id);
    }

    // Si el profesor está siendo removido (teacher: null) no necesitamos validar
    await this.subjectsRepository.save({
      ...subject,
      ...updateData
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const subject = await this.subjectsRepository.findOne({
        where: { id },
        relations: { teacher: true, students: true }
    });
    if (!subject) {
        throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }
    await this.subjectsRepository.remove(subject);
    return { message: `Materia ${subject.name} eliminada correctamente` };
  }

  // Método adicional para obtener estadísticas de la materia
  async getSubjectStats(id: number) {
    const subject = await this.subjectsRepository.findOne({
      where: { id },
      relations: { teacher: true, students: true }
    });

    if (!subject) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    return {
      subjectName: subject.name,
      subjectCode: subject.code,
      teacher: subject.teacher ? {
        name: subject.teacher.name,
        email: subject.teacher.email
      } : 'Sin profesor asignado',
      totalStudents: subject.students.length,
      studentsEnrolled: subject.students.map(student => ({
        name: student.name,
        email: student.email
      }))
    };
  }
}
