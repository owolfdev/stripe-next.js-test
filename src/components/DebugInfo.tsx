"use client";

export default function DebugInfo() {
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST;
  const premiumPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_TEST;
  const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_TEST;

  // Debug: Log all environment variables
  console.log("Environment variables:", {
    stripeKey: stripeKey ? "✅ Set" : "❌ Missing",
    premiumPriceId: premiumPriceId ? "✅ Set" : "❌ Missing",
    proPriceId: proPriceId ? "✅ Set" : "❌ Missing",
  });

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
      <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">
        Debug Info:
      </h3>
      <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
        <p>
          <strong className="text-gray-900 dark:text-gray-100">
            Stripe Key:
          </strong>{" "}
          {stripeKey ? "✅ Set" : "❌ Missing"}
        </p>
        <p>
          <strong className="text-gray-900 dark:text-gray-100">
            Premium Price ID:
          </strong>{" "}
          {premiumPriceId ? "✅ Set" : "❌ Missing"}
          {premiumPriceId && (
            <span className="text-xs text-gray-500 ml-2">
              ({premiumPriceId})
            </span>
          )}
        </p>
        <p>
          <strong className="text-gray-900 dark:text-gray-100">
            Pro Price ID:
          </strong>{" "}
          {proPriceId ? "✅ Set" : "❌ Missing"}
          {proPriceId && (
            <span className="text-xs text-gray-500 ml-2">({proPriceId})</span>
          )}
        </p>
        {stripeKey && (
          <p>
            <strong className="text-gray-900 dark:text-gray-100">
              Key Preview:
            </strong>{" "}
            {stripeKey.substring(0, 20)}...
          </p>
        )}
      </div>
    </div>
  );
}
