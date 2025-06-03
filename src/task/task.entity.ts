import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

export enum TaskStatus {
  READY = 'Hazır',
  IN_PROGRESS = 'Devam',
  COMPLETED = 'Tamamlandı'
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.READY })
  status: TaskStatus;

  @ManyToOne(() => User, { eager: true })
  assignedTo: User;

  @CreateDateColumn()
  createdAt: Date;
}
