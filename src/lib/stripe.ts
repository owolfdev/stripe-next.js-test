import Stripe from "stripe";
import { config, validateConfig } from "./config";

// Validate configuration on startup
try {
  validateConfig();
} catch (error) {
  console.error("❌ Configuration validation failed:", error);
  throw error;
}

if (!config.stripe.secretKey) {
  throw new Error(
    `Stripe secret key is not set. Please set ${
      config.isProduction ? "STRIPE_SECRET_KEY" : "STRIPE_SECRET_KEY_TEST"
    } in your environment variables.`
  );
}

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

export const getStripe = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!config.stripe.publishableKey) {
    throw new Error(
      `Stripe publishable key is not set. Please set ${
        config.isProduction
          ? "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
          : "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST"
      } in your environment variables.`
    );
  }

  const { loadStripe } = require("@stripe/stripe-js");
  return loadStripe(config.stripe.publishableKey);
};
