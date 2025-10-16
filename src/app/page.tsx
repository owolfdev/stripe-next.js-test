import SubscriptionCard from "@/components/SubscriptionCard";
import DebugInfo from "@/components/DebugInfo";
import { AuthButton } from "@/components/auth-button";
import { stripe } from "@/lib/stripe";
import { config } from "@/lib/config";
import {
  getCurrentProductConfig,
  shouldShowProduct,
  getProductSortOrder,
} from "@/lib/product-config";

async function getPrices() {
  try {
    const prices = await stripe.prices.list({
      expand: ["data.product"],
      active: true, // Only get active prices
    });

    // Get the current product configuration based on environment
    const productFilter = getCurrentProductConfig();

    // Filter products using the advanced configuration
    const filteredPrices = prices.data.filter((price) => {
      const product = price.product as Stripe.Product;
      return shouldShowProduct(product, price, productFilter);
    });

    // Sort products by popularity and sort order
    filteredPrices.sort((a, b) => {
      const productA = a.product as Stripe.Product;
      const productB = b.product as Stripe.Product;
      return getProductSortOrder(productA) - getProductSortOrder(productB);
    });

    console.log(
      `Fetched ${prices.data.length} total prices, showing ${filteredPrices.length} filtered prices`
    );
    console.log("Current filter config:", productFilter);

    return filteredPrices;
  } catch (error) {
    console.error("Error fetching prices:", error);
    return [];
  }
}

export default async function Home() {
  const prices = await getPrices();
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-end mb-4">
            <AuthButton />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Subscription Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with our powerful subscription service. Choose the plan
            that fits your needs.
          </p>
        </div>

        <DebugInfo />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {prices.map((price) => {
            const product = price.product as Stripe.Product;
            const amount = (price.unit_amount || 0) / 100;
            const currency = price.currency?.toUpperCase() || "USD";

            // Get plan name from price metadata, fallback to product name
            const planName =
              price.metadata?.plan_name || product.name || "Plan";
            const isPopular =
              price.metadata?.popular === "true" || product.name === "Pro Plan";

            return (
              <SubscriptionCard
                key={price.id}
                title={planName}
                price={`${currency} ${amount}`}
                description={[
                  "Unlimited access to premium features",
                  "Priority customer support",
                  "Advanced analytics dashboard",
                  "Custom integrations",
                  "API access with higher limits",
                ]}
                priceId={price.id}
                popular={isPopular}
              />
            );
          })}

          {/* Fallback if no prices are fetched */}
          {prices.length === 0 && (
            <>
              <SubscriptionCard
                title="Premium"
                price="$29"
                description={[
                  "Unlimited access to premium features",
                  "Priority customer support",
                  "Advanced analytics dashboard",
                  "Custom integrations",
                  "API access with higher limits",
                ]}
                priceId={
                  config.stripe.priceIds.premium || "price_premium_placeholder"
                }
              />

              <SubscriptionCard
                title="Pro"
                price="$49"
                description={[
                  "Everything in Premium",
                  "White-label solution",
                  "Custom branding options",
                  "Dedicated account manager",
                  "24/7 phone support",
                  "Advanced security features",
                ]}
                priceId={config.stripe.priceIds.pro || "price_pro_placeholder"}
                popular={true}
              />
            </>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            All plans include a 30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
