export class ResponseDocumentDto {
  id: string;
  projectId: string;
  parentId?: string | null;
  title: string;
  desc?: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(doc: any) {
    this.id = doc._id?.toString?.() ?? '';
    this.projectId = doc.projectId;
    this.parentId = doc.parentId;
    this.title = doc.title;
    this.desc = doc.desc;
    this.content = doc.content;
    this.createdAt = doc.createdAt;
    this.updatedAt = doc.updatedAt;
  }
}
