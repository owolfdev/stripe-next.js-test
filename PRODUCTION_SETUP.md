# Production Setup Guide

This guide will help you deploy your Stripe subscription app to production.

## 🚀 Prerequisites

1. **Stripe Account** - Live mode enabled
2. **Supabase Project** - Production instance
3. **Domain** - For your production app
4. **Hosting Platform** - Vercel, Netlify, etc.

## 📋 Step-by-Step Setup

### 1. Create Production Products in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products**
2. Create your products:
   - **Premium Plan** (e.g., $29/month)
   - **Pro Plan** (e.g., $49/month)
3. Note down the **Price IDs** (start with `price_`)

### 2. Set Up Production Webhook

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set URL: `https://yourdomain.com/api/webhooks`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook Secret** (starts with `whsec_`)

### 3. Configure Environment Variables

Copy `production-env-template.txt` to `.env.local` and fill in:

```env
# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_your_actual_live_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# Stripe Production Price IDs
NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM=price_your_premium_id
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_your_pro_id

# App Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NODE_ENV=production
```

### 4. Database Migration

Run the Supabase migration in your production database:

```sql
-- Copy and run the contents of supabase_migration.sql
-- in your Supabase Dashboard → SQL Editor
```

### 5. Deploy to Production

#### Option A: Vercel (Recommended)

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

#### Option B: Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Environment Detection

The app automatically detects the environment:

- **Development** (`NODE_ENV=development`): Uses test keys
- **Production** (`NODE_ENV=production`): Uses live keys

## ✅ Verification Checklist

- [ ] Products created in Stripe Dashboard
- [ ] Webhook endpoint configured
- [ ] Environment variables set
- [ ] Database migration run
- [ ] App deployed and accessible
- [ ] Test subscription creation
- [ ] Verify webhook events received

## 🛡️ Security Considerations

1. **Never commit** `.env.local` to version control
2. **Use HTTPS** for production
3. **Validate webhook signatures** (already implemented)
4. **Monitor Stripe Dashboard** for failed payments
5. **Set up error tracking** (Sentry, etc.)

## 🔍 Testing Production

1. Create a test subscription with a real card
2. Verify webhook events in Stripe Dashboard
3. Check customer portal functionality
4. Test subscription cancellation
5. Verify database mappings

## 📊 Monitoring

Monitor these in production:

- **Stripe Dashboard**: Failed payments, webhook failures
- **Supabase Dashboard**: Database errors, auth issues
- **App Logs**: API errors, configuration issues

## 🆘 Troubleshooting

### Common Issues:

1. **Webhook 404**: Check endpoint URL in Stripe
2. **Invalid signatures**: Verify webhook secret
3. **Price not found**: Check price IDs in Stripe
4. **Database errors**: Verify migration ran successfully

### Debug Mode:

The app includes a debug panel that shows:

- Current environment (TEST/PRODUCTION)
- Configuration status
- Stripe key availability

## 📞 Support

If you encounter issues:

1. Check the debug panel in your app
2. Review server logs
3. Check Stripe Dashboard for errors
4. Verify environment variables are set correctly

