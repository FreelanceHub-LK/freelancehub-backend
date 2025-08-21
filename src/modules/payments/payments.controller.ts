import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  QueryPaymentDto,
  PaymentActionDto,
  EscrowReleaseDto,
  RefundDto,
  WithdrawDto,
} from './dto/index';
import { Payment, PaymentStatus } from './schemas/payment.schema';

@ApiTags('payments')
@Controller('payments')
@UseInterceptors(ClassSerializerInterceptor)
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment created successfully',
    type: 'object'
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    try {
      this.logger.log(`Creating payment for amount: ${createPaymentDto.amount}`);
      const result = await this.paymentsService.createPayment(createPaymentDto);
      return {
        success: true,
        message: 'Payment created successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to create payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payments retrieved successfully',
    type: 'object'
  })
  async findAll(@Query() queryDto: QueryPaymentDto) {
    try {
      this.logger.log(`Fetching payments with filters: ${JSON.stringify(queryDto)}`);
      const result = await this.paymentsService.findAll(queryDto);
      return {
        success: true,
        message: 'Payments retrieved successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch payments: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter stats by user ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment statistics retrieved successfully',
    type: 'object'
  })
  async getStats(@Query('userId') userId?: string) {
    try {
      this.logger.log(`Fetching payment stats${userId ? ` for user: ${userId}` : ''}`);
      const stats = await this.paymentsService.getPaymentStats(userId);
      return {
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch payment stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment retrieved successfully',
    type: Payment
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Fetching payment with ID: ${id}`);
      const payment = await this.paymentsService.findOne(id);
      return {
        success: true,
        message: 'Payment retrieved successfully',
        data: payment,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch payment ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment updated successfully',
    type: Payment
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    try {
      this.logger.log(`Updating payment ${id} with data: ${JSON.stringify(updatePaymentDto)}`);
      const payment = await this.paymentsService.update(id, updatePaymentDto);
      return {
        success: true,
        message: 'Payment updated successfully',
        data: payment,
      };
    } catch (error) {
      this.logger.error(`Failed to update payment ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':id/actions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform an action on a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment action performed successfully',
    type: 'object'
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Invalid action or payment state' })
  async performAction(@Param('id') id: string, @Body() actionDto: PaymentActionDto) {
    try {
      this.logger.log(`Performing action ${actionDto.action} on payment ${id}`);
      const result = await this.paymentsService.performAction(id, actionDto);
      return {
        success: true,
        message: `Payment action ${actionDto.action} performed successfully`,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to perform action on payment ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment refunded successfully',
    type: 'object'
  })
  @ApiResponse({ status: 400, description: 'Payment cannot be refunded' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refund(@Body() refundDto: RefundDto) {
    try {
      this.logger.log(`Processing refund for payment ${refundDto.paymentId}`);
      const payment = await this.paymentsService.findOne(refundDto.paymentId);
      const result = await this.paymentsService.refundPayment(
        payment,
        refundDto.refundAmount,
        refundDto.reason
      );
      return {
        success: true,
        message: 'Payment refunded successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to refund payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('escrow/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release funds from escrow' })
  @ApiResponse({ 
    status: 200, 
    description: 'Escrow released successfully',
    type: 'object'
  })
  @ApiResponse({ status: 400, description: 'Escrow cannot be released' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async releaseEscrow(@Body() escrowReleaseDto: EscrowReleaseDto) {
    try {
      this.logger.log(`Releasing escrow for payment ${escrowReleaseDto.paymentId}`);
      const payment = await this.paymentsService.findOne(escrowReleaseDto.paymentId);
      const result = await this.paymentsService.releaseEscrow(payment);
      return {
        success: true,
        message: 'Escrow released successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to release escrow: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw funds to external account' })
  @ApiResponse({ 
    status: 200, 
    description: 'Withdrawal initiated successfully',
    type: 'object'
  })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid withdrawal method' })
  async withdraw(@Body() withdrawDto: WithdrawDto) {
    try {
      this.logger.log(`Processing withdrawal of ${withdrawDto.amount} ${withdrawDto.currency}`);
      
      // This is a placeholder - implement withdrawal logic based on your requirements
      // You would typically:
      // 1. Check user's available balance
      // 2. Validate withdrawal method
      // 3. Create withdrawal record
      // 4. Process withdrawal with payment provider
      
      return {
        success: true,
        message: 'Withdrawal initiated successfully',
        data: {
          withdrawalId: 'generated-withdrawal-id',
          amount: withdrawDto.amount,
          currency: withdrawDto.currency,
          method: withdrawDto.withdrawalMethod,
          status: 'processing',
          estimatedArrival: '1-3 business days',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to process withdrawal: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related payments (refunds, escrow releases, etc.)' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Related payments retrieved successfully',
    type: 'object'
  })
  async getRelatedPayments(@Param('id') id: string) {
    try {
      this.logger.log(`Fetching related payments for payment ${id}`);
      const payment = await this.paymentsService.findOne(id);
      
      if (!payment.relatedPayments || payment.relatedPayments.length === 0) {
        return {
          success: true,
          message: 'No related payments found',
          data: {
            payment: payment,
            relatedPayments: [],
          },
        };
      }

      const relatedPaymentDetails = await Promise.all(
        payment.relatedPayments.map(relatedId => 
          this.paymentsService.findOne(relatedId.toString())
        )
      );

      return {
        success: true,
        message: 'Related payments retrieved successfully',
        data: {
          payment: payment,
          relatedPayments: relatedPaymentDetails,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch related payments: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleStripeWebhook(@Body() payload: any, @Headers('stripe-signature') signature: string) {
    try {
      this.logger.log('Processing Stripe webhook');
      
      // Verify webhook signature
      if (!signature) {
        throw new BadRequestException('Missing stripe-signature header');
      }

      // In a real implementation, you would verify the webhook signature here
      // const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      const event = payload;
      
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailed(event.data.object);
          break;
        case 'payment_intent.canceled':
          await this.handleStripePaymentCanceled(event.data.object);
          break;
        default:
          this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
      }
      
      return {
        success: true,
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to process Stripe webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('webhooks/paypal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle PayPal webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handlePayPalWebhook(@Body() payload: any, @Headers() headers: any) {
    try {
      this.logger.log('Processing PayPal webhook');
      
      // Verify webhook signature (in production, you should verify this)
      // const isValid = await this.verifyPayPalWebhook(payload, headers);
      // if (!isValid) {
      //   throw new BadRequestException('Invalid webhook signature');
      // }
      
      const event = payload;
      
      // Handle different event types
      switch (event.event_type) {
        case 'CHECKOUT.ORDER.APPROVED':
          await this.handlePayPalOrderApproved(event.resource);
          break;
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePayPalCaptureCompleted(event.resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePayPalCaptureDenied(event.resource);
          break;
        default:
          this.logger.warn(`Unhandled PayPal event type: ${event.event_type}`);
      }
      
      return {
        success: true,
        message: 'PayPal webhook processed successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to process PayPal webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('paypal/capture/:paymentId')
  @ApiOperation({ summary: 'Capture PayPal payment' })
  @ApiResponse({ status: 200, description: 'Payment captured successfully' })
  async capturePayPalPayment(
    @Param('paymentId') paymentId: string,
    @Body() captureDto: { paypalOrderId: string }
  ) {
    try {
      this.logger.log(`Capturing PayPal payment: ${paymentId}`);
      const result = await this.paymentsService.capturePayPalPayment(paymentId, captureDto.paypalOrderId);
      return {
        success: true,
        message: 'Payment captured successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to capture PayPal payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Webhook event handlers
  private async handleStripePaymentSucceeded(paymentIntent: any) {
    try {
      const payment = await this.paymentsService.findByMetadata('stripePaymentIntentId', paymentIntent.id);
      if (payment) {
        await this.paymentsService.updatePaymentStatus((payment._id as any).toString(), PaymentStatus.COMPLETED);
        this.logger.log(`Payment ${payment._id} marked as completed via Stripe webhook`);
      }
    } catch (error) {
      this.logger.error(`Error handling Stripe payment succeeded: ${error.message}`);
    }
  }

  private async handleStripePaymentFailed(paymentIntent: any) {
    try {
      const payment = await this.paymentsService.findByMetadata('stripePaymentIntentId', paymentIntent.id);
      if (payment) {
        await this.paymentsService.updatePaymentStatus((payment._id as any).toString(), PaymentStatus.FAILED);
        this.logger.log(`Payment ${payment._id} marked as failed via Stripe webhook`);
      }
    } catch (error) {
      this.logger.error(`Error handling Stripe payment failed: ${error.message}`);
    }
  }

  private async handleStripePaymentCanceled(paymentIntent: any) {
    try {
      const payment = await this.paymentsService.findByMetadata('stripePaymentIntentId', paymentIntent.id);
      if (payment) {
        await this.paymentsService.updatePaymentStatus((payment._id as any).toString(), PaymentStatus.CANCELLED);
        this.logger.log(`Payment ${payment._id} marked as cancelled via Stripe webhook`);
      }
    } catch (error) {
      this.logger.error(`Error handling Stripe payment canceled: ${error.message}`);
    }
  }

  private async handlePayPalOrderApproved(resource: any) {
    try {
      const payment = await this.paymentsService.findByMetadata('paypalOrderId', resource.id);
      if (payment) {
        this.logger.log(`PayPal order ${resource.id} approved for payment ${payment._id}`);
        // The order is approved but not yet captured
      }
    } catch (error) {
      this.logger.error(`Error handling PayPal order approved: ${error.message}`);
    }
  }

  private async handlePayPalCaptureCompleted(resource: any) {
    try {
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        const payment = await this.paymentsService.findByMetadata('paypalOrderId', orderId);
        if (payment) {
          await this.paymentsService.updatePaymentStatus((payment._id as any).toString(), PaymentStatus.COMPLETED);
          this.logger.log(`Payment ${payment._id} marked as completed via PayPal webhook`);
        }
      }
    } catch (error) {
      this.logger.error(`Error handling PayPal capture completed: ${error.message}`);
    }
  }

  private async handlePayPalCaptureDenied(resource: any) {
    try {
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        const payment = await this.paymentsService.findByMetadata('paypalOrderId', orderId);
        if (payment) {
          await this.paymentsService.updatePaymentStatus((payment._id as any).toString(), PaymentStatus.FAILED);
          this.logger.log(`Payment ${payment._id} marked as failed via PayPal webhook`);
        }
      }
    } catch (error) {
      this.logger.error(`Error handling PayPal capture denied: ${error.message}`);
    }
  }
}
