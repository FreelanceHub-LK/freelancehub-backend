import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { Otp, OtpSchema } from './schemas/otp.schema';
import authConfig from 'src/config/auth.config';


@Module({
  imports: [
    ConfigModule,
    UsersModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule.forRoot({
          isGlobal: true,
          load: [authConfig],
          envFilePath: '.env',
        }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('auth.jwtSecret'),
        signOptions: { 
          expiresIn: `${configService.get('auth.jwtExpiration')}s`,
        },
      }),
    }),
    MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }])
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],

  exports: [AuthService],
})
export class AuthModule {}
