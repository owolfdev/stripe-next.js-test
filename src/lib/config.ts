// Environment-based configuration for Stripe and Supabase
export const config = {
  // Detect environment
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",

  // Stripe configuration
  stripe: {
    // Server-side keys
    secretKey:
      process.env.NODE_ENV === "production"
        ? process.env.STRIPE_SECRET_KEY
        : process.env.STRIPE_SECRET_KEY_TEST,

    // Client-side keys
    publishableKey:
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST,

    // Webhook secrets
    webhookSecret:
      process.env.NODE_ENV === "production"
        ? process.env.STRIPE_WEBHOOK_SECRET
        : process.env.STRIPE_WEBHOOK_SECRET_TEST,

    // Price IDs
    priceIds: {
      premium:
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_TEST,
      pro:
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_TEST,
    },
  },

  // Supabase configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // App configuration
  app: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    environment: process.env.NODE_ENV || "development",
  },
};

// Validation function to ensure required environment variables are set
export function validateConfig() {
  const errors: string[] = [];

  // Check Stripe keys
  if (!config.stripe.secretKey) {
    errors.push(
      `Missing ${
        config.isProduction ? "STRIPE_SECRET_KEY" : "STRIPE_SECRET_KEY_TEST"
      }`
    );
  }

  if (!config.stripe.publishableKey) {
    errors.push(
      `Missing ${
        config.isProduction
          ? "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
          : "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST"
      }`
    );
  }

  if (!config.stripe.webhookSecret) {
    errors.push(
      `Missing ${
        config.isProduction
          ? "STRIPE_WEBHOOK_SECRET"
          : "STRIPE_WEBHOOK_SECRET_TEST"
      }`
    );
  }

  // Check price IDs
  if (!config.stripe.priceIds.premium) {
    errors.push(
      `Missing ${
        config.isProduction
          ? "NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM"
          : "NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_TEST"
      }`
    );
  }

  if (!config.stripe.priceIds.pro) {
    errors.push(
      `Missing ${
        config.isProduction
          ? "NEXT_PUBLIC_STRIPE_PRICE_ID_PRO"
          : "NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_TEST"
      }`
    );
  }

  // Check Supabase
  if (!config.supabase.url) {
    errors.push("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!config.supabase.anonKey) {
    errors.push("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (!config.supabase.serviceRoleKey) {
    errors.push("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
  }

  return true;
}

// Log current configuration (without sensitive data)
export function logConfig() {
  console.log("🔧 Configuration:", {
    environment: config.app.environment,
    isProduction: config.isProduction,
    stripeMode: config.isProduction ? "LIVE" : "TEST",
    hasStripeSecretKey: !!config.stripe.secretKey,
    hasStripePublishableKey: !!config.stripe.publishableKey,
    hasWebhookSecret: !!config.stripe.webhookSecret,
    hasPremiumPriceId: !!config.stripe.priceIds.premium,
    hasProPriceId: !!config.stripe.priceIds.pro,
    hasSupabaseUrl: !!config.supabase.url,
    hasSupabaseAnonKey: !!config.supabase.anonKey,
    hasSupabaseServiceKey: !!config.supabase.serviceRoleKey,
    siteUrl: config.app.siteUrl,
  });
}


