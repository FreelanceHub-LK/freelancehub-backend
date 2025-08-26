import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    }
  }));

  // Configure session for WebAuthn challenges
  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET') || 'your-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: configService.get<string>('NODE_ENV') === 'production',
        httpOnly: true,
        maxAge: 600000, // 10 minutes
      },
    }),
  );

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'connect-src': ["'self'", 'https:', 'http://localhost:3000'],
      },
    },
  }));
  
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Required for session support
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const config = new DocumentBuilder()
    .setTitle('Freelancer Platform API')
    .setDescription('API documentation for the Sri Lankan Freelancer Platform')
    .setVersion('1.0')
    .addTag('users')
    .addTag('freelancers')
    .addTag('clients')
    .addTag('projects')
    .addTag('auth')
    .addTag('passkeys')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 8000);
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
