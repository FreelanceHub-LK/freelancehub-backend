import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ description: 'User name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ description: 'Google ID', required: false })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({ description: 'Phone number', required: true })
  @IsOptional()
  @IsString()
  @MinLength(10)
  phoneNumber?: string;

  @ApiProperty({ description: 'User location', required: true })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    default: UserRole.FREELANCER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ description: 'User bio', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: 'Email verification status',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}
