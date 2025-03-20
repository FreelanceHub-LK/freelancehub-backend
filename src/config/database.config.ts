import { registerAs } from '@nestjs/config';
import { Otp } from 'src/modules/auth/schemas/otp.schema';
import { Client } from 'src/modules/clients/client.schema';
import { Freelancer } from 'src/modules/freelancers/schemas/freelancer.schema';
import { User } from 'src/modules/users/schemas/user.schema';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI,
  user: process.env.MONGODB_USER,
  password: process.env.MONGODB_PASSWORD,
  entities: [User, Otp, Freelancer, Client],
  synchronize: true,
}));
