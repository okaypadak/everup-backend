import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { Task } from '../task/task.entity';
import { Project } from '../project/project.entity';

// customer.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Customer, Task, Project])],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService]
})
export class CustomerModule {}