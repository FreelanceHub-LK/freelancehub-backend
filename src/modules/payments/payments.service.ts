import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  InternalServerErrorException,
  Logger,
  Inject
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigType } from '@nestjs/config';
import Stripe from 'stripe';
import * as CryptoJS from 'crypto-js';
import { 
  Payment, 
  PaymentDocument, 
  PaymentStatus, 
  PaymentType, 
  PaymentMethod 
} from './schemas/payment.schema';
import { 
  CreatePaymentDto, 
  UpdatePaymentDto, 
  QueryPaymentDto,
  PaymentActionDto,
  PaymentAction,
  EscrowReleaseDto,
  RefundDto,
  WithdrawDto
} from './dto/index';
import { PaymentUtils } from './utils/payment.utils';
import paymentConfig from '../../config/payment.config';

export interface PaymentResult {
  payment: Payment;
  clientSecret?: string;
  redirectUrl?: string;
  status: string;
  message: string;
}

export interface PaymentListResult {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @Inject(paymentConfig.KEY) private config: ConfigType<typeof paymentConfig>,
  ) {
    this.initializeStripe();
  }

  private initializeStripe(): void {
    if (this.config.stripe.secretKey) {
      this.stripe = new Stripe(this.config.stripe.secretKey, {
        apiVersion: this.config.stripe.apiVersion as any,
      });
      this.logger.log('Stripe initialized successfully');
    } else {
      this.logger.warn('Stripe secret key not configured');
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<PaymentResult> {
    try {
      this.logger.log(`Creating payment: ${JSON.stringify(createPaymentDto)}`);

      // Validate payment amount
      if (!PaymentUtils.validatePaymentAmount(createPaymentDto.amount, createPaymentDto.currency)) {
        throw new BadRequestException('Payment amount is below minimum threshold');
      }

      // Validate escrow configuration
      if (createPaymentDto.escrowDetails) {
        const escrowErrors = PaymentUtils.validateEscrowConfig(createPaymentDto.escrowDetails);
        if (escrowErrors.length > 0) {
          throw new BadRequestException(`Escrow validation failed: ${escrowErrors.join(', ')}`);
        }
      }

      // Calculate fees
      const platformFee = PaymentUtils.calculatePlatformFee(
        createPaymentDto.amount, 
        createPaymentDto.type
      );
      const processingFee = PaymentUtils.calculateProcessingFee(
        createPaymentDto.amount, 
        createPaymentDto.method
      );
      const netAmount = PaymentUtils.calculateNetAmount(
        createPaymentDto.amount, 
        platformFee, 
        processingFee
      );

      // Generate transaction reference
      const transactionId = PaymentUtils.generateTransactionRef(createPaymentDto.type);

      // Prepare escrow details
      let escrowDetails = createPaymentDto.escrowDetails;
      if (escrowDetails?.isEscrow && escrowDetails.autoReleaseEnabled && escrowDetails.autoReleaseDays) {
        escrowDetails.releaseDate = PaymentUtils.calculateAutoReleaseDate(escrowDetails.autoReleaseDays);
      }

      // Create payment record
      const paymentData = {
        ...createPaymentDto,
        payer: createPaymentDto.payerId,
        recipient: createPaymentDto.recipientId,
        project: createPaymentDto.projectId,
        transactionId,
        platformFee,
        processingFee,
        netAmount,
        escrowDetails,
        status: PaymentStatus.PENDING,
      };

      const payment = new this.paymentModel(paymentData);
      await payment.save();

      let result: PaymentResult = {
        payment: payment.toObject(),
        status: 'created',
        message: 'Payment created successfully'
      };

      // Process payment based on method
      switch (createPaymentDto.method) {
        case PaymentMethod.STRIPE:
          result = await this.processStripePayment(payment);
          break;
        case PaymentMethod.PAYPAL:
          result = await this.processPayPalPayment(payment);
          break;
        case PaymentMethod.WALLET:
          result = await this.processWalletPayment(payment);
          break;
        default:
          throw new BadRequestException('Unsupported payment method');
      }

      this.logger.log(`Payment created with ID: ${payment._id}`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to create payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process Stripe payment
   */
  private async processStripePayment(payment: PaymentDocument): Promise<PaymentResult> {
    try {
      if (!this.stripe) {
        throw new InternalServerErrorException('Stripe not initialized');
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: payment.amount,
        currency: payment.currency.toLowerCase(),
        payment_method_types: ['card'],
        metadata: {
          paymentId: (payment._id as any).toString(),
          type: payment.type,
          projectId: payment.project?.toString() || '',
        },
        description: payment.description || `${payment.type} payment`,
      });

      // Update payment with Stripe payment intent ID
      payment.metadata = {
        ...payment.metadata,
        stripePaymentIntentId: paymentIntent.id,
      };
      payment.status = PaymentStatus.PROCESSING;
      await payment.save();

      return {
        payment: payment.toObject(),
        clientSecret: paymentIntent.client_secret || undefined,
        status: 'processing',
        message: 'Payment intent created successfully'
      };

    } catch (error) {
      this.logger.error(`Stripe payment processing failed: ${error.message}`);
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = error.message;
      await payment.save();
      throw new InternalServerErrorException('Payment processing failed');
    }
  }

  /**
   * Process PayPal payment (placeholder)
   */
  private async processPayPalPayment(payment: PaymentDocument): Promise<PaymentResult> {
    // PayPal integration would go here
    payment.status = PaymentStatus.PROCESSING;
    await payment.save();

    return {
      payment: payment.toObject(),
      redirectUrl: `${process.env.FRONTEND_URL}/payment/paypal/${payment._id}`,
      status: 'processing',
      message: 'PayPal payment initiated'
    };
  }

  /**
   * Process wallet payment (internal balance)
   */
  private async processWalletPayment(payment: PaymentDocument): Promise<PaymentResult> {
    // Wallet payment logic would check user's internal balance
    // For now, mark as completed
    payment.status = PaymentStatus.COMPLETED;
    payment.processedAt = new Date();
    await payment.save();

    return {
      payment: payment.toObject(),
      status: 'completed',
      message: 'Wallet payment processed successfully'
    };
  }

  /**
   * Find all payments with filtering and pagination
   */
  async findAll(queryDto: QueryPaymentDto): Promise<PaymentListResult> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = queryDto;

      // Build filter query
      const query: any = {};
      
      if (filters.status) query.status = filters.status;
      if (filters.type) query.type = filters.type;
      if (filters.method) query.method = filters.method;
      if (filters.payerId) query.payer = filters.payerId;
      if (filters.recipientId) query.recipient = filters.recipientId;
      if (filters.projectId) query.project = filters.projectId;
      if (filters.transactionId) query.transactionId = filters.transactionId;
      if (filters.currency) query.currency = filters.currency;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;

      // Amount range filter
      if (filters.minAmount || filters.maxAmount) {
        query.amount = {};
        if (filters.minAmount) query.amount.$gte = filters.minAmount;
        if (filters.maxAmount) query.amount.$lte = filters.maxAmount;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      // Escrow filter
      if (filters.isEscrow !== undefined) {
        query['escrowDetails.isEscrow'] = filters.isEscrow;
      }

      // Refundable filter
      if (filters.isRefundable !== undefined) {
        query.isRefundable = filters.isRefundable;
      }

      // Pagination
      const skip = (page - 1) * limit;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const [payments, total] = await Promise.all([
        this.paymentModel
          .find(query)
          .populate('payer', 'name email')
          .populate('recipient', 'name email')
          .populate('project', 'title')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.paymentModel.countDocuments(query)
      ]);

      return {
        payments: payments.map(p => p.toObject()),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      this.logger.error(`Failed to fetch payments: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch payments');
    }
  }

  /**
   * Find a single payment by ID
   */
  async findOne(id: string): Promise<Payment> {
    try {
      const payment = await this.paymentModel
        .findById(id)
        .populate('payer', 'name email')
        .populate('recipient', 'name email')
        .populate('project', 'title')
        .populate('relatedPayments')
        .exec();

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      return payment.toObject();
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch payment ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch payment');
    }
  }

  /**
   * Update a payment
   */
  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    try {
      const payment = await this.paymentModel.findById(id);
      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      Object.assign(payment, updatePaymentDto);
      await payment.save();

      return payment.toObject();
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update payment ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update payment');
    }
  }

  /**
   * Perform actions on payments
   */
  async performAction(id: string, actionDto: PaymentActionDto): Promise<PaymentResult> {
    try {
      const payment = await this.paymentModel.findById(id);
      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      switch (actionDto.action) {
        case PaymentAction.CAPTURE:
          return await this.capturePayment(payment);
        case PaymentAction.CANCEL:
          return await this.cancelPayment(payment, actionDto.reason);
        case PaymentAction.REFUND:
          return await this.refundPayment(payment, actionDto.refundAmount, actionDto.reason);
        case PaymentAction.RELEASE_ESCROW:
          return await this.releaseEscrow(payment);
        default:
          throw new BadRequestException('Unsupported payment action');
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to perform action on payment ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to perform payment action');
    }
  }

  /**
   * Capture a payment
   */
  private async capturePayment(payment: PaymentDocument): Promise<PaymentResult> {
    if (payment.method === PaymentMethod.STRIPE && this.stripe) {
      const paymentIntentId = payment.metadata?.stripePaymentIntentId;
      if (paymentIntentId) {
        const intent = await this.stripe.paymentIntents.capture(paymentIntentId);
        payment.status = intent.status === 'succeeded' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
        payment.processedAt = new Date();
        await payment.save();
      }
    }

    return {
      payment: payment.toObject(),
      status: 'captured',
      message: 'Payment captured successfully'
    };
  }

  /**
   * Cancel a payment
   */
  private async cancelPayment(payment: PaymentDocument, reason?: string): Promise<PaymentResult> {
    payment.status = PaymentStatus.CANCELLED;
    payment.failureReason = reason || 'Payment cancelled';
    await payment.save();

    return {
      payment: payment.toObject(),
      status: 'cancelled',
      message: 'Payment cancelled successfully'
    };
  }

  /**
   * Refund a payment
   */
  async refundPayment(payment: Payment | PaymentDocument, refundAmount?: number, reason?: string): Promise<PaymentResult> {
    const paymentDoc = payment instanceof this.paymentModel ? 
      payment : 
      await this.paymentModel.findById((payment as any)._id || (payment as any).id);
    
    if (!paymentDoc) {
      throw new NotFoundException('Payment not found');
    }
    
    if (!PaymentUtils.canRefund(paymentDoc.toObject())) {
      throw new BadRequestException('Payment cannot be refunded');
    }

    const refundAmountFinal = refundAmount || paymentDoc.amount;
    
    // Create refund record
    const refundPayment = new this.paymentModel({
      amount: refundAmountFinal,
      currency: paymentDoc.currency,
      type: PaymentType.REFUND,
      method: paymentDoc.method,
      payer: paymentDoc.recipient, // Refund goes back to original payer
      recipient: paymentDoc.payer,
      parentPayment: paymentDoc._id,
      description: `Refund for payment ${paymentDoc.transactionId}`,
      status: PaymentStatus.PROCESSING,
      metadata: {
        originalPaymentId: (paymentDoc._id as any).toString(),
        refundReason: reason,
      },
    });

    await refundPayment.save();

    // Update original payment
    paymentDoc.relatedPayments.push(refundPayment._id as any);
    paymentDoc.status = refundAmountFinal === paymentDoc.amount ? 
      PaymentStatus.REFUNDED : PaymentStatus.PARTIAL_REFUND;
    await paymentDoc.save();

    return {
      payment: refundPayment.toObject(),
      status: 'refunded',
      message: 'Refund processed successfully'
    };
  }

  /**
   * Release funds from escrow
   */
  async releaseEscrow(payment: Payment | PaymentDocument): Promise<PaymentResult> {
    const paymentDoc = payment instanceof this.paymentModel ? 
      payment : 
      await this.paymentModel.findById((payment as any)._id || (payment as any).id);
    
    if (!paymentDoc) {
      throw new NotFoundException('Payment not found');
    }
    
    if (!PaymentUtils.canReleaseEscrow(paymentDoc.toObject())) {
      throw new BadRequestException('Escrow cannot be released');
    }

    // Create escrow release record
    const escrowRelease = new this.paymentModel({
      amount: paymentDoc.netAmount,
      currency: paymentDoc.currency,
      type: PaymentType.ESCROW_RELEASE,
      method: paymentDoc.method,
      payer: paymentDoc.payer,
      recipient: paymentDoc.recipient,
      parentPayment: paymentDoc._id,
      description: `Escrow release for payment ${paymentDoc.transactionId}`,
      status: PaymentStatus.COMPLETED,
      processedAt: new Date(),
      metadata: {
        originalPaymentId: (paymentDoc._id as any).toString(),
        releaseType: 'manual',
      },
    });

    await escrowRelease.save();

    // Update original payment
    paymentDoc.relatedPayments.push(escrowRelease._id as any);
    if (paymentDoc.escrowDetails) {
      paymentDoc.escrowDetails.isEscrow = false;
    }
    await paymentDoc.save();

    return {
      payment: escrowRelease.toObject(),
      status: 'released',
      message: 'Escrow released successfully'
    };
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(userId?: string): Promise<any> {
    try {
      const matchStage: any = { isActive: true };
      if (userId) {
        matchStage.$or = [{ payer: userId }, { recipient: userId }];
      }

      const stats = await this.paymentModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalPlatformFees: { $sum: '$platformFee' },
            completedPayments: {
              $sum: { $cond: [{ $eq: ['$status', PaymentStatus.COMPLETED] }, 1, 0] }
            },
            pendingPayments: {
              $sum: { $cond: [{ $eq: ['$status', PaymentStatus.PENDING] }, 1, 0] }
            },
            failedPayments: {
              $sum: { $cond: [{ $eq: ['$status', PaymentStatus.FAILED] }, 1, 0] }
            },
            escrowPayments: {
              $sum: { $cond: ['$escrowDetails.isEscrow', 1, 0] }
            },
          }
        }
      ]);

      return stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        totalPlatformFees: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        escrowPayments: 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get payment stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get payment statistics');
    }
  }
}
