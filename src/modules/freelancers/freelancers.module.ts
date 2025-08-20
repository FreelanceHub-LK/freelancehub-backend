import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FreelancersController } from './freelancers.controller';
import { FreelancersService } from './freelancers.service';
import { Freelancer, FreelancerSchema } from './schemas/freelancer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Freelancer.name, schema: FreelancerSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [FreelancersController],
  providers: [FreelancersService],
  exports: [FreelancersService],
})
export class FreelancersModule {}
