import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/students/entities/student.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';  
import { Subject } from '../subjects/entities/subject.entity';

@Injectable()
export class SeedersService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
  ) {}

  async createSeeders(data: {
    cursos: string[];
    usuarios: number;
    estudiantes: number;
    profesores: number;
  }) {
    // Crear Teachers
    const teachers = await Promise.all(
      Array(data.profesores)
        .fill(null)
        .map(async (_, index) => {
          const teacher = this.teachersRepository.create({
            name: `teacher ${index + 1}`,
            email: `teacher${index + 1}@example.com`,
          });
          return await this.teachersRepository.save(teacher);
        }),
    );

    // Crear materias y asignarlas a Teacheres
    const materias = await Promise.all(
      data.cursos.map(async (nombreCurso, index) => {
        const subject = this.subjectsRepository.create({
          name: nombreCurso,
          code: `CURSO${index + 1}`,
          teacher: teachers[index % teachers.length], // Distribuir materias entre Teacheres
          credits:3,
        });
        return await this.subjectsRepository.save(subject);
      }),
    );

    // Crear estudiantes
    const students = await Promise.all(
      Array(data.estudiantes)
        .fill(null)
        .map(async (_, index) => {
          const student = this.studentRepository.create({
            name: `Estudiante ${index + 1}`,
            email: `estudiante${index + 1}@example.com`,
            password: '123456',
          });
          
          // Asignar 3 materias aleatorias a cada estudiante
          const materiasAleatorias = this.getRandomMaterias(materias, 3);
          student.subjects = materiasAleatorias;
          student.totalCredits = materiasAleatorias.length * 3;
          
          return await this.studentRepository.save(student);
        }),
    );

    return {
      message: 'Datos de prueba creados exitosamente',
      resumen: {
        newTeachers: teachers.length,
        newSubjects: materias.length,
        newStudents: students.length,
      },
    };
  }

  private getRandomMaterias(subjects: Subject[], cantidad: number): Subject[] {
    const materiasDisponibles = [...subjects];
    const materiasSeleccionadas: Subject[] = [];
    const TeacheresUsados = new Set<number>();

    while (materiasSeleccionadas.length < cantidad && materiasDisponibles.length > 0) {
      const randomIndex = Math.floor(Math.random() * materiasDisponibles.length);
      const subject = materiasDisponibles[randomIndex];

      // Verificar que no se repita el Teacher
      if (!TeacheresUsados.has(subject.teacher.id)) {
        materiasSeleccionadas.push(subject);
        TeacheresUsados.add(subject.teacher.id);
        materiasDisponibles.splice(randomIndex, 1);
      }
    }

    return materiasSeleccionadas;
  }
}