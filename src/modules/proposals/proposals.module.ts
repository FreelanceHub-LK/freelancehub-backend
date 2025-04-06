  import { Module } from '@nestjs/common';
  import { MongooseModule } from '@nestjs/mongoose';
  import { ProposalsController } from './proposals.controller';
  import { ProposalsService } from './proposals.service';
  import { Proposal, ProposalSchema } from './schemas/proposal.schema';
  import { ProjectsModule } from '../projects/projects.module';
  
  @Module({
    imports: [
      ProjectsModule,
      MongooseModule.forFeature([
        { name: Proposal.name, schema: ProposalSchema },
      ]),
    ],
    controllers: [ProposalsController],
    providers: [ProposalsService],
    exports: [ProposalsService],
  })
  export class ProposalsModule {}