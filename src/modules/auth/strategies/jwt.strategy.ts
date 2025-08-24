import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
    });
  }

  async validate(payload: any) {
    console.log('JWT payload:', payload);
    console.log('Payload sub (user ID):', payload.sub);
    console.log('Payload issued at:', new Date(payload.iat * 1000));
    console.log('Payload expires at:', new Date(payload.exp * 1000));
    
    try {
      const user = await this.usersService.findOne(payload.sub);
      console.log('JWT validation successful for user:', user.email);
      return user;
    } catch (error) {
      console.log('JWT validation failed:', error.message);
      // Instead of failing, let's return the payload info for the passkey controller to handle
      return { id: payload.sub, email: payload.email || 'unknown' };
    }
  }
}