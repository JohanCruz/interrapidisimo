import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async create(userData: { name: string; email: string; password: string }) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    const token = this.jwtService.sign({
      sub: savedUser.id,
      email: savedUser.email
    });

    await this.usersRepository.update(savedUser.id, { token });

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      token
    };
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(id: number, updateData: { name?: string; email?: string; password?: string }) {
    const user = await this.findById(id);

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateData.email }
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    const updateFields: any = {};
    
    if (updateData.name) {
      updateFields.name = updateData.name;
    }
    
    if (updateData.email) {
      updateFields.email = updateData.email;
    }
    
    if (updateData.password) {
      updateFields.password = await bcrypt.hash(updateData.password, 10);
    }

    await this.usersRepository.update(id, updateFields);

    return this.findById(id);
  }

  async updateToken(id: number, token: string) {
    await this.usersRepository.update(id, { token });
  }
} 