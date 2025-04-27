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

  @ManyToOne(() => Teacher, teacher => teacher.subjects, { 
    onDelete: 'SET NULL'     
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @ManyToMany(() => Student, student => student.subjects, {
    onDelete: 'CASCADE'})
  @JoinTable()
  students: Student[];
} 