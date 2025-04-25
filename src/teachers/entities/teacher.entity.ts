import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity()
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ length: 60  })
  password: string;

  @Column({ nullable: true })
  token: string;

  @OneToMany(() => Subject, (subject) => subject.teacher) // Especifica el campo inverso
  subjects: Subject[];
} 