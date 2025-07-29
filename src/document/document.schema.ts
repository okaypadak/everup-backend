import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument } from 'mongoose';

@Schema({ timestamps: true })
export class ProjectDocument extends MongooseDocument {
  @Prop({ required: true })
  projectId: string;

  @Prop({ type: String, default: null })
  parentId: string | null;

  @Prop({ required: true })
  title: string;

  @Prop()
  desc?: string;

  @Prop()
  content?: string;
}

export const ProjectDocumentSchema = SchemaFactory.createForClass(ProjectDocument);
