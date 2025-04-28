import { Controller, Post, Body } from '@nestjs/common';
import { SeedersService } from './seeders.service';

@Controller('seeders')
export class SeedersController {
  constructor(private readonly seedersService: SeedersService) {}

  @Post()
  async seed(@Body() data: { 
    cursos: string[]; 
    profesores: number; 
    estudiantes: number 
  }) {
    return await this.seedersService.seed({
      courses: data.cursos.length,
      teachers: data.profesores,
      students: data.estudiantes,
      courseNames: data.cursos
    });
  }
}