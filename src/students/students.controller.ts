import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly estudiantesService: StudentsService) {}

  @Post('registro')
  async registrarEstudiante(@Body() estudianteData: any) {
    return await this.estudiantesService.registrarEstudiante(estudianteData);
  }

  @Get(':id/subjects')
  getEnrolledSubjects(@Param('id') id: number) {
    return this.estudiantesService.getEnrolledSubjects(id);
  }

  @Post(':id/inscribir-materias')
  async enrollInSubject(
    @Param('id') studentId: number,
    @Body() body: { subjectId: number }
  ) {
    return this.estudiantesService.enrollInSubject(studentId, body.subjectId);
  }

  @Delete(':studentId/subjects/:subjectId')
  async unenrollFromSubject(
  @Param('studentId', ParseIntPipe) studentId: number,
  @Param('subjectId', ParseIntPipe) subjectId: number
  ) {
    return this.estudiantesService.unenrollFromSubject(studentId, subjectId);
  }

  @Get(':id/companeros')
  async obtenerCompanerosClase(@Param('id') id: number) {
    return await this.estudiantesService.obtenerCompanerosClase(id);
  }

  @Get()
  async obtenerTodosEstudiantes() {
    return await this.estudiantesService.obtenerTodosEstudiantes();
  }
} 