import { PartialType } from '@nestjs/swagger';
import { CreateProposalDto } from './create-proposal.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProposalStatus } from '../schemas/proposal.schema';

export class UpdateProposalDto extends PartialType(CreateProposalDto) {
  @ApiProperty({ 
    description: 'Proposal status',
    enum: ProposalStatus,
    required: false
  })
  @IsEnum(ProposalStatus)
  @IsOptional()
  status?: ProposalStatus;
}
