import { Controller, Post, Body } from '@nestjs/common';
import { SeedersService } from './seeders.service';

@Controller('seeders')
export class SeedersController {
  constructor(private readonly seedersService: SeedersService) {}

  @Post('test')
  async runTests(@Body('count') count: number = 10) {
    return this.seedersService.runTests(count);
  }

  @Post('')
  async seedData(@Body() data: { 
    cursos: string[];
    profesores: number;
    usuarios: number;
    estudiantes: number;
  }) {
    // Convertir los nombres de propiedades de español a inglés
    const convertedData = {
      courseNames: data.cursos,
      teachers: data.profesores,
      students: data.estudiantes,
      courses: data.cursos.length
    };
    
    return this.seedersService.seed(convertedData);
  }
}