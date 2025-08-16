import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Index, OneToMany,
} from 'typeorm';
import { Project } from '../project/project.entity'
import { User } from '../user/user.entity'
import { Task } from '../task/task.entity';

@Entity()
@Unique(['project', 'name']) // aynı projede aynı sprint adı olmasın
export class Sprint {
  @PrimaryGeneratedColumn()
  id: number

  @Index()
  @Column({ length: 120 })
  name: string

  // DATE sütunu: saat/dk tutmayız; ISO "YYYY-MM-DD" string de verebilirsin.
  @Column({ type: 'date' })
  startDate: string

  @Column({ type: 'date' })
  endDate: string

  @Column({ type: 'text', nullable: true })
  goal?: string

  @ManyToOne(() => Project, (p) => p.sprints, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  project: Project

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  createdBy?: User

  @CreateDateColumn()
  createdAt: Date

  @OneToMany(() => Task, (t) => t.sprint)
  tasks: Task[]
}
