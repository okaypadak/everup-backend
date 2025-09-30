import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';

@Entity()
export class Meeting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  location?: string;

  @Column('text')
  agenda: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Project, (project) => project.meetings, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @ManyToOne(() => User, (user) => user.createdMeetings, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  createdBy: User | null;

  @ManyToMany(() => User, (user) => user.participatingMeetings)
  @JoinTable()
  participants: User[];
}
