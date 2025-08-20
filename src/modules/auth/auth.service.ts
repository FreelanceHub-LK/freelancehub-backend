import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from '../users/schemas/user.schema';
import { EmailService } from '../email/email.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp } from './schemas/otp.schema';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password) {
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (isPasswordMatch) {
        const { password, ...result } = user.toObject();
        return result;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const newUser = await this.usersService.create(registerDto);

    return this.generateAuthResponse(newUser);
  }

  async googleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    let user = await this.usersService.findByEmail(req.user.email);
    console.log('User from Google:', user);

    if (!user) {
      user = await this.usersService.create({
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        googleId: req.user.googleId,
        profilePicture: req.user.profilePicture,
        emailVerified: true,
      });
    } else if (!user.googleId) {
      user = await this.usersService.update(user.id, {
        googleId: req.user.googleId,
        emailVerified: true,
      });
    }

    return this.generateAuthResponse(user);
  }

  async googleLoginDirect(googleUser: any) {
    if (!googleUser || !googleUser.email) {
      throw new UnauthorizedException('Invalid Google user data');
    }

    let user = await this.usersService.findByEmail(googleUser.email);
    console.log('User from Google (direct):', user);

    if (!user) {
      user = await this.usersService.create({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        googleId: googleUser.googleId,
        profilePicture: googleUser.profilePicture,
        emailVerified: true,
      });
    } else if (!user.googleId) {
      user = await this.usersService.update(user.id, {
        googleId: googleUser.googleId,
        emailVerified: true,
      });
    }

    return this.generateAuthResponse(user);
  }

  async refreshToken(userId: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.generateAuthResponse(user);
  }

  public generateAuthResponse(user: User | any): AuthResponseDto {
    const payload = {
      email: user.email,
      sub: user._id || user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('auth.jwtSecret'),
      expiresIn: this.configService.get('auth.jwtExpiration') + 's',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('auth.jwtSecret'),
      expiresIn: '7d',
    });

    return new AuthResponseDto({
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      accessToken,
      refreshToken,
      passkeyEnabled: user.passkeyEnabled || false,
      passkeyCount: user.passkeyCount || 0,
    });
  }

  async generateOtp(): Promise<string> {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(sendOtpDto: SendOtpDto): Promise<{ message: string }> {
    const { email } = sendOtpDto;

    const otp = await this.generateOtp();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.otpModel.create({
      email,
      otp,
      expiresAt,
      isUsed: false,
    });


    await this.emailService.sendOtpEmail(email, otp);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    const { email, otp } = verifyOtpDto;

    const otpRecord = await this.otpModel
      .findOne({
        email,
        otp,
        expiresAt: { $gt: new Date() },
        isUsed: false,
      })
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    otpRecord.isUsed = true;
    await otpRecord.save();
    const user = await this.usersService.findByEmail(email);
    if (user) {
      await this.usersService.update(user.id, { emailVerified: true });
    }

    return { message: 'Email verified successfully' };
  }
}
