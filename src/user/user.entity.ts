import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { Project } from '../project/project.entity';
import { ProjectUser } from '../project/project-user.entity';

export enum UserRole {
  DEVELOPER = 'developer',
  TESTER = 'tester',
  DIRECTOR = 'director',
  DEVOPS = 'devOps',
  ADMIN = 'admin',
  MARKETER = 'marketer'
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

  @OneToMany(() => ProjectUser, (pu) => pu.user)
  projectLinks: ProjectUser[];
}
