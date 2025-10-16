"use client";

import { createClient } from "@/lib/supabase/client";

interface ManageSubscriptionButtonProps {
  customerId: string;
}

export default function ManageSubscriptionButton({
  customerId,
}: ManageSubscriptionButtonProps) {
  const handleManageSubscription = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.error("User not authenticated:", error);
        return;
      }

      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error managing subscription:", error);
      alert("Failed to open customer portal. Please try again.");
    }
  };

  return (
    <button
      onClick={handleManageSubscription}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Manage Subscription
    </button>
  );
}
