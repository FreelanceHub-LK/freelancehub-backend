import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackURL:
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:8000/auth/google/callback',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION || '86400', 10),
}));
