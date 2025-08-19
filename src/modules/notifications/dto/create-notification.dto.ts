import { IsNotEmpty, IsString, IsOptional, IsEnum, IsObject, IsUrl, IsDateString } from 'class-validator';
import { NotificationType, NotificationPriority } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  triggeredBy?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
