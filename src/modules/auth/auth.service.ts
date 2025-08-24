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
import { User, UserDocument } from '../users/schemas/user.schema';
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
        // Safely convert to plain object to avoid circular references
        let userObj: any;
        if (user && typeof (user as any).toObject === 'function') {
          userObj = (user as any).toObject();
        } else if (user && typeof (user as any).toJSON === 'function') {
          userObj = (user as any).toJSON();
        } else {
          userObj = user;
        }
        const { password, ...result } = userObj;
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
      const userId = (user as any)._id?.toString() || (user as any).id;
      user = await this.usersService.update(userId, {
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
      const userId = (user as any)._id?.toString() || (user as any).id;
      user = await this.usersService.update(userId, {
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
    // Ensure we have a plain object to avoid circular references
    let userObj: any;
    if (user && typeof (user as any).toObject === 'function') {
      userObj = (user as any).toObject();
    } else if (user && typeof (user as any).toJSON === 'function') {
      userObj = (user as any).toJSON();
    } else {
      userObj = user;
    }

    const payload = {
      email: userObj.email,
      sub: userObj._id || userObj.id,
      role: userObj.role,
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
      id: userObj._id || userObj.id,
      name: userObj.name || `${userObj.firstName} ${userObj.lastName}`,
      email: userObj.email,
      role: userObj.role,
      profilePicture: userObj.profilePicture,
      accessToken,
      refreshToken,
      passkeyEnabled: userObj.passkeyEnabled || false,
      passkeyCount: userObj.passkeyCount || 0,
    });
  }

  async generateOtp(): Promise<string> {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async cleanupExpiredOtps(): Promise<void> {
    await this.otpModel.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }

  async sendOtp(sendOtpDto: SendOtpDto): Promise<{ message: string }> {
    const { email } = sendOtpDto;
    const normalizedEmail = email.toLowerCase().trim();

    // Clean up any expired OTPs
    await this.cleanupExpiredOtps();

    // Also clean up any existing unused OTPs for this email to prevent spam
    await this.otpModel.deleteMany({
      email: normalizedEmail,
      isUsed: false
    });

    const otp = await this.generateOtp();
    
    // Hash the OTP before storing it in the database
    const saltRounds = 10;
    const hashedOtp = await bcrypt.hash(otp, saltRounds);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    console.log('Creating OTP record:', {
      email: normalizedEmail,
      otpLength: otp.length,
      expiresAt,
    });

    const otpRecord = await this.otpModel.create({
      email: normalizedEmail,
      otp: hashedOtp, // Store the hashed OTP
      expiresAt,
      isUsed: false,
    });

    console.log('OTP record created with hashed OTP');

    // Send the plain OTP via email (not the hashed one)
    await this.emailService.sendOtpEmail(normalizedEmail, otp);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    const { email, otp } = verifyOtpDto;
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedOtp = otp.trim();

    // Add debugging logs
    console.log('Verifying OTP for:', { email: normalizedEmail, otpLength: trimmedOtp.length });
    console.log('Current time:', new Date());

    // Find all valid OTP records for this email (not expired and not used)
    const validOtpRecords = await this.otpModel.find({
      email: normalizedEmail,
      expiresAt: { $gt: new Date() },
      isUsed: false,
    }).sort({ createdAt: -1 });

    console.log(`Found ${validOtpRecords.length} valid OTP records for email`);

    let matchingOtpRecord: any = null;

    // Check each valid OTP record to see if the provided OTP matches
    for (const record of validOtpRecords) {
      const isMatch = await bcrypt.compare(trimmedOtp, record.otp);
      if (isMatch) {
        matchingOtpRecord = record;
        break;
      }
    }

    console.log('Matching OTP Record found:', !!matchingOtpRecord);

    if (!matchingOtpRecord) {
      // Additional debugging - check if any records exist for this email
      const allRecords = await this.otpModel.find({ email: normalizedEmail }).sort({ createdAt: -1 });
      console.log(`Total OTP records for email: ${allRecords.length}`);
      
      if (allRecords.length > 0) {
        const latestRecord = allRecords[0];
        console.log('Latest record expires at:', latestRecord.expiresAt);
        console.log('Latest record is used:', latestRecord.isUsed);
        
        if (latestRecord.expiresAt <= new Date()) {
          throw new UnauthorizedException('OTP has expired');
        }
        if (latestRecord.isUsed) {
          throw new UnauthorizedException('OTP has already been used');
        }
      }
      
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark the OTP as used
    matchingOtpRecord.isUsed = true;
    await matchingOtpRecord.save();
    
    // Update user email verification status
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (user) {
      const userId = (user as any)._id?.toString() || (user as any).id;
      await this.usersService.update(userId, { emailVerified: true });
    }

    return { message: 'Email verified successfully' };
  }
}
