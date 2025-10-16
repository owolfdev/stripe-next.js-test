import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY_TEST) {
  throw new Error("STRIPE_SECRET_KEY_TEST is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

export const getStripe = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST) {
    throw new Error(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST is not set in environment variables"
    );
  }

  const { loadStripe } = require("@stripe/stripe-js");
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST);
};
