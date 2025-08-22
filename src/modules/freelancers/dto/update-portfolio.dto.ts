import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUrl, ArrayUnique } from 'class-validator';

export class UpdatePortfolioDto {
  @ApiProperty({
    description: 'Array of portfolio links',
    example: ['https://github.com/user/project1', 'https://portfolio.example.com', 'https://dribbble.com/user'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsUrl({}, { each: true, message: 'Each portfolio link must be a valid URL' })
  @ArrayUnique()
  portfolioLinks: string[];
}
