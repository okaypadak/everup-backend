import { Expose, Type } from 'class-transformer';

export class ResponseCustomerDto {
  @Expose()
  id: number;

  @Expose()
  firmaAdi: string;

  @Expose()
  yetkiliKisi: string;

  @Expose()
  email: string;

  @Expose()
  telefon: string;

  @Expose()
  notlar: string;

  @Expose()
  createdAt: Date;
}
