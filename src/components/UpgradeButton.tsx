"use client";

import { useState } from "react";

interface UpgradeButtonProps {
  priceId: string;
  currentPriceId?: string;
  title: string;
  price: string;
  description: string[];
  popular?: boolean;
  onUpgradeComplete?: () => void;
}

export default function UpgradeButton({
  priceId,
  currentPriceId,
  onUpgradeComplete,
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpgrade = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/modify-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPriceId: priceId }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setMessage("Subscription updated successfully!");
        if (onUpgradeComplete) {
          onUpgradeComplete();
        }
        // Refresh the page after a short delay to show updated subscription
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(responseData.error || "Failed to update subscription");
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      setMessage("Failed to update subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't show the button if this is the current plan
  if (currentPriceId === priceId) {
    return (
      <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-md text-center">
        Current Plan
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {loading ? "Updating..." : "Switch to This Plan"}
      </button>
      {message && (
        <div className={`mt-2 text-sm text-center ${
          message.includes("success") ? "text-green-600" : "text-red-600"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
