"use client";

import { useState } from "react";

interface SubscriptionCardProps {
  title: string;
  price: string;
  description: string[];
  priceId: string;
  popular?: boolean;
}

export default function SubscriptionCard({
  title,
  price,
  description,
  priceId,
  popular = false,
}: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (response.ok && responseData.sessionId) {
        // Redirect to Stripe Checkout using the provided URL
        if (responseData.url) {
          window.location.href = responseData.url;
        } else {
          // Fallback to session ID redirect
          window.location.href = `https://checkout.stripe.com/c/pay/${responseData.sessionId}`;
        }
      } else {
        console.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative bg-white rounded-lg shadow-lg p-8 ${
        popular ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <div className="text-4xl font-bold text-gray-900 mb-4">
          {price}
          <span className="text-lg font-normal text-gray-500">/month</span>
        </div>

        <ul className="text-left space-y-3 mb-8">
          {description.map((item, index) => (
            <li key={index} className="flex items-center">
              <svg
                className="flex-shrink-0 w-5 h-5 text-green-500 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            popular
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-900 hover:bg-gray-800 text-white"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Processing..." : "Subscribe Now"}
        </button>
      </div>
    </div>
  );
}
