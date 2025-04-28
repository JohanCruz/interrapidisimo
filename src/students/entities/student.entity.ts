import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  totalCredits: number;

  @OneToOne(() => User, user => user.student)
  @JoinColumn()
  user: User;

  @ManyToMany(() => Subject, subject => subject.students)
  subjects: Subject[];
} 