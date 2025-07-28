// customer.service.ts

import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Customer } from './customer.entity'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { User } from '../user/user.entity'
import { Task, TaskLevel, TaskStatus, TaskType, MarketingTaskStatus } from '../task/task.entity'
import { Project } from '../project/project.entity'
import { plainToInstance } from 'class-transformer'
import { ResponseCustomerDto } from './dto/response-customer.dto'
import { CustomerWithTaskStageDto } from './dto/customer-with-task-status.dto'

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto, user: User): Promise<void> {
    const project = await this.projectRepo.findOneByOrFail({ id: createCustomerDto.projectId })
    const customer = this.customerRepo.create({ ...createCustomerDto, project })
    const savedCustomer = await this.customerRepo.save(customer)

    const task = this.taskRepo.create({
      title: `${savedCustomer.firmaAdi} - Pazarlama Takibi`,
      description: 'İlk temas sağlanmalı',
      assignedTo: user,
      creator: user,
      project,
      customer: savedCustomer,
      status: TaskStatus.READY,
      type: TaskType.TASK,
      level: TaskLevel.NORMAL,
      marketingStatus: MarketingTaskStatus.NEW_LEAD,
    })

    const savedTask = await this.taskRepo.save(task)
    savedCustomer.task = savedTask
    await this.customerRepo.save(savedCustomer)
  }

  async findAll(): Promise<ResponseCustomerDto[]> {
    const customers = await this.customerRepo.find({
      relations: ['task', 'project'],
      order: { createdAt: 'DESC' },
    })

    return plainToInstance(ResponseCustomerDto, customers, {
      excludeExtraneousValues: true,
    })
  }

  async findOne(id: number): Promise<ResponseCustomerDto> {
    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['task', 'project'],
    })

    if (!customer) throw new NotFoundException('Müşteri bulunamadı')

    return plainToInstance(ResponseCustomerDto, customer, {
      excludeExtraneousValues: true,
    })
  }

  async findByProjectId(projectId: number): Promise<ResponseCustomerDto[]> {
    const customers = await this.customerRepo.find({
      where: { project: { id: projectId } },
      relations: ['project'],
      order: { createdAt: 'DESC' },
    })

    return plainToInstance(ResponseCustomerDto, customers, {
      excludeExtraneousValues: true,
    })
  }

  async findByProjectIdWithTaskStage(projectId: number): Promise<CustomerWithTaskStageDto[]> {
    const customers = await this.customerRepo.find({
      where: { project: { id: projectId } },
      relations: ['task'],
      order: { createdAt: 'DESC' },
    })

    return customers.map((customer) => ({
      id: customer.id,
      firmaAdi: customer.firmaAdi,
      yetkiliKisi: customer.yetkiliKisi,
      email: customer.email!,
      telefon: customer.telefon!,
      notlar: customer.notlar!,
      createdAt: customer.createdAt,
      taskStatus: customer.task?.status,
      marketingStatus: customer.task?.marketingStatus,
    }))
  }

  async updateMarketingStatus(customerId: number, newStatus: MarketingTaskStatus): Promise<void> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
      relations: ['task'],
    })

    if (!customer || !customer.task) {
      throw new NotFoundException('Müşteri veya görevi bulunamadı')
    }

    customer.task.marketingStatus = newStatus
    await this.taskRepo.save(customer.task)
  }
}
