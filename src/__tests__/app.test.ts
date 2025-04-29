import request from 'supertest';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

describe('App', () => {
  let app;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 on GET /', async () => {
    const response = await request(app.getHttpServer()).get('/');
    expect(response.status).toBe(200);
  });
}); 