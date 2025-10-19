"use client";

import { useState } from "react";

interface DonateButtonProps {
  amount?: number;
  currency?: string;
  label?: string;
  className?: string;
}

export default function DonateButton({
  amount = 50,
  currency = "thb",
  label = "Donate",
  className = "",
}: DonateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customAmount, setCustomAmount] = useState(amount.toString());
  const [email, setEmail] = useState("");

  const handleDonate = async () => {
    const donateAmount = parseFloat(customAmount);

    if (!donateAmount || donateAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/create-donation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: donateAmount,
          currency,
          email: email || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create donation");
      }

      const { url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Donation error:", error);
      alert("Donation failed. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickDonate = async (quickAmount: number) => {
    setCustomAmount(quickAmount.toString());
    await handleDonate();
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors ${className}`}
      >
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {label}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Make a Donation
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ({currency.toUpperCase()})
                </label>
                <div className="flex space-x-2 mb-3">
                  {[20, 50, 100, 200].map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => handleQuickDonate(quickAmount)}
                      disabled={loading}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors disabled:opacity-50"
                    >
                      ฿{quickAmount}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="1"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleDonate}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? "Processing..." : `Donate ฿${customAmount}`}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
