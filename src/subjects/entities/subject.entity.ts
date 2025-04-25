import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';
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
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @ManyToMany(() => Student)
  @JoinTable({
    name: 'subject_students',
    joinColumn: {
      name: 'subject_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'student_id',
      referencedColumnName: 'id'
    }
  })
  students: Student[];
} 