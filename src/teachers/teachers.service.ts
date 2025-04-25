import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
  ) {}

  async create(teacherData: any) {
    const hashedPassword = await bcrypt.hash(teacherData.password, 10);
    const teacher = this.teachersRepository.create({
      ...teacherData,
      password: hashedPassword
    });
    return await this.teachersRepository.save(teacher);
  }

  async findAll(p0: { relations: string[]; select: { id: boolean; name: boolean; email: boolean; subjects: { id: boolean; }; }; }) {
    return await this.teachersRepository.find({
      select: ['id', 'name', 'email'],
      relations: ['subjects']
    });
  }

  async findOne(id: number) {
    const teacher = await this.teachersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email'],
      relations: ['subjects']
    });
    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado');
    }
    return teacher;
  }

  async update(id: number, updateData: any) {
    const teacher = await this.teachersRepository.findOne({ where: { id } });
    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado');
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(teacher, updateData);
    return await this.teachersRepository.save(teacher);
  }

  async remove(id: number) {
    const teacher = await this.findOne(id);
    return await this.teachersRepository.remove(teacher);
  }
}
