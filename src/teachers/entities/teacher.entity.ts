import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, user => user.teacher)
  @JoinColumn()
  user: User;

  @OneToMany(() => Subject, subject => subject.teacher)
  subjects: Subject[];

  @Column({ default: 0 })
  totalSubjects: number;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary: number;
} 