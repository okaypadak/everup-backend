import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProjectDocument } from './document.schema';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(ProjectDocument.name) private docModel: Model<ProjectDocument>,
  ) {}

  async findByProject(projectId: string): Promise<ProjectDocument[]> {
    return this.docModel.find({ projectId }).lean();
  }

  async create(dto: CreateDocumentDto): Promise<ProjectDocument> {
    const doc = new this.docModel(dto);
    return doc.save();
  }

  async deleteByIdAndChildren(id: string): Promise<void> {
    const docs = await this.docModel.find().lean();
    const toDelete = this.collectNestedIds(docs, id);
    await this.docModel.deleteMany({ _id: { $in: toDelete } });
  }

  private collectNestedIds(docs: ProjectDocument[], id: string): string[] {
    let ids = [id];
    const children = docs.filter(d => d.parentId === id);
    for (const child of children) {
      const childId = (child._id as Types.ObjectId).toString();
      ids = ids.concat(this.collectNestedIds(docs, childId));
    }
    return ids;
  }
}
