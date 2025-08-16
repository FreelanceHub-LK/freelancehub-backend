import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiatePasskeyAuthenticationDto {
  @ApiProperty({
    description: 'User email for passkey authentication',
    example: 'user@example.com',
  })
  @IsString()
  email: string;
}

export class CompletePasskeyAuthenticationDto {
  @ApiProperty({
    description: 'WebAuthn authentication assertion response',
    example: {
      id: 'credential-id',
      rawId: 'raw-credential-id',
      response: {
        clientDataJSON: 'client-data',
        authenticatorData: 'authenticator-data',
        signature: 'signature',
        userHandle: 'user-handle',
      },
      type: 'public-key',
    },
  })
  @IsObject()
  credential: any;

  @ApiProperty({
    description: 'User email for passkey authentication',
    example: 'user@example.com',
  })
  @IsString()
  email: string;
}
