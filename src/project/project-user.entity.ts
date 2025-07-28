// project-user.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';

export enum ProjectRole {
  DEVELOPER = 'developer',
  TEAM_LEAD = 'team_lead',
  TESTER = 'tester',
  MANAGER = 'manager',
  DESINGER = 'desinger',
  DEVOPS = 'devOps',
  MARKETER = 'marketer',
}

@Entity()
export class ProjectUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.projectLinks, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Project, (project) => project.userLinks, { eager: true, onDelete: 'CASCADE' })
  project: Project;

  @Column({ type: 'enum', enum: ProjectRole })
  role: ProjectRole;
}
