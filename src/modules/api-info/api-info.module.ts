import { Module } from '@nestjs/common';
import { ApiInfoController } from './api-info.controller';

@Module({
  controllers: [ApiInfoController],
})
export class ApiInfoModule {}
