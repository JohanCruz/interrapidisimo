import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Student } from '../../students/entities/student.entity';
import { Repository } from 'typeorm';

describe('API Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let teacherRepository: Repository<Teacher>;
  let subjectRepository: Repository<Subject>;
  let studentRepository: Repository<Student>;
  let authToken: string;
  let testUserId: number;
  let testTeacherId: number;
  let testSubjectId: number;
  let testStudentId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get(getRepositoryToken(User));
    teacherRepository = moduleFixture.get(getRepositoryToken(Teacher));
    subjectRepository = moduleFixture.get(getRepositoryToken(Subject));
    studentRepository = moduleFixture.get(getRepositoryToken(Student));

    await app.init();
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testSubjectId) await subjectRepository.delete(testSubjectId);
    if (testTeacherId) await teacherRepository.delete(testTeacherId);
    if (testStudentId) await studentRepository.delete(testStudentId);
    if (testUserId) await userRepository.delete(testUserId);
    await app.close();
  });

  describe('Auth Tests', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@test.com',
          password: 'test123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      authToken = response.body.token;
      testUserId = response.body.id;
    });

    it('should login with registered user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'test123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should fail login with wrong credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Users Tests', () => {
    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'test123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should get user by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testUserId);
    });
  });

  describe('Teachers Tests', () => {
    it('should create a new teacher', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/teachers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId
        });

      expect(response.status).toBe(201);
      testTeacherId = response.body.id;
    });

    it('should get all teachers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/teachers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get a specific teacher', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/teachers/${testTeacherId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testTeacherId);
    });

    it('should update a teacher', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/teachers/${testTeacherId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Teacher Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Teacher Name');
    });

    it('should delete a teacher', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/teachers/${testTeacherId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      testTeacherId = null;
    });

    it('should get teacher subjects', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/teachers/${testTeacherId}/subjects`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Students Tests', () => {
    it('should create a new student', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/students/registro')
        .send({
          name: 'Test Student',
          email: 'student@test.com',
          password: 'test123'
        });

      expect(response.status).toBe(201);
      testStudentId = response.body.id;
    });

    it('should get all students', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/students')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get student stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/students/${testStudentId}/stats`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
    });

    it('should delete a student', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/students/${testStudentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      testStudentId = null;
    });
  });

  describe('Subjects Tests', () => {
    it('should create a new subject', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/subjects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Subject',
          teacherId: testTeacherId,
          schedule: 'Lunes 8:00-10:00',
          maxStudents: 30
        });

      expect(response.status).toBe(201);
      testSubjectId = response.body.id;
    });

    it('should get all subjects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/subjects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get a specific subject', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/subjects/${testSubjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testSubjectId);
    });

    it('should update a subject', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/subjects/${testSubjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Subject',
          schedule: 'Martes 10:00-12:00'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Test Subject');
    });

    it('should get subject stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/subjects/${testSubjectId}/stats`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
    });

    it('should delete a subject', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/subjects/${testSubjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      testSubjectId = null;
    });
  });
}); 