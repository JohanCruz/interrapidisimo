import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    private usersService: UsersService
  ) {}

  async create(data: { user: any }) {
    const student = this.studentRepository.create({
      user: data.user,
      totalCredits: 0
    });
    return this.studentRepository.save(student);
  }

  async findAll() {
    console.log('Buscando todos los estudiantes');
    const students = await this.studentRepository.find({
      relations: ['user', 'subjects', 'subjects.teacher', 'subjects.teacher.user']
    });
    console.log('Estudiantes encontrados:', students.length);
    students.forEach(student => {
      console.log('Estudiante ID:', student.id, 'Usuario ID:', student.user?.id);
    });
    return students;
  }

  async findOne(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['user', 'subjects', 'subjects.teacher', 'subjects.teacher.user']
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    return student;
  }

  async enrollSubject(userId: number, subjectId: number) {
    console.log('Intentando inscribir usuario:', userId, 'en materia:', subjectId);

    try {
      // Primero obtenemos el estudiante con todas sus relaciones
      const student = await this.studentRepository.findOne({
        where: { user: { id: userId } },
        relations: ['user', 'subjects', 'subjects.teacher', 'subjects.teacher.user']
      });

      if (!student) {
        console.log('Estudiante no encontrado para el usuario:', userId);
        throw new NotFoundException('Estudiante no encontrado');
      }

      console.log('Estudiante encontrado:', student.id);

      // Luego obtenemos la materia con todas sus relaciones
      const subject = await this.subjectRepository.findOne({
        where: { id: subjectId },
        relations: ['teacher', 'teacher.user', 'students', 'students.user']
      });

      if (!subject) {
        console.log('Materia no encontrada');
        throw new NotFoundException('Materia no encontrada');
      }

      console.log('Materia encontrada:', {
        id: subject.id,
        name: subject.name,
        teacherId: subject.teacher?.id,
        teacherName: subject.teacher?.user?.name
      });

      // Verificar si ya está inscrito
      const alreadyEnrolled = student.subjects.some(s => s.id === subjectId);
      if (alreadyEnrolled) {
        console.log('Estudiante ya inscrito en esta materia');
        throw new BadRequestException('El estudiante ya está inscrito en esta materia');
      }

      // Verificar si ya tiene una materia con el mismo profesor
      if (subject.teacher) {
        const hasTeacher = student.subjects.some(s => s.teacher?.id === subject.teacher.id);
        if (hasTeacher) {
          console.log('Estudiante ya tiene una materia con este profesor');
          throw new BadRequestException('El estudiante ya tiene una materia con este profesor');
        }
      }

      // Verificar límite de créditos
      const newTotalCredits = student.totalCredits + subject.credits;
      if (newTotalCredits > 21) {
        console.log('Estudiante excede límite de créditos');
        throw new BadRequestException('El estudiante excede el límite de créditos permitido');
      }

      console.log('Agregando materia al estudiante');

      // Agregar la materia al estudiante
      student.subjects = [...student.subjects, subject];
      student.totalCredits = newTotalCredits;
      
      // Guardar el estudiante
      const savedStudent = await this.studentRepository.save(student);
      console.log('Estudiante guardado con éxito');

      // Actualizar la materia para incluir al estudiante
      subject.students = [...(subject.students || []), student];
      const savedSubject = await this.subjectRepository.save(subject);
      console.log('Materia actualizada con éxito');

      // Obtener la materia actualizada con todas sus relaciones
      const updatedSubject = await this.subjectRepository.findOne({
        where: { id: subjectId },
        relations: ['teacher', 'teacher.user', 'students', 'students.user']
      });

      console.log('Materia inscrita exitosamente');
      return updatedSubject;
    } catch (error) {
      console.error('Error al inscribir materia:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al inscribir la materia: ' + error.message);
    }
  }

  async getEnrolledSubjects(userId: number) {
    console.log('Obteniendo materias inscritas para el usuario:', userId);

    try {
      // Buscamos el estudiante por el ID del usuario con todas las relaciones necesarias
      const student = await this.studentRepository.findOne({
        where: { user: { id: userId } },
        relations: [
          'user',
          'subjects',
          'subjects.teacher',
          'subjects.teacher.user',
          'subjects.students',
          'subjects.students.user'
        ]
      });

      if (!student) {
        console.log('Estudiante no encontrado para el usuario:', userId);
        throw new NotFoundException('Estudiante no encontrado');
      }

      console.log('Estudiante encontrado:', student.id);
      console.log('Materias encontradas:', student.subjects?.length || 0);

      // Si el estudiante no tiene materias inscritas, devolvemos un array vacío
      if (!student.subjects || student.subjects.length === 0) {
        return [];
      }

      // Log para depuración
      student.subjects.forEach(subject => {
        console.log('Detalles de materia inscrita:', {
          id: subject.id,
          name: subject.name,
          credits: subject.credits,
          teacherId: subject.teacher?.id,
          teacherName: subject.teacher?.user?.name,
          studentsCount: subject.students?.length
        });
      });

      // Devolvemos las materias directamente sin transformar
      return student.subjects;
    } catch (error) {
      console.error('Error al obtener materias inscritas:', error);
      throw error;
    }
  }

  async dropSubject(userId: number, subjectId: number) {
    console.log('Intentando cancelar inscripción del usuario:', userId, 'en la materia:', subjectId);

    try {
      const student = await this.studentRepository.findOne({
        where: { user: { id: userId } },
        relations: ['subjects', 'subjects.teacher', 'subjects.teacher.user', 'user']
      });

      if (!student) {
        console.log('Estudiante no encontrado para el usuario:', userId);
        throw new NotFoundException('Estudiante no encontrado');
      }

      console.log('Estudiante encontrado:', student.id);

      const subject = student.subjects.find(s => s.id === subjectId);
      if (!subject) {
        console.log('El estudiante no está inscrito en la materia:', subjectId);
        throw new NotFoundException('El estudiante no está inscrito en esta materia');
      }

      // Remover la materia del estudiante
      student.subjects = student.subjects.filter(s => s.id !== subjectId);
      student.totalCredits = student.totalCredits - subject.credits;
      
      // Guardar el estudiante
      await this.studentRepository.save(student);

      // Actualizar la materia para remover al estudiante
      const subjectToUpdate = await this.subjectRepository.findOne({
        where: { id: subjectId },
        relations: ['students', 'teacher', 'teacher.user']
      });

      if (subjectToUpdate) {
        subjectToUpdate.students = subjectToUpdate.students.filter(s => s.id !== student.id);
        await this.subjectRepository.save(subjectToUpdate);
      }

      console.log('Inscripción cancelada exitosamente');

      return subjectToUpdate;
    } catch (error) {
      console.error('Error al cancelar inscripción:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al cancelar la inscripción: ' + error.message);
    }
  }

  async getStudentStats(studentId: number) {
    const student = await this.findOne(studentId);
    return student;
  }

  async checkDatabaseConnection() {
    try {
      // Verificar si podemos ejecutar una consulta simple
      const result = await this.studentRepository.query('SELECT 1 as test');
      console.log('Resultado de la consulta de prueba:', result);
      
      // Verificar si podemos contar estudiantes
      const count = await this.studentRepository.count();
      console.log('Número total de estudiantes en la base de datos:', count);
      
      // Verificar si podemos obtener todos los estudiantes
      const students = await this.studentRepository.find();
      console.log('Estudiantes encontrados:', students.length);
      students.forEach(student => {
        console.log('Estudiante ID:', student.id);
      });
      
      // Verificar si podemos obtener el estudiante con ID 17 específicamente
      const student17 = await this.studentRepository.findOne({
        where: { id: 17 }
      });
      console.log('¿Existe el estudiante con ID 17?', !!student17);
      if (student17) {
        console.log('Información del estudiante 17:', {
          id: student17.id,
          totalCredits: student17.totalCredits,
          userId: student17.user?.id
        });
      }
      
      // Verificar la estructura de la tabla
      const tableInfo = await this.studentRepository.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'student'
      `);
      console.log('Estructura de la tabla student:', tableInfo);
      
      // Verificar las relaciones
      const studentWithRelations = await this.studentRepository.findOne({
        where: { id: 17 },
        relations: ['user']
      });
      console.log('¿Existe el estudiante 17 con relaciones?', !!studentWithRelations);
      if (studentWithRelations) {
        console.log('Información del estudiante 17 con relaciones:', {
          id: studentWithRelations.id,
          totalCredits: studentWithRelations.totalCredits,
          userId: studentWithRelations.user?.id,
          userName: studentWithRelations.user?.name
        });
      }
      
      return {
        success: true,
        message: 'Conexión a la base de datos exitosa',
        studentsCount: count,
        students: students.map(s => ({ id: s.id })),
        student17Exists: !!student17,
        student17WithRelationsExists: !!studentWithRelations,
        tableStructure: tableInfo
      };
    } catch (error) {
      console.error('Error al verificar la conexión a la base de datos:', error);
      return {
        success: false,
        message: 'Error al conectar con la base de datos',
        error: error.message
      };
    }
  }

  async debugStudent(userId: number) {
    try {
      // Verificar si el estudiante existe sin cargar relaciones
      const studentExists = await this.studentRepository.findOne({
        where: { user: { id: userId } }
      });
      
      // Verificar si el estudiante existe con relaciones
      const studentWithRelations = await this.studentRepository.findOne({
        where: { user: { id: userId } },
        relations: ['user', 'subjects']
      });
      
      // Verificar si hay algún problema con la relación con el usuario
      const userExists = await this.usersService.findById(userId);
      
      return {
        studentExists: !!studentExists,
        studentWithRelationsExists: !!studentWithRelations,
        userExists: !!userExists,
        studentInfo: studentExists ? {
          id: studentExists.id,
          totalCredits: studentExists.totalCredits,
          userId: studentExists.user?.id
        } : null,
        studentWithRelationsInfo: studentWithRelations ? {
          id: studentWithRelations.id,
          totalCredits: studentWithRelations.totalCredits,
          userId: studentWithRelations.user?.id,
          userName: studentWithRelations.user?.name,
          subjectsCount: studentWithRelations.subjects?.length || 0
        } : null,
        userInfo: userExists ? {
          id: userExists.id,
          name: userExists.name,
          email: userExists.email
        } : null
      };
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  async getClassmates(userId: number, subjectId: number) {
    console.log('Obteniendo compañeros de clase para el usuario:', userId, 'en la materia:', subjectId);

    try {
      // Primero verificamos que el estudiante esté inscrito en la materia
      const student = await this.studentRepository.findOne({
        where: { user: { id: userId } },
        relations: ['subjects', 'user']
      });

      if (!student) {
        console.log('Estudiante no encontrado para el usuario:', userId);
        throw new NotFoundException('Estudiante no encontrado');
      }

      console.log('Estudiante encontrado:', student.id);
      console.log('Materias inscritas:', student.subjects.map(s => s.id));

      const isEnrolled = student.subjects.some(s => s.id === subjectId);
      if (!isEnrolled) {
        console.log('El estudiante no está inscrito en la materia:', subjectId);
        throw new BadRequestException('El estudiante no está inscrito en esta materia');
      }

      // Obtenemos todos los estudiantes inscritos en la materia
      const subject = await this.subjectRepository.findOne({
        where: { id: subjectId },
        relations: ['students', 'students.user']
      });

      if (!subject) {
        console.log('Materia no encontrada:', subjectId);
        throw new NotFoundException('Materia no encontrada');
      }

      console.log('Materia encontrada:', subject.id);
      console.log('Total de estudiantes en la materia:', subject.students?.length || 0);

      // Filtramos para excluir al estudiante actual
      const classmates = subject.students
        .filter(s => s.user.id !== userId)
        .map(s => ({
          id: s.id,
          name: s.user.name,
          email: s.user.email
        }));

      console.log('Compañeros de clase encontrados:', classmates.length);

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        totalClassmates: classmates.length,
        classmates
      };
    } catch (error) {
      console.error('Error al obtener compañeros de clase:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al obtener compañeros de clase: ' + error.message);
    }
  }
} 