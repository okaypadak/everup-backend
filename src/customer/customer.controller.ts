import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode, Patch,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ResponseCustomerDto } from './dto/response-customer.dto';
import { CustomerWithTaskStageDto } from './dto/customer-with-task-status.dto';
import { MarketingTaskStatus } from '../task/task.entity';

@Controller('customers')
@UseGuards(RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Roles('admin', 'director', 'developer', 'marketing')
  @HttpCode(200)
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @Req() req: any,
  ): Promise<{ code: string; message: string }> {
    await this.customerService.create(createCustomerDto, req.user);
    return { code: '00', message: 'İşlem başarılı' };
  }

  @Get()
  async findAll(): Promise<ResponseCustomerDto[]> {
    return this.customerService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<ResponseCustomerDto> {
    return this.customerService.findOne(id);
  }

  @Get('project/:projectId')
  @Roles('admin', 'director', 'developer', 'marketing')
  async getByProject(@Param('projectId') projectId: number): Promise<ResponseCustomerDto[]> {
    return this.customerService.findByProjectId(projectId);
  }

  @Get('kanban/:projectId')
  @Roles('admin', 'director', 'developer', 'marketing')
  async getKanbanView(@Param('projectId') projectId: number): Promise<CustomerWithTaskStageDto[]> {
    return this.customerService.findByProjectIdWithTaskStage(projectId)
  }

  @Patch(':id/stage')
  async updateMarketingStage(
    @Param('id') customerId: number,
    @Body('marketingStatus') marketingStatus: MarketingTaskStatus
  ): Promise<void> {
    return this.customerService.updateMarketingStatus(customerId, marketingStatus)
  }
}
