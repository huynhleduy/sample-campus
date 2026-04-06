import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SearchOrder } from '../enums';
import { IPaginateOptionsDto } from '../types/pagination.types';

export class AppPaginateOptionsDto implements IPaginateOptionsDto {
  @IsOptional()
  @IsEnum(SearchOrder)
  readonly order: SearchOrder = SearchOrder.DESC;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseInt(String(value), 10))
  @IsNumber()
  readonly page: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseInt(String(value), 10))
  @IsNumber()
  readonly take: number = 10;

  @IsOptional()
  @IsString()
  readonly q?: string;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
