// Enhanced pricing utilities for better plan management
import { stripe } from "./stripe";
import { config } from "./config";

export interface PlanDetails {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  description: string[];
  features: string[];
  popular: boolean;
  stripePriceId: string;
  stripeProductId: string;
}

// Cache for pricing data (optional optimization)
let cachedPlans: PlanDetails[] | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getPlans(): Promise<PlanDetails[]> {
  // Check cache first
  if (cachedPlans && Date.now() < cacheExpiry) {
    return cachedPlans;
  }

  try {
    const prices = await stripe.prices.list({
      expand: ["data.product"],
      active: true, // Only get active prices
    });

    // Filter out test products and unwanted plans
    const filteredPrices = prices.data.filter((price) => {
      const product = price.product as any;
      const productName = product.name?.toLowerCase() || "";

      // Filter out test products
      if (productName.includes("test")) {
        return false;
      }

      // Add other filters as needed
      return true;
    });

    const plans: PlanDetails[] = filteredPrices.map((price) => {
      const product = price.product as any;

      return {
        id: price.id,
        name: product.name || "Unknown Plan",
        price: (price.unit_amount || 0) / 100,
        currency: price.currency?.toUpperCase() || "USD",
        interval: price.recurring?.interval || "month",
        description: [
          "Unlimited access to premium features",
          "Priority customer support",
          "Advanced analytics dashboard",
          "Custom integrations",
          "API access with higher limits",
        ],
        features: product.metadata?.features?.split(",") || [
          "Unlimited access to premium features",
          "Priority customer support",
          "Advanced analytics dashboard",
          "Custom integrations",
          "API access with higher limits",
        ],
        popular: product.name?.toLowerCase().includes("pro") || false,
        stripePriceId: price.id,
        stripeProductId: product.id,
      };
    });

    // Cache the results
    cachedPlans = plans;
    cacheExpiry = Date.now() + CACHE_DURATION;

    return plans;
  } catch (error) {
    console.error("Error fetching plans from Stripe:", error);

    // Return fallback plans if Stripe API fails
    return getFallbackPlans();
  }
}

function getFallbackPlans(): PlanDetails[] {
  return [
    {
      id: "premium-fallback",
      name: "Premium",
      price: 29,
      currency: "USD",
      interval: "month",
      description: ["Premium features", "Support"],
      features: [
        "Unlimited access to premium features",
        "Priority customer support",
        "Advanced analytics dashboard",
        "Custom integrations",
        "API access with higher limits",
      ],
      popular: false,
      stripePriceId:
        config.stripe.priceIds.premium || "price_premium_placeholder",
      stripeProductId: "premium-product",
    },
    {
      id: "pro-fallback",
      name: "Pro",
      price: 49,
      currency: "USD",
      interval: "month",
      description: ["Pro features", "Advanced support"],
      features: [
        "Everything in Premium",
        "White-label solution",
        "Custom branding options",
        "Dedicated account manager",
        "24/7 phone support",
        "Advanced security features",
      ],
      popular: true,
      stripePriceId: config.stripe.priceIds.pro || "price_pro_placeholder",
      stripeProductId: "pro-product",
    },
  ];
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function getPlanById(planId: string): Promise<PlanDetails | null> {
  return getPlans().then(
    (plans) =>
      plans.find(
        (plan) => plan.id === planId || plan.stripePriceId === planId
      ) || null
  );
}
