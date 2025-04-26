import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Subject } from 'src/subjects/entities/subject.entity';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({  length: 60   })
  password: string;

  @Column({ nullable: true })
  token: string;

  @ManyToMany(() => Subject, subject => subject.students)
  subjects: Subject[];

  @Column({ default: 0 })
  totalCredits: number;
} 