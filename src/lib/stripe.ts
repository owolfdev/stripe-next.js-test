import Stripe from "stripe";
import { config } from "./config";

if (!config.stripe.secretKey) {
  throw new Error(
    `Stripe secret key is not set. Please set ${
      config.isProduction ? "STRIPE_SECRET_KEY" : "STRIPE_SECRET_KEY_TEST"
    } in your environment variables.`
  );
}

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2025-09-30.clover",
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

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { loadStripe } = require("@stripe/stripe-js");
  return loadStripe(config.stripe.publishableKey);
};
