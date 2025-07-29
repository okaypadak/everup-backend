import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator'

export class CreateDocumentDto {
  @IsNotEmpty()
  projectId: string;

  @ValidateIf(o => o.parentId !== null)
  @IsOptional()
  @IsString()
  parentId?: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
