import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { Dispute, DisputeSchema } from '../disputes/schemas/dispute.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Dispute.name, schema: DisputeSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
