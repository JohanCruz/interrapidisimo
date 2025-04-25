import { Controller, Post, Body } from '@nestjs/common';
import { SeedersService } from './seeders.service'; 

@Controller('seeders')
export class SeedersController {
  constructor(private readonly seedersService: SeedersService) {}

  @Post()
  async createSeeders(
    @Body()
    data: {
      cursos: string[];
      usuarios: number;
      estudiantes: number;
      profesores: number;
    },
  ) {
    return await this.seedersService.createSeeders(data);
  }
}