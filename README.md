# Stripe Subscription App with Supabase Auth

A comprehensive Next.js 15 application demonstrating Stripe subscription integration with Supabase authentication. This app showcases how to build a complete subscription-based SaaS application with user management, payment processing, and subscription lifecycle management.

## 🏗️ Architecture Overview

This application follows a modern full-stack architecture with the following key components:

### Frontend (Next.js 15)

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with Radix UI components
- **Authentication**: Supabase Auth with SSR support
- **State Management**: React hooks and server components

### Backend Services

- **Payment Processing**: Stripe API for subscriptions and billing
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT tokens
- **Webhooks**: Stripe webhooks for real-time subscription updates

### Key Integrations

- **Stripe Checkout**: For subscription creation
- **Stripe Customer Portal**: For subscription management
- **Stripe Webhooks**: For real-time subscription events
- **Supabase Auth**: For user authentication and session management

## 🔧 Essential Components

### 1. Configuration Management (`src/lib/config.ts`)

Centralized configuration handling with environment-based settings:

```typescript
export const config = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceIds: {
      premium: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM,
      pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
    },
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
};
```

### 2. Database Schema (`supabase_migration.sql`)

User-Stripe mapping table with RLS policies:

```sql
CREATE TABLE stripe_test_user_stripe_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Stripe Integration (`src/lib/stripe.ts`)

Server-side and client-side Stripe configuration:

```typescript
// Server-side Stripe instance
export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

// Client-side Stripe loader
export const getStripe = () => {
  const { loadStripe } = require("@stripe/stripe-js");
  return loadStripe(config.stripe.publishableKey);
};
```

### 4. Supabase Integration

- **Client-side**: `src/lib/supabase/client.ts` - Browser client
- **Server-side**: `src/lib/supabase/server.ts` - SSR client with cookies
- **Database utilities**: `src/lib/supabase/database.ts` - User-Stripe mapping functions

## 🚀 Core Features

### 1. Subscription Creation Flow

1. User selects a plan on the homepage
2. `SubscriptionCard` component triggers checkout
3. API route creates Stripe checkout session
4. User completes payment via Stripe Checkout
5. Webhook handles successful payment
6. User-Stripe mapping is created in database

### 2. Subscription Management

- **Dashboard**: View current subscription details
- **Upgrade/Downgrade**: Switch between plans with proration
- **Customer Portal**: Stripe-hosted subscription management
- **Real-time Updates**: Webhook-driven subscription status changes

### 3. User Authentication

- **Sign Up/Login**: Supabase Auth with email/password
- **Session Management**: SSR-compatible session handling
- **Protected Routes**: Middleware-based route protection
- **User Context**: Global user state management

## 📋 API Routes

### `/api/create-checkout-session`

Creates Stripe checkout sessions for new subscriptions:

- Validates user authentication
- Gets or creates Stripe customer
- Handles Guest customer migration
- Creates checkout session with proper metadata

### `/api/webhooks`

Handles Stripe webhook events:

- Verifies webhook signatures
- Processes subscription lifecycle events
- Creates user-Stripe mappings
- Handles customer creation and updates

### `/api/modify-subscription`

Manages subscription changes:

- Validates user authentication
- Retrieves current subscription
- Updates subscription with new price
- Handles proration and billing

### `/api/create-portal-session`

Creates Stripe Customer Portal sessions:

- Validates user authentication
- Creates portal session for subscription management
- Handles portal configuration errors

## 🔄 Subscription Lifecycle

### 1. New Subscription

```
User selects plan → Checkout session → Payment → Webhook → Database mapping → Dashboard access
```

### 2. Subscription Management

```
Dashboard → Customer Portal → Stripe-hosted management → Webhook updates → Database sync
```

### 3. Plan Changes

```
Upgrade page → API call → Stripe subscription update → Proration → Webhook → Database update
```

## 🛠️ Essential Setup for Duplication

### 1. Environment Variables

Create `.env.local` with:

```env
# Stripe Configuration
STRIPE_SECRET_KEY_TEST=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET_TEST=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_TEST=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_TEST=price_xxxxx

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Stripe Dashboard Setup

1. **Create Products and Prices**:

   - Premium Plan: $29/month
   - Pro Plan: $49/month
   - Copy Price IDs to environment variables

2. **Configure Webhooks**:

   - Endpoint: `https://yourdomain.com/api/webhooks`
   - Events: `checkout.session.completed`, `customer.subscription.*`

3. **Enable Customer Portal**:
   - Settings → Billing → Customer Portal
   - Enable subscription management features

### 3. Supabase Setup

1. **Create Project**: New Supabase project
2. **Run Migration**: Execute `supabase_migration.sql`
3. **Configure Auth**: Enable email/password authentication
4. **Set RLS Policies**: Ensure proper security policies

### 4. Dependencies

```json
{
  "dependencies": {
    "@stripe/stripe-js": "^8.0.0",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.75.0",
    "next": "15.5.5",
    "react": "19.1.0",
    "stripe": "^19.1.0"
  }
}
```

## 🔐 Security Features

### 1. Row Level Security (RLS)

- Users can only access their own Stripe mappings
- Database-level security enforcement
- Automatic user context validation

### 2. Webhook Security

- Stripe signature verification
- Environment-specific webhook secrets
- Request validation and error handling

### 3. Authentication Flow

- JWT-based session management
- Server-side session validation
- Protected API routes
- Automatic session refresh

## 🎯 Key Patterns for Duplication

### 1. User-Stripe Mapping Pattern

```typescript
// Create mapping when user subscribes
await createUserStripeMapping(userId, stripeCustomerId);

// Retrieve mapping for subscription management
const mapping = await getUserStripeMapping(userId);
```

### 2. Guest Customer Handling

```typescript
// Handle Stripe Guest customers (limited functionality)
const customerId = await ensureProperCustomer(
  existingCustomerId,
  userEmail,
  userId
);
```

### 3. Subscription Status Checking

```typescript
// Check if user has active subscription
const subscription = await stripe.subscriptions.list({
  customer: mapping.stripe_customer_id,
  status: "active",
  limit: 1,
});
```

### 4. Webhook Event Processing

```typescript
// Process subscription events
switch (event.type) {
  case "checkout.session.completed":
    // Create user-Stripe mapping
    break;
  case "customer.subscription.updated":
    // Handle subscription changes
    break;
}
```

## 🚀 Getting Started

1. **Clone and Install**:

   ```bash
   git clone <repository>
   cd stripe-test-with-subscriptions
   npm install
   ```

2. **Environment Setup**:

   - Copy `.env.local.example` to `.env.local`
   - Fill in your Stripe and Supabase credentials

3. **Database Setup**:

   - Run the Supabase migration
   - Verify RLS policies are active

4. **Stripe Setup**:

   - Create products and prices
   - Configure webhooks
   - Enable customer portal

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📊 Monitoring and Debugging

### Debug Information

The app includes comprehensive logging:

- Configuration validation
- Stripe API calls
- Webhook event processing
- Database operations
- Error handling and recovery

### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Authentication Required**: `4000 0025 0000 3155`

## 🔄 Production Considerations

1. **Environment Separation**: Use production Stripe keys
2. **Webhook Security**: Verify all webhook signatures
3. **Error Handling**: Implement comprehensive error recovery
4. **Monitoring**: Set up logging and alerting
5. **Database Backups**: Regular Supabase backups
6. **Rate Limiting**: Implement API rate limiting
7. **SSL/TLS**: Ensure all communications are encrypted

This application provides a solid foundation for building subscription-based SaaS applications with modern web technologies and best practices for security, scalability, and user experience.
