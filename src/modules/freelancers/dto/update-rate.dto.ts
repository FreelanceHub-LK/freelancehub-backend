import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class UpdateRateDto {
  @ApiProperty({
    description: 'Hourly rate in USD',
    example: 25.50,
    minimum: 1,
    maximum: 1000
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'Hourly rate must be at least $1' })
  @Max(1000, { message: 'Hourly rate cannot exceed $1000' })
  hourlyRate: number;
}
