import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ResponseDocumentDto } from './dto/response-document.dto';
import { plainToInstance } from 'class-transformer';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('documents')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(RolesGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('project/:projectId')
  async getDocumentsByProject(@Param('projectId') projectId: string): Promise<ResponseDocumentDto[]> {
    const docs = await this.documentService.findByProject(projectId);
    return plainToInstance(ResponseDocumentDto, docs);
  }

  @Post()
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async createDocument(@Body() dto: CreateDocumentDto) {
    console.log('Gelen DTO:', dto);
    return plainToInstance(ResponseDocumentDto, (await this.documentService.create(dto)).toObject());
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string): Promise<{ deleted: boolean }> {
    await this.documentService.deleteByIdAndChildren(id);
    return { deleted: true };
  }
}
