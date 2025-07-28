import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { Project } from '../project/project.entity';

export enum UserRole {
  DEVELOPER = 'developer',
  TESTER = 'tester',
  DIRECTOR = 'director',
  DEVOPS = 'devOps',
  ADMIN = 'admin'
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @ManyToMany(() => Project, (project) => project.users)
  projects: Project[];
}
