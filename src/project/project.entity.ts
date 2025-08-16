import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Task } from '../task/task.entity';
import { Customer } from '../customer/customer.entity';
import { ProjectUser } from './project-user.entity';
import { Sprint } from '../sprint/sprint.entity'

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: false })
  startDate: Date;

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];

  @OneToMany(() => Customer, (customer) => customer.project)
  customers: Customer[];

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ProjectUser, (pu) => pu.project)
  userLinks: ProjectUser[];

  @OneToMany(() => Sprint, (sprint) => sprint.project)
  sprints: Sprint[]
}
