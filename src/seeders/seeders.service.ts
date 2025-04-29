import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { AuthService } from '../auth/auth.service';
import { In } from 'typeorm';

@Injectable()
export class SeedersService {
  private baseUrl = 'http://localhost:3000/api';
  private token: string;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    private authService: AuthService,
    private httpService: HttpService
  ) {}

  private generateFakeUser() {
    return {
      email: faker.internet.email(),
      password: faker.internet.password(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    };
  }

  private generateFakeSubject() {
    return {
      name: faker.helpers.arrayElement(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography']),
      description: faker.lorem.paragraph(),
      credits: faker.number.int({ min: 3, max: 4 }),
    };
  }

  async runTests(count: number) {
    try {
      console.log(`Iniciando pruebas con ${count} registros por entidad...`);
      
      // Generar usuarios y sus roles correspondientes
      const users = await this.generateUsers(count);
      console.log(`Se generaron ${users.length} usuarios con sus roles`);

      // Obtener los profesores y estudiantes de los usuarios creados
      const teachers = await this.teacherRepository.find({
        where: { user: { id: In(users.filter(u => u.role === 'teacher').map(u => u.id)) } },
        relations: ['user']
      });
      console.log(`Se encontraron ${teachers.length} profesores`);

      const students = await this.studentRepository.find({
        where: { user: { id: In(users.filter(u => u.role === 'student').map(u => u.id)) } },
        relations: ['user', 'subjects']
      });
      console.log(`Se encontraron ${students.length} estudiantes`);

      // Crear materias de prueba primero
      const testTeacher1 = await this.createTestTeacher();
      const testTeacher2 = await this.createTestTeacher();
      const testSubject1 = await this.createTestSubject(testTeacher1.id);
      const testSubject2 = await this.createTestSubject(testTeacher2.id);
      console.log('Materias de prueba creadas:', { 
        testSubject1: { ...testSubject1, teacherId: testTeacher1.id },
        testSubject2: { ...testSubject2, teacherId: testTeacher2.id }
      });

      // Generar materias normales
      const subjects = await this.generateSubjects(count);
      console.log(`Se generaron ${subjects.length} materias`);

      // Asignar materias a estudiantes aleatoriamente, excluyendo las materias de prueba
      for (const student of students) {
        const numSubjects = Math.floor(Math.random() * 3) + 1;
        const availableSubjects = subjects.filter(s => 
          s.id !== testSubject1.id && s.id !== testSubject2.id
        );
        const enrolledSubjects = availableSubjects
          .sort(() => Math.random() - 0.5)
          .slice(0, numSubjects);
        
        student.subjects = enrolledSubjects;
        await this.studentRepository.save(student);
        
        // Actualizar totalCredits del estudiante
        const totalCredits = enrolledSubjects.reduce((sum, subject) => sum + subject.credits, 0);
        await this.studentRepository.update(student.id, {
          totalCredits
        });
      }

      // Realizar pruebas de endpoints
      const testResults = await this.testEndpointsWithData(users, teachers, students, subjects, testTeacher1, testTeacher2, testSubject1, testSubject2);

      // Limpiar todos los datos de prueba
      console.log('Limpiando datos de prueba...');
      
      // Primero desinscribir a todos los estudiantes de sus materias
      console.log('Desinscribiendo estudiantes de sus materias...');
      for (const student of students) {
        // Obtener el estudiante actualizado con sus materias
        const currentStudent = await this.studentRepository.findOne({
          where: { id: student.id },
          relations: ['subjects']
        });

        if (currentStudent && currentStudent.subjects.length > 0) {
          console.log(`Desinscribiendo estudiante ${currentStudent.id} de ${currentStudent.subjects.length} materias`);
          // Desinscribir de todas las materias
          currentStudent.subjects = [];
          await this.studentRepository.save(currentStudent);
          
          // Actualizar totalCredits a 0
          await this.studentRepository.update(currentStudent.id, {
            totalCredits: 0
          });
        }
      }
      console.log('Estudiantes desinscritos exitosamente');

      // Ahora podemos eliminar las materias
      console.log('Eliminando materias...');
      await this.subjectRepository.delete([...subjects.map(s => s.id), testSubject1.id, testSubject2.id]);
      console.log('Materias eliminadas exitosamente');
      
      // Eliminar los estudiantes
      console.log('Eliminando estudiantes...');
      await this.studentRepository.delete(students.map(s => s.id));
      console.log('Estudiantes eliminados exitosamente');
      
      // Eliminar los profesores
      console.log('Eliminando profesores...');
      await this.teacherRepository.delete([...teachers.map(t => t.id), testTeacher1.id, testTeacher2.id]);
      console.log('Profesores eliminados exitosamente');
      
      // Eliminar los usuarios
      console.log('Eliminando usuarios...');
      await this.userRepository.delete(users.map(u => u.id));
      console.log('Usuarios eliminados exitosamente');

      console.log('Datos de prueba limpiados exitosamente');

      return {
        message: 'Pruebas completadas exitosamente y datos limpiados',
        data: {
          users: users.length,
          teachers: teachers.length,
          students: students.length,
          subjects: subjects.length,
        },
        testResults
      };
    } catch (error) {
      console.error('Error en las pruebas:', error);
      throw new Error(`Error al ejecutar pruebas: ${error.message}`);
    }
  }

  private async testEndpointsWithData(
    users: User[], 
    teachers: Teacher[], 
    students: Student[], 
    subjects: Subject[],
    testTeacher1: Teacher,
    testTeacher2: Teacher,
    testSubject1: Subject,
    testSubject2: Subject
  ) {
    const results = [];
    
    // Buscar un usuario estudiante primero
    const studentUser = users.find(user => user.role === 'student');
    if (!studentUser) {
      console.error('No se encontró un usuario estudiante para las pruebas');
      return results;
    }

    // Obtener token de autenticación
    let authToken = '';
    try {
      // Buscar un usuario que sea profesor
      const teacherUser = users.find(user => user.role === 'teacher');
      if (!teacherUser) {
        throw new Error('No se encontró un usuario profesor para las pruebas');
      }

      // Intentar login como profesor
      const loginResponse = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth/login/teacher`, {
          email: teacherUser.email,
          password: 'password123'
        })
      ) as AxiosResponse;
      authToken = loginResponse.data.token;
    } catch (error) {
      console.error('Error al obtener token de autenticación como profesor:', error.message);
      // Si falla, intentar como estudiante
      try {
        const loginResponse = await firstValueFrom(
          this.httpService.post(`${this.baseUrl}/auth/login/student`, {
            email: studentUser.email,
            password: 'password123'
          })
        ) as AxiosResponse;
        authToken = loginResponse.data.token;
      } catch (error) {
        console.error('Error al obtener token de autenticación como estudiante:', error.message);
        return results;
      }
    }

    const headers = {
      Authorization: `Bearer ${authToken}`
    };

    // Probar endpoints de profesores
    try {
      const teacher = teachers[0];
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/teachers/${teacher.id}`, { headers })
      ) as AxiosResponse;
      results.push({
        endpoint: 'GET /api/teachers/:id',
        status: response.status === 200 ? 'ÉXITO' : 'FALLO',
        details: response.status === 200 ? 'Profesor encontrado correctamente' : 'Error al obtener profesor'
      });
    } catch (error) {
      results.push({
        endpoint: 'GET /api/teachers/:id',
        status: 'FALLO',
        details: error.message
      });
    }

    // Probar actualización de profesor
    try {
      const teacher = teachers[0];
      const updateData = {
        name: 'Profesor Actualizado',
        email: 'profesor.actualizado@test.com',
        department: 'Nuevo Departamento',
        salary: 50000
      };
      const response = await firstValueFrom(
        this.httpService.put(`${this.baseUrl}/teachers/${teacher.id}`, updateData, { headers })
      ) as AxiosResponse;
      results.push({
        endpoint: 'PUT /api/teachers/:id',
        status: response.status === 200 ? 'ÉXITO' : 'FALLO',
        details: response.status === 200 ? 'Profesor actualizado correctamente' : 'Error al actualizar profesor'
      });
    } catch (error) {
      results.push({
        endpoint: 'PUT /api/teachers/:id',
        status: 'FALLO',
        details: error.message
      });
    }

    // Probar obtener materias de un profesor
    try {
      const teacher = teachers[0];
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/teachers/${teacher.id}/subjects`, { headers })
      ) as AxiosResponse;
      results.push({
        endpoint: 'GET /api/teachers/:id/subjects',
        status: response.status === 200 ? 'ÉXITO' : 'FALLO',
        details: response.status === 200 ? 'Materias del profesor obtenidas correctamente' : 'Error al obtener materias del profesor'
      });
    } catch (error) {
      results.push({
        endpoint: 'GET /api/teachers/:id/subjects',
        status: 'FALLO',
        details: error.message
      });
    }

    // Probar endpoints de estudiantes
    try {
      const student = students[0];
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/students/${student.id}`, { headers })
      ) as AxiosResponse;
      results.push({
        endpoint: 'GET /api/students/:id',
        status: response.status === 200 ? 'ÉXITO' : 'FALLO',
        details: response.status === 200 ? 'Estudiante encontrado correctamente' : 'Error al obtener estudiante'
      });
    } catch (error) {
      results.push({
        endpoint: 'GET /api/students/:id',
        status: 'FALLO',
        details: error.message
      });
    }

    // Probar obtener materias inscritas de un estudiante
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/students/${studentUser.id}/subjects`, { headers })
      ) as AxiosResponse;
      results.push({
        endpoint: 'GET /api/students/:id/subjects',
        status: response.status === 200 ? 'ÉXITO' : 'FALLO',
        details: response.status === 200 ? 'Materias del estudiante obtenidas correctamente' : 'Error al obtener materias del estudiante'
      });
    } catch (error) {
      results.push({
        endpoint: 'GET /api/students/:id/subjects',
        status: 'FALLO',
        details: error.message
      });
    }

    // Probar endpoints de materias
    try {
      const subject = subjects[0];
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/subjects/${subject.id}`, { headers })
      ) as AxiosResponse;
      results.push({
        endpoint: 'GET /api/subjects/:id',
        status: response.status === 200 ? 'ÉXITO' : 'FALLO',
        details: response.status === 200 ? 'Materia encontrada correctamente' : 'Error al obtener materia'
      });
    } catch (error) {
      results.push({
        endpoint: 'GET /api/subjects/:id',
        status: 'FALLO',
        details: error.message
      });
    }

    // Probar actualización de materia
    try {
      const subject = subjects[0];
      const updateData = {
        name: 'Materia Actualizada',
        description: 'Nueva descripción de la materia',
        credits: 4,
        code: 'MAT001'
      };
      const response = await firstValueFrom(
        this.httpService.put(`${this.baseUrl}/subjects/${subject.id}`, updateData, { headers })
      ) as AxiosResponse;
      results.push({
        endpoint: 'PUT /api/subjects/:id',
        status: response.status === 200 ? 'ÉXITO' : 'FALLO',
        details: response.status === 200 ? 'Materia actualizada correctamente' : 'Error al actualizar materia'
      });
    } catch (error) {
      results.push({
        endpoint: 'PUT /api/subjects/:id',
        status: 'FALLO',
        details: error.message
      });
    }

    // Probar obtener estadísticas de una materia
    try {
      const subject = subjects[0];
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/subjects/${subject.id}/stats`, { headers })
      ) as AxiosResponse;
      results.push({
        endpoint: 'GET /api/subjects/:id/stats',
        status: response.status === 200 ? 'ÉXITO' : 'FALLO',
        details: response.status === 200 ? 'Estadísticas de la materia obtenidas correctamente' : 'Error al obtener estadísticas de la materia'
      });
    } catch (error) {
      results.push({
        endpoint: 'GET /api/subjects/:id/stats',
        status: 'FALLO',
        details: error.message
      });
    }

    // Probar obtener materias disponibles
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/subjects/available`, { headers })
      ) as AxiosResponse;
      results.push({
        endpoint: 'GET /api/subjects/available',
        status: response.status === 200 ? 'ÉXITO' : 'FALLO',
        details: response.status === 200 ? 'Materias disponibles obtenidas correctamente' : 'Error al obtener materias disponibles'
      });
    } catch (error) {
      results.push({
        endpoint: 'GET /api/subjects/available',
        status: 'FALLO',
        details: error.message
      });
    }

    // Probar endpoints de inscripción de materias
    try {
      // Verificar si el estudiante ya está inscrito en alguna de las materias de prueba
      const studentWithSubjects = await this.studentRepository.findOne({
        where: { id: studentUser.id },
        relations: ['subjects', 'subjects.teacher']
      });

      // Verificar si el estudiante ya tiene una materia con alguno de los profesores de prueba
      const hasTeacher1 = studentWithSubjects?.subjects?.some(s => s.teacher?.id === testTeacher1.id);
      const hasTeacher2 = studentWithSubjects?.subjects?.some(s => s.teacher?.id === testTeacher2.id);

      let subjectToEnroll;
      if (hasTeacher1) {
        // Si ya tiene materia con teacher1, usar subject2 (de teacher2)
        subjectToEnroll = testSubject2;
      } else if (hasTeacher2) {
        // Si ya tiene materia con teacher2, usar subject1 (de teacher1)
        subjectToEnroll = testSubject1;
      } else {
        // Si no tiene materia con ninguno, usar subject1
        subjectToEnroll = testSubject1;
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/students/${studentUser.id}/subjects/${subjectToEnroll.id}/enroll`,
          {},
          { headers }
        )
      ) as AxiosResponse;
      results.push({
        endpoint: 'POST /api/students/:id/subjects/:subjectId/enroll',
        status: response.status === 200 || response.status === 201 ? 'ÉXITO' : 'FALLO',
        details: response.status === 200 || response.status === 201 ? 'Inscripción exitosa' : 'Error al inscribir materia'
      });

      // Probar desinscripción de materia
      const dropResponse = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/students/${studentUser.id}/subjects/${subjectToEnroll.id}/drop`,
          {},
          { headers }
        )
      ) as AxiosResponse;
      results.push({
        endpoint: 'POST /api/students/:id/subjects/:subjectId/drop',
        status: dropResponse.data.success ? 'ÉXITO' : 'FALLO',
        details: dropResponse.data.success ? dropResponse.data.message : 'Error al desinscribir materia'
      });
    } catch (error) {
      results.push({
        endpoint: 'POST /api/students/:id/subjects/:subjectId/enroll',
        status: 'FALLO',
        details: error.message
      });
    }

    // Probar endpoints de eliminación
    // Eliminar profesor
    try {
      console.log('Intentando eliminar profesor:', teachers[1].id);
      const teacherToDelete = teachers[1];
      const deleteTeacherResponse = await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/teachers/${teacherToDelete.id}`, { headers })
      ) as AxiosResponse;
      console.log('Respuesta de eliminación de profesor:', deleteTeacherResponse.status);
      results.push({
        endpoint: 'DELETE /api/teachers/:id',
        status: deleteTeacherResponse.status === 200 ? 'ÉXITO' : 'FALLO',
        details: deleteTeacherResponse.status === 200 ? 'Profesor eliminado correctamente' : 'Error al eliminar profesor'
      });
    } catch (error) {
      console.error('Error al eliminar profesor:', error.message);
      results.push({
        endpoint: 'DELETE /api/teachers/:id',
        status: 'FALLO',
        details: `Error al eliminar profesor: ${error.message}`
      });
    }

    // Eliminar materia
    try {
      console.log('Intentando eliminar materia:', subjects[1].id);
      const subjectToDelete = subjects[1];
      const deleteSubjectResponse = await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/subjects/${subjectToDelete.id}`, { headers })
      ) as AxiosResponse;
      console.log('Respuesta de eliminación de materia:', deleteSubjectResponse.status);
      results.push({
        endpoint: 'DELETE /api/subjects/:id',
        status: deleteSubjectResponse.status === 200 ? 'ÉXITO' : 'FALLO',
        details: deleteSubjectResponse.status === 200 ? 'Materia eliminada correctamente' : 'Error al eliminar materia'
      });
    } catch (error) {
      console.error('Error al eliminar materia:', error.message);
      results.push({
        endpoint: 'DELETE /api/subjects/:id',
        status: 'FALLO',
        details: `Error al eliminar materia: ${error.message}`
      });
    }

    // Eliminar estudiante
    try {
      console.log('Intentando eliminar estudiante:', students[1].id);
      const studentToDelete = students[1];
      const deleteStudentResponse = await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/students/${studentToDelete.id}`, { headers })
      ) as AxiosResponse;
      console.log('Respuesta de eliminación de estudiante:', deleteStudentResponse.status);
      results.push({
        endpoint: 'DELETE /api/students/:id',
        status: deleteStudentResponse.status === 200 ? 'ÉXITO' : 'FALLO',
        details: deleteStudentResponse.status === 200 ? 'Estudiante eliminado correctamente' : 'Error al eliminar estudiante'
      });
    } catch (error) {
      console.error('Error al eliminar estudiante:', error.message);
      results.push({
        endpoint: 'DELETE /api/students/:id',
        status: 'FALLO',
        details: `Error al eliminar estudiante: ${error.message}`
      });
    }

    return results;
  }

  private async generateUsers(count: number): Promise<User[]> {
    const users: User[] = [];
    const roles = ['teacher', 'student'];
    
    for (let i = 0; i < count; i++) {
      const role = roles[i % 2];
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Crear el usuario
      const user = this.userRepository.create({
        email: faker.internet.email(),
        password: hashedPassword,
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        role: role,
      });
      const savedUser = await this.userRepository.save(user);

      // Crear el registro correspondiente según el rol
      if (role === 'teacher') {
        await this.teacherRepository.save({
          user: savedUser,
          department: faker.helpers.arrayElement(['Math', 'Science', 'History', 'English']),
          salary: faker.number.float({ min: 30000, max: 100000, precision: 2 }),
          totalSubjects: 0
        });
      } else {
        await this.studentRepository.save({
          user: savedUser,
          enrollmentDate: faker.date.past(),
          totalCredits: 0
        });
      }

      users.push(savedUser);
    }
    return users;
  }

  private async generateTeachers(count: number): Promise<Teacher[]> {
    const teachers: Teacher[] = [];
    for (let i = 0; i < count; i++) {
      try {
        // Primero crear el usuario
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = this.userRepository.create({
          email: faker.internet.email(),
          password: hashedPassword,
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          role: 'teacher'
        });
        const savedUser = await this.userRepository.save(user);

        // Crear el profesor
        const teacher = this.teacherRepository.create({
          user: savedUser,
          department: faker.helpers.arrayElement(['Math', 'Science', 'History', 'English']),
          salary: faker.number.float({ min: 30000, max: 100000, precision: 2 }),
          totalSubjects: 0
        });
        const savedTeacher = await this.teacherRepository.save(teacher);
        teachers.push(savedTeacher);
      } catch (error) {
        console.error(`Error al crear profesor ${i + 1}:`, error);
        throw error;
      }
    }
    return teachers;
  }

  private async generateStudents(count: number): Promise<Student[]> {
    const students: Student[] = [];
    for (let i = 0; i < count; i++) {
      try {
        // Primero crear el usuario
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = this.userRepository.create({
          email: faker.internet.email(),
          password: hashedPassword,
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          role: 'student'
        });
        const savedUser = await this.userRepository.save(user);

        // Crear el estudiante
        const student = this.studentRepository.create({
          user: savedUser,
          enrollmentDate: faker.date.past(),
          totalCredits: 0
        });
        const savedStudent = await this.studentRepository.save(student);
        students.push(savedStudent);
      } catch (error) {
        console.error(`Error al crear estudiante ${i + 1}:`, error);
        throw error;
      }
    }
    return students;
  }

  private async generateSubjects(count: number): Promise<Subject[]> {
    const subjects: Subject[] = [];
    const teachers = await this.teacherRepository.find();
    
    if (teachers.length === 0) {
      throw new Error('No hay profesores disponibles para asignar a las materias');
    }

    // Crear un mapa para rastrear las materias por profesor
    const teacherSubjectCount = new Map<number, number>();
    teachers.forEach(teacher => teacherSubjectCount.set(teacher.id, 0));

    // Lista de nombres de materias disponibles
    const availableSubjects = [
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 
      'History', 'Literature', 'Computer Science', 'Art',
      'Music', 'Physical Education', 'Geography', 'Economics'
    ];

    for (let i = 0; i < count; i++) {
      // Encontrar profesores que tengan menos de 2 materias
      const availableTeachers = teachers.filter(teacher => 
        teacherSubjectCount.get(teacher.id) < 2
      );

      if (availableTeachers.length === 0) {
        console.log('Todos los profesores ya tienen el máximo de materias asignadas');
        break;
      }

      // Seleccionar un profesor aleatorio de los disponibles
      const teacher = faker.helpers.arrayElement(availableTeachers);
      
      // Seleccionar un nombre de materia aleatorio
      const subjectName = faker.helpers.arrayElement(availableSubjects);
      
      const subject = this.subjectRepository.create({
        name: subjectName,
        description: faker.lorem.sentence(),
        credits: faker.number.int({ min: 3, max: 6 }),
        code: faker.string.alphanumeric(6).toUpperCase(),
        teacher
      });

      subjects.push(subject);
      
      // Actualizar el contador de materias del profesor
      teacherSubjectCount.set(teacher.id, teacherSubjectCount.get(teacher.id) + 1);
    }

    // Guardar todas las materias y actualizar el totalSubjects de los profesores
    const savedSubjects = await this.subjectRepository.save(subjects);
    
    // Actualizar el totalSubjects de cada profesor
    for (const [teacherId, subjectCount] of teacherSubjectCount.entries()) {
      await this.teacherRepository.update(teacherId, {
        totalSubjects: subjectCount
      });
    }

    return savedSubjects;
  }

  async seed(data: { 
    courses: number; 
    teachers: number; 
    students: number;
    courseNames: string[];
  }) {
    try {
      // Limpiar datos existentes
      await this.subjectRepository.delete({});
      await this.studentRepository.delete({});
      //await this.teacherRepository.delete({});
      //await this.userRepository.delete({});

      // Crear profesores
      const teachers = [];
      for (let i = 0; i < data.teachers; i++) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await this.userRepository.save({
          name: `Profesor ${i + 1}`,
          email: `profesor${i + 1}@example.com`,
          password: hashedPassword
        });

        const teacher = await this.teacherRepository.save({
          user,
          totalSubjects: 0
        });
        teachers.push(teacher);
      }

      // Crear materias
      const subjects = [];
      // Crear un mapa para rastrear las materias por profesor
      const teacherSubjectCount = new Map<number, number>();
      teachers.forEach(teacher => teacherSubjectCount.set(teacher.id, 0));

      for (let i = 0; i < data.courses; i++) {
        // Encontrar profesores que tengan menos de 2 materias
        const availableTeachers = teachers.filter(teacher => 
          teacherSubjectCount.get(teacher.id) < 2
        );

        if (availableTeachers.length === 0) {
          console.log('Todos los profesores ya tienen el máximo de materias asignadas');
          break;
        }

        // Seleccionar un profesor aleatorio de los disponibles
        const teacher = faker.helpers.arrayElement(availableTeachers);
        
        const subject = await this.subjectRepository.save({
          name: data.courseNames[i],
          credits: Math.floor(Math.random() * 3) + 1,
          code: `SUB${i + 1}`,
          teacher
        });
        subjects.push(subject);

        // Actualizar el contador de materias del profesor
        teacherSubjectCount.set(teacher.id, teacherSubjectCount.get(teacher.id) + 1);
        
        // Actualizar totalSubjects del profesor
        await this.teacherRepository.update(teacher.id, {
          totalSubjects: teacherSubjectCount.get(teacher.id)
        });
      }

      // Crear estudiantes
      const students = [];
      for (let i = 0; i < data.students; i++) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await this.userRepository.save({
          name: `Estudiante ${i + 1}`,
          email: `estudiante${i + 1}@example.com`,
          password: hashedPassword
        });

        const student = await this.studentRepository.save({
          user,
          totalCredits: 0
        });
        students.push(student);

        // Asignar materias aleatorias al estudiante
        const numSubjects = Math.floor(Math.random() * 3) + 1;
        const enrolledSubjects = subjects
          .sort(() => Math.random() - 0.5)
          .slice(0, numSubjects);

        // Actualizar las materias del estudiante
        student.subjects = enrolledSubjects;
        await this.studentRepository.save(student);

        // Actualizar totalCredits del estudiante
        const totalCredits = enrolledSubjects.reduce((sum, subject) => sum + subject.credits, 0);
        await this.studentRepository.update(student.id, {
          totalCredits
        });
      }

      return {
        message: 'Datos sembrados exitosamente',
        teachers: teachers.length,
        subjects: subjects.length,
        students: students.length
      };
    } catch (error) {
      throw new Error(`Error al sembrar datos: ${error.message}`);
    }
  }

  async testEndpoints() {
    try {
      // Obtener token de autenticación
      const loginResponse = await this.authService.loginTeacher('admin@test.com', '123456');
      this.token = loginResponse.token;

      const results = [];

      // Crear un profesor de prueba
      const teacher = await this.createTestTeacher();
      console.log('Profesor de prueba creado:', teacher);
      results.push({
        endpoint: 'POST /api/teachers',
        status: 'ÉXITO',
        details: 'Profesor de prueba creado correctamente'
      });

      // Crear dos materias de prueba
      const subject1 = await this.createTestSubject(teacher.id);
      console.log('Materia de prueba 1 creada:', subject1);
      results.push({
        endpoint: 'POST /api/subjects',
        status: 'ÉXITO',
        details: 'Materia de prueba 1 creada correctamente'
      });

      const subject2 = await this.createTestSubject(teacher.id);
      console.log('Materia de prueba 2 creada:', subject2);
      results.push({
        endpoint: 'POST /api/subjects',
        status: 'ÉXITO',
        details: 'Materia de prueba 2 creada correctamente'
      });

      // Crear un estudiante de prueba
      const student = await this.createTestStudent();
      console.log('Estudiante de prueba creado:', student);
      results.push({
        endpoint: 'POST /api/students',
        status: 'ÉXITO',
        details: 'Estudiante de prueba creado correctamente'
      });

      // Probar actualización de profesor
      try {
        const updatedTeacher = await this.testUpdateTeacher(teacher.id);
        console.log('Profesor actualizado:', updatedTeacher);
        results.push({
          endpoint: 'PUT /api/teachers/:id',
          status: 'ÉXITO',
          details: 'Profesor actualizado correctamente'
        });
      } catch (error) {
        console.error('Error al actualizar profesor:', error);
        results.push({
          endpoint: 'PUT /api/teachers/:id',
          status: 'FALLO',
          details: `Error al actualizar profesor: ${error.message}`
        });
      }

      // Probar actualización de materia
      try {
        const updatedSubject = await this.testUpdateSubject(subject1.id, teacher.id);
        console.log('Materia actualizada:', updatedSubject);
        results.push({
          endpoint: 'PUT /api/subjects/:id',
          status: 'ÉXITO',
          details: 'Materia actualizada correctamente'
        });
      } catch (error) {
        console.error('Error al actualizar materia:', error);
        results.push({
          endpoint: 'PUT /api/subjects/:id',
          status: 'FALLO',
          details: `Error al actualizar materia: ${error.message}`
        });
      }

      // Verificar si el estudiante ya está inscrito en alguna de las materias
      const studentWithSubjects = await this.studentRepository.findOne({
        where: { id: student.id },
        relations: ['subjects']
      });

      let subjectToEnroll = subject2;
      if (studentWithSubjects?.subjects?.some(s => s.id === subject2.id)) {
        // Si ya está inscrito en subject2, usar subject1
        subjectToEnroll = subject1;
      }

      // Probar inscripción de estudiante
      try {
        const enrolledSubject = await this.testEnrollStudent(student.id, subjectToEnroll.id);
        console.log('Estudiante inscrito en materia:', enrolledSubject);
        results.push({
          endpoint: 'POST /api/students/:id/subjects/:subjectId/enroll',
          status: 'ÉXITO',
          details: 'Estudiante inscrito correctamente'
        });
      } catch (error) {
        console.error('Error al inscribir estudiante:', error);
        results.push({
          endpoint: 'POST /api/students/:id/subjects/:subjectId/enroll',
          status: 'FALLO',
          details: `Error al inscribir estudiante: ${error.message}`
        });
      }

      // Probar desinscripción de estudiante
      try {
        const unenrolledSubject = await this.testUnenrollStudent(student.id, subjectToEnroll.id);
        console.log('Estudiante desinscrito de materia:', unenrolledSubject);
        results.push({
          endpoint: 'POST /api/students/:id/subjects/:subjectId/drop',
          status: 'ÉXITO',
          details: 'Estudiante desinscrito correctamente'
        });
      } catch (error) {
        console.error('Error al desinscribir estudiante:', error);
        results.push({
          endpoint: 'POST /api/students/:id/subjects/:subjectId/drop',
          status: 'FALLO',
          details: `Error al desinscribir estudiante: ${error.message}`
        });
      }

      // Limpiar datos de prueba
      await this.cleanupTestData(student.id, teacher.id, [subject1.id, subject2.id]);
      results.push({
        endpoint: 'DELETE /api/cleanup',
        status: 'ÉXITO',
        details: 'Datos de prueba limpiados correctamente'
      });

      return {
        success: true,
        message: 'Todas las pruebas completadas exitosamente',
        results
      };
    } catch (error) {
      console.error('Error en las pruebas:', error);
      return {
        success: false,
        message: 'Error en las pruebas: ' + error.message,
        results: []
      };
    }
  }

  private async createTestTeacher() {
    const teacherData = {
      name: 'Profesor Test',
      email: `profesor.test.${faker.string.alphanumeric(8)}@test.com`,
      password: '123456'
    };

    const response = await fetch(`${this.baseUrl}/teachers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(teacherData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al crear profesor de prueba: ${errorData.message || 'Error desconocido'}`);
    }

    return await response.json();
  }

  private async createTestSubject(teacherId: number) {
    const subjectData = {
      name: 'Materia Test',
      code: 'MT001',
      credits: 3,
      teacherId: teacherId
    };

    const response = await fetch(`${this.baseUrl}/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(subjectData)
    });

    if (!response.ok) {
      throw new Error('Error al crear materia de prueba');
    }

    return await response.json();
  }

  private async createTestStudent() {
    const studentData = {
      name: 'Estudiante Test',
      email: 'estudiante.test@test.com',
      password: '123456'
    };

    const response = await fetch(`${this.baseUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData)
    });

    if (!response.ok) {
      throw new Error('Error al crear estudiante de prueba');
    }

    return await response.json();
  }

  private async testEnrollStudent(studentId: number, subjectId: number) {
    console.log('Intentando inscribir estudiante:', studentId, 'en materia:', subjectId);
    const response = await fetch(`${this.baseUrl}/students/${studentId}/subjects/${subjectId}/enroll`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al inscribir estudiante');
    }

    return await response.json();
  }

  private async testUnenrollStudent(studentId: number, subjectId: number) {
    console.log('Intentando desinscribir estudiante:', studentId, 'de materia:', subjectId);
    const response = await fetch(`${this.baseUrl}/students/${studentId}/subjects/${subjectId}/drop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al desinscribir estudiante');
    }

    return await response.json();
  }

  private async testUpdateTeacher(teacherId: number) {
    const updateData = {
      name: 'Profesor Actualizado',
      email: 'profesor.actualizado@test.com'
    };

    const response = await fetch(`${this.baseUrl}/teachers/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Error al actualizar profesor');
    }

    return await response.json();
  }

  private async testUpdateSubject(subjectId: number, teacherId: number) {
    const updateData = {
      name: 'Materia Actualizada',
      code: 'MA001',
      credits: 4,
      teacherId: teacherId
    };

    const response = await fetch(`${this.baseUrl}/subjects/${subjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Error al actualizar materia');
    }

    return await response.json();
  }

  private async cleanupTestData(studentId: number, teacherId: number, subjectIds: number[]) {
    try {
      console.log('Iniciando limpieza de datos de prueba...');
      
      // Primero desinscribir al estudiante de todas las materias
      for (const subjectId of subjectIds) {
        try {
          console.log('Desinscribiendo estudiante de la materia:', subjectId);
          await this.testUnenrollStudent(studentId, subjectId);
        } catch (error) {
          console.error('Error al desinscribir estudiante de materia:', subjectId, error);
        }
      }

      // Luego eliminar el estudiante
      try {
        console.log('Eliminando estudiante:', studentId);
        const deleteStudentResponse = await fetch(`${this.baseUrl}/students/${studentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!deleteStudentResponse.ok) {
          throw new Error(`Error al eliminar estudiante: ${deleteStudentResponse.statusText}`);
        }
      } catch (error) {
        console.error('Error al eliminar estudiante:', error);
      }

      // Luego eliminar las materias
      for (const subjectId of subjectIds) {
        try {
          console.log('Eliminando materia:', subjectId);
          const deleteSubjectResponse = await fetch(`${this.baseUrl}/subjects/${subjectId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            }
          });
          if (!deleteSubjectResponse.ok) {
            throw new Error(`Error al eliminar materia: ${deleteSubjectResponse.statusText}`);
          }
        } catch (error) {
          console.error('Error al eliminar materia:', subjectId, error);
        }
      }

      // Finalmente eliminar el profesor y su usuario asociado
      try {
        console.log('Eliminando profesor:', teacherId);
        const deleteTeacherResponse = await fetch(`${this.baseUrl}/teachers/${teacherId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!deleteTeacherResponse.ok) {
          throw new Error(`Error al eliminar profesor: ${deleteTeacherResponse.statusText}`);
        }
        
        // Obtener el profesor para encontrar su usuario asociado
        const teacher = await this.teacherRepository.findOne({
          where: { id: teacherId },
          relations: ['user']
        });
        
        if (teacher && teacher.user) {
          console.log('Eliminando usuario asociado al profesor:', teacher.user.id);
          await this.userRepository.delete(teacher.user.id);
        }
      } catch (error) {
        console.error('Error al eliminar profesor o su usuario:', error);
      }

      console.log('Limpieza de datos de prueba completada');
    } catch (error) {
      console.error('Error en la limpieza de datos:', error);
      throw error;
    }
  }
}