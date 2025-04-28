import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { Student } from '../../students/entities/student.entity';

@Entity()
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  credits: number;

  @ManyToOne(() => Teacher, teacher => teacher.subjects)
  teacher: Teacher;

  @ManyToMany(() => Student, student => student.subjects)
  @JoinTable()
  students: Student[];
} 