import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  Session,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PasskeyService } from '../services/passkey.service';
import { AuthService } from '../auth.service';
import {
  InitiatePasskeyRegistrationDto,
  CompletePasskeyRegistrationDto,
} from '../dto/passkey-registration.dto';
import {
  InitiatePasskeyAuthenticationDto,
  CompletePasskeyAuthenticationDto,
} from '../dto/passkey-authentication.dto';
import { UpdatePasskeyDto } from '../dto/update-passkey.dto';
import { Request } from 'express';

@ApiTags('passkeys')
@Controller('auth/passkeys')
export class PasskeyController {
  constructor(
    private passkeyService: PasskeyService,
    private authService: AuthService,
  ) {}

  @Post('register/initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate passkey registration for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Registration options generated successfully',
  })
  async initiateRegistration(
    @Body() dto: InitiatePasskeyRegistrationDto,
    @Req() req: Request,
    @Session() session: Record<string, any>,
  ) {
    const userId = req.user?.['id'];
    console.log('Full user object from JWT:', req.user);
    console.log('Extracted userId:', userId);
    console.log('UserId type:', typeof userId);
    
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    console.log('Initiating passkey registration for user:', userId);
    const options = await this.passkeyService.generateRegistrationOptions(
      userId,
      dto.deviceName,
    );

    // Store challenge in session
    session.currentChallenge = options.challenge;
    session.registrationUserId = userId;

    return options;
  }

  @Post('register/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete passkey registration' })
  @ApiResponse({
    status: 200,
    description: 'Passkey registered successfully',
  })
  async completeRegistration(
    @Body() dto: CompletePasskeyRegistrationDto,
    @Req() req: Request,
    @Session() session: Record<string, any>,
  ) {
    const userId = req.user?.['id'];
    const challenge = session.currentChallenge;
    const sessionUserId = session.registrationUserId;

    if (!userId || !challenge || userId !== sessionUserId) {
      throw new BadRequestException('Invalid registration session');
    }

    const result = await this.passkeyService.verifyRegistrationResponse(
      userId,
      dto.credential,
      challenge,
      dto.deviceName,
      dto.userAgent || req.headers['user-agent'],
    );

    // Clear session data
    delete session.currentChallenge;
    delete session.registrationUserId;

    return result;
  }

  @Post('authenticate/initiate')
  @ApiOperation({ summary: 'Initiate passkey authentication' })
  @ApiResponse({
    status: 200,
    description: 'Authentication options generated successfully',
  })
  async initiateAuthentication(
    @Body() dto: InitiatePasskeyAuthenticationDto,
    @Session() session: Record<string, any>,
  ) {
    const options = await this.passkeyService.generateAuthenticationOptions(dto.email);

    // Store challenge in session
    session.currentChallenge = options.challenge;
    session.authenticationEmail = dto.email;

    return options;
  }

  @Post('authenticate/complete')
  @ApiOperation({ summary: 'Complete passkey authentication' })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
  })
  async completeAuthentication(
    @Body() dto: CompletePasskeyAuthenticationDto,
    @Session() session: Record<string, any>,
  ) {
    const challenge = session.currentChallenge;
    const sessionEmail = session.authenticationEmail;

    if (!challenge || !sessionEmail || dto.email !== sessionEmail) {
      throw new BadRequestException('Invalid authentication session');
    }

    const result = await this.passkeyService.verifyAuthenticationResponse(
      dto.email,
      dto.credential,
      challenge,
    );

    // Clear session data
    delete session.currentChallenge;
    delete session.authenticationEmail;

    if (result.verified) {
      // Generate JWT token for successful authentication
      const authResponse = await this.authService.generateAuthResponse(result.user);
      return {
        ...authResponse,
        passkey: result.passkey,
      };
    }

    throw new BadRequestException('Authentication failed');
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user passkeys' })
  @ApiResponse({
    status: 200,
    description: 'List of user passkeys',
  })
  async getUserPasskeys(@Req() req: Request) {
    const userId = req.user?.['id'];
    return this.passkeyService.getUserPasskeys(userId);
  }

  @Put(':passkeyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update passkey device name' })
  @ApiParam({ name: 'passkeyId', description: 'Passkey ID' })
  @ApiResponse({
    status: 200,
    description: 'Passkey updated successfully',
  })
  async updatePasskey(
    @Param('passkeyId') passkeyId: string,
    @Body() dto: UpdatePasskeyDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.['id'];
    if (!dto.deviceName) {
      throw new BadRequestException('Device name is required');
    }
    return this.passkeyService.updatePasskey(userId, passkeyId, dto.deviceName);
  }

  @Delete(':passkeyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a passkey' })
  @ApiParam({ name: 'passkeyId', description: 'Passkey ID' })
  @ApiResponse({
    status: 200,
    description: 'Passkey deleted successfully',
  })
  async deletePasskey(
    @Param('passkeyId') passkeyId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.['id'];
    return this.passkeyService.deletePasskey(userId, passkeyId);
  }
}
