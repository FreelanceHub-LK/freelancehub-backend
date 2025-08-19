import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationDto } from './create-notification.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
