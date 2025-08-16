import { registerAs } from '@nestjs/config';

export interface PaymentConfig {
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    apiVersion: string;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
    environment: 'sandbox' | 'live';
  };
  platform: {
    feePercentage: number;
    minimumAmount: number;
    supportedCurrencies: string[];
    escrowSettings: {
      defaultAutoReleaseDays: number;
      maxAutoReleaseDays: number;
      enableAutoRelease: boolean;
    };
    refundSettings: {
      defaultRefundWindowDays: number;
      enablePartialRefunds: boolean;
    };
  };
  security: {
    encryptionKey: string;
    signatureSecret: string;
    enableIpWhitelist: boolean;
    allowedIps: string[];
  };
}

export default registerAs('payment', (): PaymentConfig => ({
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox',
  },
  platform: {
    feePercentage: Number(process.env.PLATFORM_FEE_PERCENTAGE) || 5,
    minimumAmount: Number(process.env.MINIMUM_PAYMENT_AMOUNT) || 50, // $0.50 in cents
    supportedCurrencies: (process.env.SUPPORTED_CURRENCIES || 'USD,EUR,GBP').split(','),
    escrowSettings: {
      defaultAutoReleaseDays: Number(process.env.DEFAULT_ESCROW_DAYS) || 14,
      maxAutoReleaseDays: Number(process.env.MAX_ESCROW_DAYS) || 365,
      enableAutoRelease: process.env.ENABLE_ESCROW_AUTO_RELEASE === 'true',
    },
    refundSettings: {
      defaultRefundWindowDays: Number(process.env.DEFAULT_REFUND_WINDOW_DAYS) || 30,
      enablePartialRefunds: process.env.ENABLE_PARTIAL_REFUNDS === 'true',
    },
  },
  security: {
    encryptionKey: process.env.PAYMENT_ENCRYPTION_KEY || '',
    signatureSecret: process.env.PAYMENT_SIGNATURE_SECRET || '',
    enableIpWhitelist: process.env.ENABLE_PAYMENT_IP_WHITELIST === 'true',
    allowedIps: (process.env.PAYMENT_ALLOWED_IPS || '').split(',').filter(Boolean),
  },
}));