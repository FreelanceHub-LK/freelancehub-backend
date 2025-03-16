import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION || '86400', 10),
}));