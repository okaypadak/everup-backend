import { IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty() name: string;
  @IsOptional() description?: string;

  @IsNotEmpty()
  @Matches(/^\d{8}$/, { message: 'startDate yyyyMMdd formatında olmalı' })
  startDate: string;
}
