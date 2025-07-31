// src/document/dto/update-document.dto.ts
import { IsOptional, IsString, ValidateIf } from 'class-validator'

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @ValidateIf(o => o.parentId !== null)
  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
