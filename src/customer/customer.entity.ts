import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { Task } from '../task/task.entity';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firmaAdi: string;

  @Column()
  yetkiliKisi: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  telefon?: string;

  @Column('text', { nullable: true })
  notlar?: string;

  @ManyToOne(() => Project, (project) => project.customers, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToOne(() => Task, (task) => task.customer, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  task?: Task;

  @CreateDateColumn()
  createdAt: Date;
}
