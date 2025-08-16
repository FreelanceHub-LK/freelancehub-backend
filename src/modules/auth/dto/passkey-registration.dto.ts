import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiatePasskeyRegistrationDto {
  @ApiProperty({
    description: 'Optional device name for identification',
    example: 'My iPhone',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class CompletePasskeyRegistrationDto {
  @ApiProperty({
    description: 'WebAuthn credential creation response',
    example: {
      id: 'credential-id',
      rawId: 'raw-credential-id',
      response: {
        clientDataJSON: 'client-data',
        attestationObject: 'attestation-object',
      },
      type: 'public-key',
    },
  })
  @IsObject()
  credential: any;

  @ApiProperty({
    description: 'Optional device name for identification',
    example: 'My iPhone',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiProperty({
    description: 'User agent string',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
