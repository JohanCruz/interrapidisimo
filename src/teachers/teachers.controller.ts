import { Controller, Get, Post, Put, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  async create(@Body() createTeacherDto: CreateTeacherDto) {
    console.log('Recibida solicitud de creación de profesor:', createTeacherDto);
    const result = await this.teachersService.create(createTeacherDto);
    console.log('Resultado de creación:', result);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.teachersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(+id, updateTeacherDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/subjects')
  getTeacherSubjects(@Param('id') id: string) {
    return this.teachersService.getTeacherSubjects(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    console.log('Intentando eliminar profesor:', id);
    const result = await this.teachersService.remove(+id);
    console.log('Resultado de eliminación:', result);
    return result;
  }
}