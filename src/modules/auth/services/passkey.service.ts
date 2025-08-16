import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { Passkey, PasskeyDocument } from '../schemas/passkey.schema';
import { User } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';

@Injectable()
export class PasskeyService {
  private readonly rpName: string;
  private readonly rpID: string;
  private readonly origin: string;

  constructor(
    @InjectModel(Passkey.name) private passkeyModel: Model<PasskeyDocument>,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    this.rpName = this.configService.get<string>('WEBAUTHN_RP_NAME') || 'FreelanceHub';
    this.rpID = this.configService.get<string>('WEBAUTHN_RP_ID') || 'localhost';
    this.origin = this.configService.get<string>('WEBAUTHN_ORIGIN') || 'http://localhost:3000';
  }

  async generateRegistrationOptions(userId: string, deviceName?: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get existing passkeys for excludeCredentials
    const existingPasskeys = await this.passkeyModel.find({ 
      userId, 
      isActive: true 
    }).exec();

    const excludeCredentials = existingPasskeys.map(passkey => ({
      id: passkey.credentialId,
      type: 'public-key' as const,
    }));

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: new TextEncoder().encode(userId),
      userName: user.email,
      userDisplayName: `${user.firstName} ${user.lastName}`,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
    });

    return options;
  }

  async verifyRegistrationResponse(
    userId: string,
    response: RegistrationResponseJSON,
    challenge: string,
    deviceName?: string,
    userAgent?: string,
  ) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        requireUserVerification: false,
      });

      if (!verification.verified || !verification.registrationInfo) {
        throw new BadRequestException('Passkey registration verification failed');
      }

      const { credential } = verification.registrationInfo;

      // Check if credential already exists
      const existingPasskey = await this.passkeyModel.findOne({
        credentialId: credential.id,
      });

      if (existingPasskey) {
        throw new ConflictException('This passkey is already registered');
      }

      // Save the passkey
      const passkey = new this.passkeyModel({
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter,
        deviceName: deviceName || 'Unknown Device',
        deviceType: this.getDeviceType(userAgent),
        lastUsed: new Date(),
      });

      await passkey.save();

      // Update user passkey status
      const userPasskeyCount = await this.passkeyModel.countDocuments({
        userId,
        isActive: true,
      });
      await this.usersService.updatePasskeyStatus(userId, userPasskeyCount);

      return {
        verified: true,
        passkeyId: passkey._id,
        deviceName: passkey.deviceName,
      };
    } catch (error) {
      throw new BadRequestException(`Passkey registration failed: ${error.message}`);
    }
  }

  async generateAuthenticationOptions(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user's passkeys
    const userPasskeys = await this.passkeyModel.find({
      userId: user._id,
      isActive: true,
    }).exec();

    if (userPasskeys.length === 0) {
      throw new BadRequestException('No passkeys found for this user');
    }

    const allowCredentials = userPasskeys.map(passkey => ({
      id: passkey.credentialId,
      type: 'public-key' as const,
    }));

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    return options;
  }

  async verifyAuthenticationResponse(
    email: string,
    response: AuthenticationResponseJSON,
    challenge: string,
  ) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passkey = await this.passkeyModel.findOne({
      userId: user._id,
      credentialId: response.id,
      isActive: true,
    });

    if (!passkey) {
      throw new BadRequestException('Passkey not found');
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: passkey.credentialId,
          publicKey: Buffer.from(passkey.publicKey, 'base64'),
          counter: passkey.counter,
        },
        requireUserVerification: false,
      });

      if (!verification.verified) {
        throw new BadRequestException('Passkey authentication verification failed');
      }

      // Update counter and last used
      passkey.counter = verification.authenticationInfo.newCounter;
      passkey.lastUsed = new Date();
      await passkey.save();

      return {
        verified: true,
        user,
        passkey: {
          id: passkey._id,
          deviceName: passkey.deviceName,
          lastUsed: passkey.lastUsed,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Passkey authentication failed: ${error.message}`);
    }
  }

  async getUserPasskeys(userId: string) {
    return this.passkeyModel.find({
      userId,
      isActive: true,
    }).select('-publicKey -credentialId').exec();
  }

  async deletePasskey(userId: string, passkeyId: string) {
    const passkey = await this.passkeyModel.findOne({
      _id: passkeyId,
      userId,
    });

    if (!passkey) {
      throw new NotFoundException('Passkey not found');
    }

    passkey.isActive = false;
    await passkey.save();

    // Update user passkey status
    const userPasskeyCount = await this.passkeyModel.countDocuments({
      userId,
      isActive: true,
    });
    await this.usersService.updatePasskeyStatus(userId, userPasskeyCount);

    return { message: 'Passkey deleted successfully' };
  }

  async updatePasskey(userId: string, passkeyId: string, deviceName: string) {
    const passkey = await this.passkeyModel.findOne({
      _id: passkeyId,
      userId,
      isActive: true,
    });

    if (!passkey) {
      throw new NotFoundException('Passkey not found');
    }

    passkey.deviceName = deviceName;
    await passkey.save();

    return passkey;
  }

  private getDeviceType(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      return 'Mobile';
    } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  }
}
