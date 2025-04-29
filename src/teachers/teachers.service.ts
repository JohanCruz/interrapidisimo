import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { UsersService } from '../users/users.service';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    private usersService: UsersService,
  ) {
    
  }

  private transformTeacherResponse(teacher: Teacher) {
    return {
      id: teacher.id,
      name: teacher.user.name,
      email: teacher.user.email,
      totalSubjects: teacher.totalSubjects,
      subjects: teacher.subjects
    };
  }

  async create(createTeacherDto: CreateTeacherDto) {
    console.log('Creando profesor con datos:', createTeacherDto);
    
    // Primero creamos el usuario
    const user = await this.usersService.create({
      name: createTeacherDto.name,
      email: createTeacherDto.email,
      password: createTeacherDto.password,
      role: 'teacher'
    });

    console.log('Usuario creado:', user.id);

    // Luego creamos el profesor
    const teacher = this.teacherRepository.create({
      user: user
    });

    const savedTeacher = await this.teacherRepository.save(teacher);
    console.log('Profesor creado:', savedTeacher.id);
    
    return this.transformTeacherResponse(savedTeacher);
  }

  async findAll() {
    const teachers = await this.teacherRepository.find({
      relations: ['user', 'subjects']
    });
    return teachers.map(teacher => this.transformTeacherResponse(teacher));
  }

  async findOne(id: number) {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user', 'subjects']
    });

    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado');
    }

    return this.transformTeacherResponse(teacher);
  }

  async update(id: number, updateTeacherDto: UpdateTeacherDto) {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado');
    }

    // Actualizar el usuario asociado
    if (updateTeacherDto.name || updateTeacherDto.email || updateTeacherDto.password) {
      await this.usersService.update(teacher.user.id, {
        name: updateTeacherDto.name,
        email: updateTeacherDto.email,
        password: updateTeacherDto.password
      });
    }

    // Recargar el profesor con los datos actualizados
    const updatedTeacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user', 'subjects']
    });

    return this.transformTeacherResponse(updatedTeacher);
  }

  async getTeacherSubjects(id: number) {
    const teacher = await this.findOne(id);
    return teacher.subjects;
  }

  async updateTotalSubjects(id: number) {
    const teacher = await this.findOne(id);
    const totalSubjects = await this.subjectRepository.count({
      where: { teacher: { id } }
    });

    teacher.totalSubjects = totalSubjects;
    const updatedTeacher = await this.teacherRepository.save(teacher);
    return this.transformTeacherResponse(updatedTeacher);
  }

  async remove(id: number) {
    console.log('Buscando profesor para eliminar:', id);
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user', 'subjects']
    });

    if (!teacher) {
      console.log('Profesor no encontrado:', id);
      throw new NotFoundException('Profesor no encontrado');
    }

    console.log('Profesor encontrado:', teacher.id);

    // Primero desasociamos las materias del profesor
    if (teacher.subjects && teacher.subjects.length > 0) {
      console.log('Desasociando materias del profesor:', teacher.subjects.length);
      await this.subjectRepository.update(
        { teacher: { id } },
        { teacher: null }
      );
    }

    // Luego eliminamos el profesor
    console.log('Eliminando profesor');
    await this.teacherRepository.remove(teacher);

    // Finalmente eliminamos el usuario asociado
    if (teacher.user) {
      console.log('Eliminando usuario asociado:', teacher.user.id);
      await this.usersService.remove(teacher.user.id);
    }

    return {
      success: true,
      message: 'Profesor eliminado correctamente'
    };
  }
}
