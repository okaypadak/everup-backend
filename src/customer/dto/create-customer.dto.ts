// create-customer.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  firmaAdi: string;

  @IsString()
  @IsNotEmpty()
  yetkiliKisi: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  telefon?: string;

  @IsOptional()
  @IsString()
  notlar?: string;

  @IsNumber()
  @IsNotEmpty()
  projectId: number; // ✅ Bu alanın eksiksiz ve doğru tanımlandığından emin ol
}
