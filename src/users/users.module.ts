import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: 'tu_secreto_jwt', // En producción, usar variables de entorno
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {
  constructor() {
    //console.log('UsersModule initialized');
  }
} 