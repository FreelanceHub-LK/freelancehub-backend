import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EscalateDisputeDto {
  @ApiProperty({
    description: 'Reason for escalating the dispute',
    example: 'The other party is not responding to messages and has missed the deadline.'
  })
  @IsString()
  reason: string;
}
