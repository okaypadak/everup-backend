import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
  ManyToMany,
  OneToOne,
  JoinTable,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { TaskDependency } from './task-dependency.entity';
import { Customer } from '../customer/customer.entity';
import { TaskLabel } from './task-label.entity';

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

export enum MarketingTaskStatus {
  NEW_LEAD = 'NEW_LEAD',
  CONTACTED = 'CONTACTED',
  UNREACHABLE = 'UNREACHABLE',
  IN_NEGOTIATION = 'IN_NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST'
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

  @Column({
    type: 'enum',
    enum: MarketingTaskStatus,
    nullable: true,
  })
  marketingStatus: MarketingTaskStatus;

  @Column({ type: 'timestamp', nullable: true })
  deadline?: Date;

  @OneToMany(() => TaskDependency, dep => dep.task, { cascade: true })
  dependencies: TaskDependency[];

  @OneToMany(() => TaskDependency, dep => dep.dependsOn, { cascade: true })
  dependents: TaskDependency[];

  @OneToOne(() => Customer, (customer) => customer.task)
  @JoinColumn()
  customer: Customer;

  @ManyToMany(() => TaskLabel, { eager: true })
  @JoinTable()
  labels: TaskLabel[];
}
