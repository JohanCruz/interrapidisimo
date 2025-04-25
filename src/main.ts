// src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { dataSource } from "./typeorm/data-source";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuración de CORS
  app.enableCors({
    origin: ['http://localhost:4200'], // Puerto por defecto de Angular
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  });

  app.setGlobalPrefix('api'); // Todas las rutas comenzarán con /api

  // Inicializa el DataSource con las variables de entorno
  await dataSource.initialize();
  console.log("Database connected");

  await app.listen(3000);
}
bootstrap();
