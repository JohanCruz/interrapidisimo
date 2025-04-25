import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { AuthService } from '../auth/auth.service';

@Controller('teachers')
export class TeachersController {
  constructor(
    private readonly teachersService: TeachersService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(@Body() teacherData: any) {
    if (teacherData.password.length !== 5) {
      throw new BadRequestException('La contraseña debe tener exactamente 5 caracteres');
    }
    await this.authService.checkEmailExists(teacherData.email);
    return this.teachersService.create(teacherData);
  }

  @Get()
  findAll() {
    return this.teachersService.findAll({
      relations: ['subjects'],
      select: {
        id: true,
        name: true,
        email: true,
        subjects: {
          id: true
        }
      }
    });
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.teachersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateData: any) {
    return this.teachersService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.teachersService.remove(id);
  }
}