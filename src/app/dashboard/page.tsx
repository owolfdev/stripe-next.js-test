import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getUserStripeMapping } from "@/lib/supabase/database";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import Link from "next/link";
import Stripe from "stripe";

async function getUserSubscription(): Promise<Stripe.Subscription | null> {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("User not authenticated");
      return null;
    }

    // Get user's Stripe customer ID
    const mapping = await getUserStripeMapping(user.id);
    console.log("Database mapping result:", mapping);

    if (!mapping) {
      console.log("No Stripe customer found for user in database");
      console.log("User ID:", user.id);
      console.log("User email:", user.email);
      return null;
    }

    console.log(
      "Found mapping - Stripe customer ID:",
      mapping.stripe_customer_id
    );

    // Get user's subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: mapping.stripe_customer_id,
      limit: 1,
      expand: ["data.customer"],
      status: "all", // Include all statuses
    });

    console.log(
      `Found ${subscriptions.data.length} subscriptions for user ${user.email}`
    );

    if (subscriptions.data.length > 0) {
      console.log("User subscription:", {
        id: subscriptions.data[0].id,
        status: subscriptions.data[0].status,
        customer: (subscriptions.data[0].customer as Stripe.Customer)?.id,
        priceId: subscriptions.data[0].items.data[0]?.price?.id,
      });
    }

    return subscriptions.data[0] || null;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function DashboardPage() {
  // Get the current authenticated user from Supabase
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subscription = await getUserSubscription();

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              No Active Subscription
            </h1>
            <p className="text-gray-600 mb-4">
              You don&apos;t have any active subscriptions. Create a
              subscription to see your dashboard.
            </p>
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const customer = subscription.customer as Stripe.Customer;
  const price = subscription.items.data[0]?.price;
  const amount = (price?.unit_amount || 0) / 100;
  const currency = price?.currency?.toUpperCase() || "USD";

  // Get product name separately since we can't expand it in the subscription query
  let productName = "Unknown Plan";
  try {
    if (price?.product) {
      const product = await stripe.products.retrieve(price.product as string);
      productName = product.name;
    }
  } catch (error) {
    console.error("Error fetching product:", error);
  }

  // Get full customer details from Stripe to show email
  let customerEmail = "Unknown";
  try {
    const customerDetails = await stripe.customers.retrieve(customer.id);
    if (customerDetails && !customerDetails.deleted) {
      customerEmail = customerDetails.email || "No email on file";
    }
  } catch (error) {
    console.error("Error fetching customer details:", error);
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Subscription Dashboard
            </h1>

            {/* User Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">
                    Supabase User:
                  </span>
                  <span className="ml-2 text-blue-700">
                    {user?.email || "Not authenticated"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">
                    Stripe Customer:
                  </span>
                  <span className="ml-2 text-blue-700">{customerEmail}</span>
                </div>
              </div>
              {user?.email === customerEmail && (
                <div className="mt-2 text-xs text-green-700 font-medium">
                  ✅ Accounts are properly linked
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Current Plan
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Plan:</span> {productName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span>{" "}
                    {subscription.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Next billing:</span>{" "}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(subscription as any).current_period_end
                      ? formatDate((subscription as any).current_period_end)
                      : "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Amount:</span> {currency}{" "}
                    {amount}/month
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Customer ID:</span>{" "}
                    {customer.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Customer Email:</span>{" "}
                    {customerEmail}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <ManageSubscriptionButton customerId={customer.id} />

                  <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                    Download Invoice
                  </button>

                  <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Subscription created
                    </span>
                    <span className="text-sm text-gray-500">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(subscription as any).created
                        ? formatDate((subscription as any).created)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Current period started
                    </span>
                    <span className="text-sm text-gray-500">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(subscription as any).current_period_start
                        ? formatDate((subscription as any).current_period_start)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-sm text-gray-500 capitalize">
                      {subscription.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
