import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards, Patch,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ResponseDocumentDto } from './dto/response-document.dto';
import { plainToInstance } from 'class-transformer';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Controller('documents')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(RolesGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get(':id')
  async getDocumentById(@Param('id') id: string): Promise<ResponseDocumentDto> {
    const doc = await this.documentService.findById(id); // null olamaz
    return new ResponseDocumentDto(doc);
  }

  @Get('project/:projectId')
  async getDocumentsByProject(@Param('projectId') projectId: string): Promise<ResponseDocumentDto[]> {
    const docs = await this.documentService.findByProject(projectId);
    return docs.map((doc) => new ResponseDocumentDto(doc));
  }

  @Post()
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async createDocument(@Body() dto: CreateDocumentDto) {
    const created = await this.documentService.create(dto);
    return new ResponseDocumentDto(created.toObject?.() ?? created);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateDocumentDto) {
    return this.documentService.updateById(id, updateDto);
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string): Promise<{ deleted: boolean }> {
    await this.documentService.deleteByIdAndChildren(id);
    return { deleted: true };
  }
}
