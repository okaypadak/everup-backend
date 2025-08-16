import { IsDateString, IsInt, IsOptional, IsString, Length, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateSprintDto {
  @IsInt()
  @Type(() => Number)
  projectId: number

  @IsString()
  @Length(3, 120)
  name: string

  @IsDateString()
  startDate: string

  @IsDateString()
  endDate: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  goal?: string
}
