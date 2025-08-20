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
  UpdateDateColumn,
  Index,
  BeforeInsert
} from 'typeorm';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { TaskDependency } from './task-dependency.entity';
import { Customer } from '../customer/customer.entity';
import { TaskLabel } from './task-label.entity';
import { Sprint } from '../sprint/sprint.entity';

export enum TaskType {
  TASK = 'task',
  TEST = 'test',
  BUG = 'bug',
  APPROVAL = 'approval',
}

export enum TaskStatus {
  READY = 'Ready',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  WAITING = 'Waiting',
}

export enum MarketingTaskStatus {
  NEW_LEAD = 'NEW_LEAD',
  CONTACTED = 'CONTACTED',
  UNREACHABLE = 'UNREACHABLE',
  IN_NEGOTIATION = 'IN_NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
}

export enum TaskLevel {
  NORMAL = 'normal',
  PRIORITY = 'priority',
  CRITICAL = 'critical',
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('uq_task_unique_code', { unique: true })
  @Column({ type: 'varchar', length: 40, unique: true, nullable: true })
  uniqueCode!: string | null;

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
  @Index('idx_task_created_at')
  createdAt: Date;

  @UpdateDateColumn()
  @Index('idx_task_updated_at')
  updatedAt: Date;

  // İşin fiilen başlanma zamanı (Cycle/Aging WIP için önerilir)
  @Column({ type: 'timestamp', nullable: true })
  @Index('idx_task_started_at')
  startedAt?: Date | null;

  // İşin tamamlandığı zaman (Lead time / Predictability / Throughput için)
  @Column({ type: 'timestamp', nullable: true })
  @Index('idx_task_completed_at')
  completedAt?: Date | null;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.READY,
  })
  @Index('idx_task_status')
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

  @OneToMany(() => TaskDependency, (dep) => dep.task, { cascade: true })
  dependencies: TaskDependency[];

  @OneToMany(() => TaskDependency, (dep) => dep.dependsOn, { cascade: true })
  dependents: TaskDependency[];

  @OneToOne(() => Customer, (customer) => customer.task)
  @JoinColumn()
  customer: Customer;

  @ManyToMany(() => TaskLabel, { eager: true })
  @JoinTable({
    name: 'task_label_dependency',
    joinColumn: { name: 'taskId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'labelId', referencedColumnName: 'id' },
  })
  labels: TaskLabel[];

  @ManyToOne(() => Sprint, (s) => s.tasks, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sprintId' })
  sprint: Sprint | null;

  @Column({ type: 'int', nullable: true })
  @Index('idx_task_sprint_id')
  sprintId: number | null;

  @BeforeInsert()
  private _ensureUniqueCode() {
    if (!this.uniqueCode) {
      const now = new Date();
      const ym = now.toISOString().slice(0, 7).replace('-', '');
      this.uniqueCode = `TCKT-${ym}-${ulid()}`;
    }
  }
}
