import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Body() studentData: { name: string; email: string; password: string }) {
    // Primero creamos el usuario
    const userData = await this.usersService.create({
      name: studentData.name,
      email: studentData.email,
      password: studentData.password
    });

    // Buscamos el usuario completo para crear el estudiante
    const user = await this.usersService.findById(userData.id);

    // Luego creamos el estudiante con el usuario creado
    const student = await this.studentsService.create({ user });

    return {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      studentId: student.id,
      totalCredits: student.totalCredits
    };
  }

  @Get()
  async findAll() {
    return await this.studentsService.findAll();
  }

  @Get('check-db')
  async checkDatabase() {
    return await this.studentsService.checkDatabaseConnection();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.studentsService.findOne(+id);
  }

  @Get(':id/subjects')
  @UseGuards(JwtAuthGuard)
  async getEnrolledSubjects(@Param('id') id: string) {
    // El ID que recibimos es el ID del usuario, no el ID del estudiante
    return await this.studentsService.getEnrolledSubjects(+id);
  }

  @Post(':id/subjects/:subjectId/enroll')
  @UseGuards(JwtAuthGuard)
  async enrollSubject(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
  ) {
    console.log('Recibida solicitud de inscripción:', { studentId: id, subjectId });
    const result = await this.studentsService.enrollSubject(+id, +subjectId);
    console.log('Resultado de inscripción:', result);
    return result;
  }

  @Post(':id/subjects/:subjectId/drop')
  @UseGuards(JwtAuthGuard)
  async dropSubject(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
  ) {
    return await this.studentsService.dropSubject(+id, +subjectId);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  async getStudentStats(@Param('id') id: string) {
    return await this.studentsService.getStudentStats(+id);
  }

  @Get('debug/:id')
  async debugStudent(@Param('id') id: string) {
    return await this.studentsService.debugStudent(+id);
  }

  @Get(':id/subjects/:subjectId/classmates')
  @UseGuards(JwtAuthGuard)
  async getClassmates(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
  ) {
    console.log('Obteniendo compañeros de clase para el usuario:', id, 'en la materia:', subjectId);
    return await this.studentsService.getClassmates(+id, +subjectId);
  }
} 