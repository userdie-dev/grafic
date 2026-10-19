import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ShiftDto {
  @Matches(DATE_RE, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @Matches(TIME_RE, { message: 'start must be HH:mm' })
  start: string;

  @Matches(TIME_RE, { message: 'end must be HH:mm' })
  end: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class UpsertShiftsDto {
  @IsArray()
  @ArrayMaxSize(366)
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  shifts: ShiftDto[];
}
