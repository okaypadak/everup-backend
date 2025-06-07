import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';

export enum TaskType {
  TASK = 'task',
  TEST = 'test',
  BUG = 'bug',
  APPROVAL = 'approval'
}

export enum TaskStatus {
  READY = 'Ready',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  WAITING = 'Waiting'
}

export enum TaskLevel {
  NORMAL = 'normal',
  PRIORITY = 'priority',
  CRITICAL = 'critical'
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @ManyToOne(() => Project, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.READY,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.TASK,
  })
  type: TaskType;

  @Column({
    type: 'enum',
    enum: TaskLevel,
    default: TaskLevel.NORMAL,
  })
  level: TaskLevel;

  @ManyToOne(() => Task, { nullable: true })
  @JoinColumn({ name: 'dependentTaskId' })
  dependentTask?: Task;

  @Column({ type: 'timestamp', nullable: true })
  deadline?: Date;
}
