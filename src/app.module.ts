// src/app.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dataSource } from "./typeorm/data-source";
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TeachersModule } from "./teachers/teacher.module"; 
import { ConfigModule } from '@nestjs/config';
import { SeedersModule } from './seeders/seeders.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que esté disponible en todo el proyecto
    }),
    TypeOrmModule.forRoot({
      ...dataSource.options,
      autoLoadEntities: true,
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
    }),
    StudentsModule,
    SubjectsModule,
    TeachersModule,
    SeedersModule,
    AuthModule,
  ],
})
export class AppModule {}
