import { registerAs } from '@nestjs/config';
import { User } from 'src/modules/users/schemas/user.schema';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI,
  user: process.env.MONGODB_USER,
  password: process.env.MONGODB_PASSWORD,
  entities: [User],
  synchronize: true,
}));
