import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './gateways/messages.gateway';
import { Message, MessageSchema } from './schemas/message.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [MessagesController],
  providers: [
    MessagesService, 
    MessagesGateway,
    {
      provide: 'MessagesGateway',
      useExisting: MessagesGateway,
    },
  ],
  exports: [MessagesService, MessagesGateway, 'MessagesGateway'],
})
export class MessagesModule {}
