import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async create(userData: { name: string; email: string; password: string; role?: string }) {
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
      role: userData.role || 'student'
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

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async updateToken(id: number, token: string) {
    await this.usersRepository.update(id, { token });
  }

  async remove(id: number) {
    console.log('Buscando usuario para eliminar:', id);
    const user = await this.usersRepository.findOne({
      where: { id }
    });

    if (!user) {
      console.log('Usuario no encontrado:', id);
      throw new NotFoundException('Usuario no encontrado');
    }

    console.log('Usuario encontrado:', user.id);
    console.log('Eliminando usuario');
    await this.usersRepository.remove(user);

    return {
      success: true,
      message: 'Usuario eliminado correctamente'
    };
  }
} 