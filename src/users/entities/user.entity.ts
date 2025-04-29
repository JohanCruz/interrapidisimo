import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ length: 60 })
  password: string;

  @Column({ nullable: true })
  token: string;

  @Column({ default: 'student' })
  role: string;

  @OneToOne(() => Student, student => student.user)
  student: Student;

  @OneToOne(() => Teacher, teacher => teacher.user)
  teacher: Teacher;
} 