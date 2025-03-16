import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified. Please verify your email to access this resource.');
    }
    
    return true;
  }
}