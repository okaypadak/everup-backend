import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { ProjectDocument, ProjectDocumentSchema } from './document.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ProjectDocument.name, schema: ProjectDocumentSchema }])],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
