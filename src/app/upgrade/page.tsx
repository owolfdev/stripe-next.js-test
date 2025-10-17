import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getUserStripeMapping } from "@/lib/supabase/database";
import UpgradeButton from "@/components/UpgradeButton";
import {
  getCurrentProductConfig,
  shouldShowProduct,
  getProductSortOrder,
} from "@/lib/product-config";
import Stripe from "stripe";
import Link from "next/link";

// Force dynamic rendering to avoid Supabase issues during build
export const dynamic = "force-dynamic";

async function getCurrentSubscription(userId: string) {
  try {
    console.log("getCurrentSubscription - User ID:", userId);
    const mapping = await getUserStripeMapping(userId);
    console.log("getCurrentSubscription - Mapping:", mapping);

    if (!mapping) {
      console.log("getCurrentSubscription - No mapping found");
      return null;
    }

    console.log(
      "getCurrentSubscription - Customer ID:",
      mapping.stripe_customer_id
    );

    console.log("getCurrentSubscription - About to call Stripe API...");

    const subscriptions = await stripe.subscriptions.list({
      customer: mapping.stripe_customer_id,
      status: "all", // Include all statuses like dashboard
      limit: 1,
      expand: ["data.items.data.price"], // Reduce expansion depth to avoid limit
    });

    console.log("getCurrentSubscription - Stripe API call completed");

    console.log(
      "getCurrentSubscription - Found subscriptions:",
      subscriptions.data.length
    );
    console.log(
      "getCurrentSubscription - Subscription data:",
      subscriptions.data
    );

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      console.log(
        "getCurrentSubscription - Subscription status:",
        subscription.status
      );
      console.log("getCurrentSubscription - Subscription ID:", subscription.id);

      // Only return if status is active
      if (subscription.status === "active") {
        // Fetch product details separately to avoid expansion limit
        const priceId = subscription.items.data[0]?.price.id;
        if (priceId) {
          try {
            const price = await stripe.prices.retrieve(priceId, {
              expand: ["product"],
            });
            // Replace the price in the subscription with the expanded version
            subscription.items.data[0].price = price;
          } catch (error) {
            console.log("Error fetching price details:", error);
          }
        }
        return subscription;
      } else {
        console.log(
          "getCurrentSubscription - Subscription not active, status:",
          subscription.status
        );
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

async function getPrices() {
  try {
    console.log("getPrices - About to call Stripe API...");
    const prices = await stripe.prices.list({
      expand: ["data.product"],
      active: true,
    });
    console.log(
      "getPrices - Stripe API call completed, found:",
      prices.data.length
    );

    const productFilter = getCurrentProductConfig();
    console.log("getPrices - Product filter config:", productFilter);

    // Temporarily disable filtering to show all plans
    const filteredPrices = prices.data.filter((price) => {
      const product = price.product as Stripe.Product;
      const shouldShow = shouldShowProduct(product, price, productFilter);
      console.log(
        `getPrices - Price ${price.id} (${product.name}): ${
          shouldShow ? "SHOW" : "HIDE"
        }`
      );
      // For now, show all prices to debug the filtering issue
      return true; // Temporarily show all prices
    });

    filteredPrices.sort((a, b) => {
      const productA = a.product as Stripe.Product;
      const productB = b.product as Stripe.Product;
      return getProductSortOrder(productA) - getProductSortOrder(productB);
    });

    console.log("getPrices - Filtered prices:", filteredPrices.length);
    return filteredPrices;
  } catch (error) {
    console.error("Error fetching prices:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

export default async function UpgradePage() {
  // Get the authenticated user
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please log in to manage your subscription.
          </p>
          <Link
            href="/auth/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  console.log("UpgradePage - User:", { id: user.id, email: user.email });

  const [currentSubscription, prices] = await Promise.all([
    getCurrentSubscription(user.id),
    getPrices(),
  ]);

  console.log("UpgradePage - Current subscription:", currentSubscription);
  console.log("UpgradePage - Prices:", prices.length);

  const currentPriceId = currentSubscription?.items.data[0]?.price.id;
  const currentPrice = currentSubscription?.items.data[0]?.price;
  const currentProduct = currentPrice?.product as Stripe.Product;

  console.log("UpgradePage - Current price ID:", currentPriceId);
  console.log("UpgradePage - Current price:", currentPrice);
  console.log("UpgradePage - Current product:", currentProduct);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Manage Your Subscription
          </h1>
          <p className="text-xl text-gray-600">
            Upgrade, downgrade, or switch between plans
          </p>
        </div>

        {currentSubscription ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Current Subscription
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {currentPrice?.nickname ||
                    currentProduct?.name ||
                    "Current Plan"}
                </p>
                <p className="text-gray-600 mb-2">
                  Status:{" "}
                  <span className="text-green-600 font-medium">Active</span>
                </p>
                {currentPrice && (
                  <p className="text-gray-600">
                    Price:{" "}
                    <span className="font-medium">
                      {(currentPrice.unit_amount! / 100).toLocaleString()}{" "}
                      {currentPrice.currency?.toUpperCase()}/
                      {currentPrice.recurring?.interval}
                    </span>
                  </p>
                )}
                <p className="text-gray-600">
                  Next billing:{" "}
                  <span className="font-medium">
                    {(() => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const endDate = (currentSubscription as any)
                        .current_period_end;
                      if (endDate) {
                        return new Date(endDate * 1000).toLocaleDateString();
                      }
                      return "N/A";
                    })()}
                  </span>
                </p>
              </div>
              <div className="flex items-center justify-end">
                <Link
                  href="/dashboard"
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">
              No Active Subscription
            </h2>
            <p className="text-yellow-700 mb-4">
              You don&apos;t have an active subscription. Choose a plan below to
              get started.
            </p>
            <Link
              href="/dashboard"
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {prices.map((price) => {
            const product = price.product as Stripe.Product;
            const isCurrentPlan = currentPriceId === price.id;

            return (
              <div
                key={price.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden ${
                  isCurrentPlan ? "ring-2 ring-blue-500" : ""
                }`}
              >
                {price.nickname === "Pro Plan" && (
                  <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {price.nickname || product.name}
                  </h3>

                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {(price.unit_amount! / 100).toLocaleString()}
                    </span>
                    <span className="text-gray-600">
                      /{price.recurring?.interval}
                    </span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center text-gray-600">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Unlimited access to premium features
                    </li>
                    <li className="flex items-center text-gray-600">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Priority customer support
                    </li>
                    <li className="flex items-center text-gray-600">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Advanced analytics dashboard
                    </li>
                    <li className="flex items-center text-gray-600">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Custom integrations
                    </li>
                    <li className="flex items-center text-gray-600">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      API access with higher limits
                    </li>
                  </ul>

                  <UpgradeButton
                    priceId={price.id}
                    currentPriceId={currentPriceId}
                    title={price.nickname || product.name}
                    price={`${(price.unit_amount! / 100).toLocaleString()}/${
                      price.recurring?.interval
                    }`}
                    description={[
                      "Unlimited access to premium features",
                      "Priority customer support",
                      "Advanced analytics dashboard",
                      "Custom integrations",
                      "API access with higher limits",
                    ]}
                    popular={price.nickname === "Pro Plan"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
