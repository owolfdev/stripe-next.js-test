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
import { createClient } from "@/lib/supabase/server";
import { getUserStripeMapping } from "@/lib/supabase/database";
import Link from "next/link";
import Stripe from "stripe";

// Force dynamic rendering to avoid Supabase issues during build
export const dynamic = 'force-dynamic';

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

async function getUserSubscription(userId: string) {
  try {
    const mapping = await getUserStripeMapping(userId);
    if (!mapping) return null;

    const subscriptions = await stripe.subscriptions.list({
      customer: mapping.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    return subscriptions.data.length > 0 ? subscriptions.data[0] : null;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
}

export default async function Home() {
  // Check if user is authenticated and has an active subscription
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userSubscription = null;
  if (user) {
    userSubscription = await getUserSubscription(user.id);
  }

  const prices = await getPrices();

  // If user has an active subscription, show subscription management instead of plans
  if (user && userSubscription) {
    const currentPrice = userSubscription.items.data[0]?.price;
    const currentProduct = currentPrice?.product as Stripe.Product;
    const planName = currentPrice?.nickname || currentProduct?.name || "Current Plan";
    const amount = (currentPrice?.unit_amount || 0) / 100;
    const currency = currentPrice?.currency?.toUpperCase() || "USD";

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-end mb-4">
              <AuthButton />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome Back!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              You&apos;re already subscribed to our service. Manage your subscription or explore additional features.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Current Subscription
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {planName}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Status: <span className="text-green-600 font-medium">Active</span>
                  </p>
                  <p className="text-gray-600">
                    Price: <span className="font-medium">
                      {currency} {amount}/{currentPrice?.recurring?.interval}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col space-y-3">
                  <Link
                    href="/dashboard"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-center"
                  >
                    View Dashboard
                  </Link>
                  <Link
                    href="/upgrade"
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-center"
                  >
                    Manage Subscription
                  </Link>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Need to make changes?
              </h3>
              <p className="text-gray-600 mb-6">
                You can upgrade, downgrade, or cancel your subscription at any time.
              </p>
              <Link
                href="/upgrade"
                className="inline-flex items-center bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
              >
                Manage Your Subscription
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default homepage for non-subscribers
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
