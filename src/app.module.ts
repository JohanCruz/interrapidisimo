// src/app.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dataSource } from "./typeorm/data-source";
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TeachersModule } from "./teachers/teachers.module"; 
import { ConfigModule } from '@nestjs/config';
import { SeedersModule } from './seeders/seeders.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

console.log(StudentsModule,
  SubjectsModule,
  TeachersModule,
  SeedersModule,
  AuthModule,
  UsersModule,);


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que esté disponible en todo el proyecto
    }),
    TypeOrmModule.forRoot({
      ...dataSource.options,
      autoLoadEntities: true,
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      // Configuración adicional para el pool de conexiones
      extra: {
        connectionLimit: 10,
        connectTimeout: 60000, // 60 segundos de timeout para la conexión
        acquireTimeout: 60000, // 60 segundos de timeout para adquirir una conexión
        waitForConnections: true, // Esperar a que haya conexiones disponibles
      },
    }),
    UsersModule,
    StudentsModule,
    SubjectsModule,
    TeachersModule,
    SeedersModule,
    AuthModule,
  ],
})
export class AppModule {}
