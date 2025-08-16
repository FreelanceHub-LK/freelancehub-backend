# FreelanceHub Payment System

## Overview

The FreelanceHub payment system provides comprehensive payment processing capabilities for freelance platform operations including project payments, escrow management, refunds, and withdrawals.

## Features

### Payment Types
- **Project Payments**: Payments from clients to freelancers for completed work
- **Milestone Payments**: Partial payments for project milestones
- **Escrow Payments**: Secure payment holding until project completion
- **Refunds**: Full or partial payment refunds
- **Withdrawals**: Freelancer earnings withdrawal to external accounts
- **Platform Fees**: Automated platform commission collection

### Payment Methods
- **Stripe**: Credit/debit cards, bank transfers
- **PayPal**: PayPal account payments
- **Wallet**: Internal platform balance
- **Bank Transfer**: Direct bank account transfers

### Escrow System
- Secure fund holding until project completion
- Automatic release based on time or conditions
- Manual release by authorized parties
- Dispute resolution support
- Configurable release conditions

### Security Features
- Payment encryption
- Webhook signature verification
- IP whitelist support
- Transaction monitoring
- Fraud detection

## API Endpoints

### Core Payment Operations

#### Create Payment
```http
POST /api/payments
Content-Type: application/json

{
  "amount": 10000,
  "currency": "USD",
  "type": "project_payment",
  "method": "stripe",
  "payerId": "user_id",
  "recipientId": "freelancer_id",
  "projectId": "project_id",
  "description": "Payment for web development project",
  "escrowDetails": {
    "isEscrow": true,
    "autoReleaseEnabled": true,
    "autoReleaseDays": 14
  }
}
```

#### Get Payments
```http
GET /api/payments?page=1&limit=10&status=completed&type=project_payment
```

#### Get Single Payment
```http
GET /api/payments/{paymentId}
```

#### Update Payment
```http
PATCH /api/payments/{paymentId}
Content-Type: application/json

{
  "status": "completed",
  "transactionId": "stripe_transaction_id",
  "processedAt": "2023-12-01T10:00:00Z"
}
```

### Payment Actions

#### Refund Payment
```http
POST /api/payments/refund
Content-Type: application/json

{
  "paymentId": "payment_id",
  "refundAmount": 5000,
  "reason": "Client cancellation"
}
```

#### Release Escrow
```http
POST /api/payments/escrow/release
Content-Type: application/json

{
  "paymentId": "payment_id",
  "reason": "Project completed successfully"
}
```

#### Withdraw Funds
```http
POST /api/payments/withdraw
Content-Type: application/json

{
  "amount": 50000,
  "currency": "USD",
  "withdrawalMethod": "bank_account",
  "details": "Account ending in 1234"
}
```

#### Payment Actions
```http
POST /api/payments/{paymentId}/actions
Content-Type: application/json

{
  "action": "capture",
  "reason": "Payment authorized",
  "notes": "Additional processing notes"
}
```

### Analytics

#### Payment Statistics
```http
GET /api/payments/stats?userId=user_id
```

#### Related Payments
```http
GET /api/payments/{paymentId}/related
```

## Configuration

### Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2023-10-16

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox

# Platform Settings
PLATFORM_FEE_PERCENTAGE=5
MINIMUM_PAYMENT_AMOUNT=50
SUPPORTED_CURRENCIES=USD,EUR,GBP

# Escrow Settings
DEFAULT_ESCROW_DAYS=14
MAX_ESCROW_DAYS=365
ENABLE_ESCROW_AUTO_RELEASE=true

# Refund Settings
DEFAULT_REFUND_WINDOW_DAYS=30
ENABLE_PARTIAL_REFUNDS=true

# Security
PAYMENT_ENCRYPTION_KEY=your_encryption_key
PAYMENT_SIGNATURE_SECRET=your_signature_secret
ENABLE_PAYMENT_IP_WHITELIST=false
PAYMENT_ALLOWED_IPS=127.0.0.1,::1
```

## Database Schema

### Payment Collection
```javascript
{
  _id: ObjectId,
  amount: Number,          // Amount in cents
  currency: String,        // ISO currency code
  status: String,          // Payment status
  type: String,           // Payment type
  method: String,         // Payment method
  payer: ObjectId,        // Reference to User
  recipient: ObjectId,    // Reference to User
  project: ObjectId,      // Reference to Project
  transactionId: String,  // External transaction ID
  platformFee: Number,    // Platform fee amount
  processingFee: Number,  // Payment processor fee
  netAmount: Number,      // Amount after fees
  description: String,    // Payment description
  metadata: Object,       // Additional metadata
  escrowDetails: {
    isEscrow: Boolean,
    escrowReleaseConditions: [String],
    milestoneId: String,
    releaseDate: Date,
    autoReleaseEnabled: Boolean,
    autoReleaseDays: Number
  },
  processedAt: Date,
  failureReason: String,
  isRefundable: Boolean,
  refundDeadline: Date,
  relatedPayments: [ObjectId],
  parentPayment: ObjectId,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Integration Guide

### Stripe Integration

1. **Setup Stripe Account**
   - Create Stripe account
   - Get API keys
   - Configure webhooks

2. **Client-Side Integration**
   ```javascript
   // Initialize Stripe
   const stripe = Stripe('pk_test_...');
   
   // Create payment intent
   const response = await fetch('/api/payments', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(paymentData)
   });
   
   const { clientSecret } = await response.json();
   
   // Confirm payment
   const result = await stripe.confirmCardPayment(clientSecret, {
     payment_method: {
       card: cardElement,
       billing_details: { name: 'Customer Name' }
     }
   });
   ```

3. **Webhook Handling**
   ```javascript
   // Stripe webhook endpoint
   app.post('/api/payments/webhooks/stripe', (req, res) => {
     const sig = req.headers['stripe-signature'];
     const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
     
     switch (event.type) {
       case 'payment_intent.succeeded':
         // Handle successful payment
         break;
       case 'payment_intent.payment_failed':
         // Handle failed payment
         break;
     }
     
     res.json({ received: true });
   });
   ```

### PayPal Integration

1. **Setup PayPal Account**
   - Create PayPal developer account
   - Get client credentials
   - Configure webhooks

2. **Payment Processing**
   ```javascript
   // Create PayPal order
   const order = await paypal.orders.create({
     intent: 'CAPTURE',
     purchase_units: [{
       amount: {
         currency_code: 'USD',
         value: '100.00'
       }
     }]
   });
   ```

## Error Handling

### Common Error Codes
- `PAYMENT_001`: Invalid payment amount
- `PAYMENT_002`: Unsupported payment method
- `PAYMENT_003`: Insufficient funds
- `PAYMENT_004`: Payment processor error
- `PAYMENT_005`: Escrow configuration invalid
- `PAYMENT_006`: Refund not allowed
- `PAYMENT_007`: Duplicate payment

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_001",
    "message": "Payment amount is below minimum threshold",
    "details": {
      "minAmount": 50,
      "providedAmount": 25
    }
  }
}
```

## Testing

### Test Cards (Stripe)
- **Success**: 4242424242424242
- **Decline**: 4000000000000002
- **Auth Required**: 4000002500003155
- **Processing Error**: 4000000000000119

### Test Scenarios
1. Successful payment flow
2. Failed payment handling
3. Escrow creation and release
4. Refund processing
5. Webhook processing
6. Error handling

## Security Considerations

1. **Data Encryption**: All sensitive payment data is encrypted
2. **PCI Compliance**: Follow PCI DSS standards
3. **Webhook Verification**: Verify all webhook signatures
4. **IP Filtering**: Implement IP whitelisting for sensitive operations
5. **Rate Limiting**: Prevent abuse with rate limiting
6. **Audit Logging**: Log all payment operations
7. **Fraud Detection**: Monitor for suspicious activities

## Monitoring and Alerts

1. **Payment Failures**: Alert on high failure rates
2. **Processing Delays**: Monitor payment processing times
3. **Escrow Expiry**: Alert on upcoming escrow releases
4. **Refund Requests**: Track refund patterns
5. **Revenue Metrics**: Monitor platform fee collection

## Support and Troubleshooting

### Common Issues
1. **Payment Stuck in Processing**: Check with payment processor
2. **Webhook Not Received**: Verify webhook URL and signature
3. **Escrow Not Releasing**: Check release conditions
4. **Refund Failed**: Verify original payment status

### Debug Tools
- Payment logs
- Webhook event history
- Transaction timeline
- Error tracking

## Roadmap

### Planned Features
- Multi-currency support
- Cryptocurrency payments
- Advanced escrow conditions
- Automated fraud detection
- Enhanced analytics
- Mobile payment methods
- Subscription billing