import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/student')
  async loginStudent(@Body() loginData: { email: string; password: string }) {
    try {
      return await this.authService.loginStudent(loginData.email, loginData.password);
    } catch (error) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  @Post('login/teacher')
  async loginTeacher(@Body() loginData: { email: string; password: string }) {
    //console.log('Intento de login con:', loginData.email);
    try {
      const result = await this.authService.loginTeacher(loginData.email, loginData.password);
      //console.log('Login exitoso:', result);
      return result;
    } catch (error) {
      console.log('Error en login controller:', error);
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  @Post('check-email')
  async checkEmail(@Body() data: { email: string }) {
    return await this.authService.checkEmailExists(data.email);
  }
} 