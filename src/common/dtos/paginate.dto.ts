import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { IPaginationDto } from '../types/pagination.types';

export class AppPaginationDto<T> implements IPaginationDto<T> {
  @IsNumber()
  page: number;

  @IsNumber()
  pageSize: number;

  @IsNumber()
  total: number;

  @ApiProperty({ isArray: true })
  readonly result: T[];
}
