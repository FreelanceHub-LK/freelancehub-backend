import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.use(helmet());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Freelancer Platform API')
    .setDescription('API documentation for the Sri Lankan Freelancer Platform')
    .setVersion('1.0')
    .addTag('users')
    .addTag('freelancers')
    .addTag('clients')
    .addTag('projects')
    .addTag('auth')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 8000);
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
