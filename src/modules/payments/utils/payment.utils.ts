import { PaymentStatus, PaymentType, Payment } from '../schemas/payment.schema';

export class PaymentUtils {
  /**
   * Calculate platform fee based on amount and payment type
   */
  static calculatePlatformFee(amount: number, type: PaymentType): number {
    const baseFeePercentage = 0.05; // 5% platform fee
    let feeMultiplier = 1;

    switch (type) {
      case PaymentType.PROJECT_PAYMENT:
        feeMultiplier = 1;
        break;
      case PaymentType.MILESTONE_PAYMENT:
        feeMultiplier = 1;
        break;
      case PaymentType.ESCROW_RELEASE:
        feeMultiplier = 0; // No additional fee for escrow release
        break;
      case PaymentType.WITHDRAWAL:
        feeMultiplier = 0.5; // Reduced fee for withdrawals
        break;
      default:
        feeMultiplier = 1;
    }

    return Math.round(amount * baseFeePercentage * feeMultiplier);
  }

  /**
   * Calculate processing fee (Stripe/PayPal fees)
   */
  static calculateProcessingFee(amount: number, method: string): number {
    switch (method.toLowerCase()) {
      case 'stripe':
        // Stripe: 2.9% + $0.30
        return Math.round(amount * 0.029 + 30);
      case 'paypal':
        // PayPal: 2.9% + $0.30
        return Math.round(amount * 0.029 + 30);
      case 'bank_transfer':
        // Flat fee for bank transfers
        return 500; // $5.00
      default:
        return 0;
    }
  }

  /**
   * Calculate net amount after fees
   */
  static calculateNetAmount(amount: number, platformFee: number, processingFee: number): number {
    return amount - platformFee - processingFee;
  }

  /**
   * Generate unique transaction reference
   */
  static generateTransactionRef(type: PaymentType): string {
    const prefix = this.getTransactionPrefix(type);
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Get transaction prefix based on payment type
   */
  private static getTransactionPrefix(type: PaymentType): string {
    switch (type) {
      case PaymentType.PROJECT_PAYMENT:
        return 'PP';
      case PaymentType.MILESTONE_PAYMENT:
        return 'MP';
      case PaymentType.ESCROW_RELEASE:
        return 'ER';
      case PaymentType.REFUND:
        return 'RF';
      case PaymentType.WITHDRAWAL:
        return 'WD';
      case PaymentType.PLATFORM_FEE:
        return 'PF';
      default:
        return 'PY';
    }
  }

  /**
   * Check if payment can be refunded
   */
  static canRefund(payment: Payment): boolean {
    if (!payment.isRefundable) return false;
    if (payment.refundDeadline && new Date() > payment.refundDeadline) return false;
    
    // Check if payment is in a refundable state
    if (payment.status !== PaymentStatus.COMPLETED) return false;
    
    // Payment should not already be refunded (this would be tracked in related payments)
    return true;
  }

  /**
   * Check if escrow can be released
   */
  static canReleaseEscrow(payment: Payment): boolean {
    if (!payment.escrowDetails?.isEscrow) return false;
    if (payment.status !== PaymentStatus.COMPLETED) return false;
    
    // Check auto-release conditions
    if (payment.escrowDetails.autoReleaseEnabled && 
        payment.escrowDetails.releaseDate && 
        new Date() >= payment.escrowDetails.releaseDate) {
      return true;
    }

    return payment.status === PaymentStatus.COMPLETED;
  }

  /**
   * Validate payment amounts
   */
  static validatePaymentAmount(amount: number, currency: string = 'USD'): boolean {
    // Minimum amounts by currency (in cents)
    const minimumAmounts: Record<string, number> = {
      'USD': 50,  // $0.50
      'EUR': 50,  // €0.50
      'GBP': 30,  // £0.30
    };

    const minAmount = minimumAmounts[currency] || 50;
    return amount >= minAmount;
  }

  /**
   * Format amount for display
   */
  static formatAmount(amount: number, currency: string = 'USD'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });

    return formatter.format(amount / 100); // Convert from cents
  }

  /**
   * Calculate escrow auto-release date
   */
  static calculateAutoReleaseDate(days: number): Date {
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + days);
    return releaseDate;
  }

  /**
   * Get payment status description
   */
  static getStatusDescription(status: PaymentStatus): string {
    const descriptions: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'Payment is awaiting processing',
      [PaymentStatus.PROCESSING]: 'Payment is being processed',
      [PaymentStatus.COMPLETED]: 'Payment has been completed successfully',
      [PaymentStatus.FAILED]: 'Payment processing failed',
      [PaymentStatus.CANCELLED]: 'Payment was cancelled',
      [PaymentStatus.REFUNDED]: 'Payment has been fully refunded',
      [PaymentStatus.PARTIAL_REFUND]: 'Payment has been partially refunded',
    };

    return descriptions[status] || 'Unknown status';
  }

  /**
   * Validate escrow configuration
   */
  static validateEscrowConfig(escrowDetails: any): string[] {
    const errors: string[] = [];

    if (escrowDetails?.isEscrow) {
      if (escrowDetails.autoReleaseEnabled && !escrowDetails.autoReleaseDays) {
        errors.push('Auto-release days must be specified when auto-release is enabled');
      }

      if (escrowDetails.autoReleaseDays && escrowDetails.autoReleaseDays < 1) {
        errors.push('Auto-release days must be at least 1');
      }

      if (escrowDetails.autoReleaseDays && escrowDetails.autoReleaseDays > 365) {
        errors.push('Auto-release days cannot exceed 365 days');
      }
    }

    return errors;
  }
}