# Stripe Subscriptions Setup Guide

This Next.js 15 application demonstrates Stripe subscription integration with the following features:

## Features

- ✅ Subscription plan selection UI
- ✅ Stripe Checkout integration
- ✅ Success and cancel pages
- ✅ Customer dashboard
- ✅ Stripe Customer Portal integration
- ✅ Webhook handling for subscription events

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Stripe Test Keys (for development)
STRIPE_SECRET_KEY_TEST=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET_TEST=whsec_xxxxx

# Test Price IDs (create these in Stripe Dashboard test mode)
STRIPE_PRICE_ID_PREMIUM_TEST=price_xxxxx
STRIPE_PRICE_ID_PRO_TEST=price_xxxxx

# Optional: Live keys for production
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID_PREMIUM=price_your_premium_price_id_here
STRIPE_PRICE_ID_PRO=price_your_pro_price_id_here
```

## Setup Instructions

### 1. Create Products and Prices in Stripe Dashboard

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add Product**
3. Create products for each plan:
   - **Premium Plan**: $29/month
   - **Pro Plan**: $49/month
   - **Enterprise Plan**: $99/month
4. Copy the Price IDs and add them to your `.env.local`

### 2. Set Up Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://yourdomain.com/api/webhooks`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook secret and add it to `.env.local`

### 3. Enable Customer Portal

1. In Stripe Dashboard, go to **Settings** → **Billing** → **Customer Portal**
2. Configure the portal settings:
   - Enable subscription management
   - Allow customers to cancel subscriptions
   - Allow customers to update payment methods
3. Save the configuration

### 4. Test the Integration

1. Run the development server:

   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Test the subscription flow:
   - Click on a subscription plan
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete the checkout process
   - Verify webhook events are received

## Test Cards

Use these Stripe test cards for testing:

- **Successful payment**: `4242 4242 4242 4242`
- **Declined payment**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── create-checkout-session/route.ts
│   │   ├── create-portal-session/route.ts
│   │   └── webhooks/route.ts
│   ├── dashboard/page.tsx
│   ├── success/page.tsx
│   ├── cancel/page.tsx
│   └── page.tsx
├── components/
│   └── SubscriptionCard.tsx
└── lib/
    └── stripe.ts
```

## Next Steps

1. **Database Integration**: Store customer and subscription data
2. **User Authentication**: Add user login/signup
3. **Subscription Status**: Check subscription status on protected routes
4. **Email Notifications**: Send confirmation emails
5. **Analytics**: Track subscription metrics

## Production Considerations

- Use environment-specific Stripe keys
- Implement proper error handling
- Add logging and monitoring
- Set up proper webhook security
- Implement rate limiting
- Add database backup strategies

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**: Check endpoint URL and webhook secret
2. **Checkout not redirecting**: Verify publishable key is correct
3. **Portal not loading**: Ensure customer portal is enabled in Stripe Dashboard

### Debug Mode

Enable Stripe debug mode by adding to `.env.local`:

```env
STRIPE_DEBUG=true
```

This will provide more detailed error messages in the console.
