import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasskeyDto {
  @ApiProperty({
    description: 'New device name',
    example: 'My Updated iPhone',
  })
  @IsNotEmpty()
  @IsString()
  deviceName: string;
}
