import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAvailabilityDto {
  @ApiProperty({
    description: 'Availability status',
    example: true
  })
  @IsBoolean()
  isAvailable: boolean;
}
