import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Task } from './task.entity';

@Entity()
export class TaskDependency {
  @PrimaryGeneratedColumn()
  id: number;

  // Bu görev...
  @ManyToOne(() => Task, task => task.dependencies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  // ...şu göreve bağımlı
  @ManyToOne(() => Task, task => task.dependents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dependsOnTaskId' })
  dependsOn: Task;
}
