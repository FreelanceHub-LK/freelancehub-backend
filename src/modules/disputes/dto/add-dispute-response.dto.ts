import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddDisputeResponseDto {
  @ApiProperty({
    description: 'Response text',
    example: 'I disagree with this claim because...'
  })
  @IsString()
  response: string;

  @ApiPropertyOptional({
    description: 'Array of attachment URLs',
    type: [String],
    example: ['https://example.com/file1.pdf', 'https://example.com/file2.jpg']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
