import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getUserStripeMapping } from "@/lib/supabase/database";

export async function POST(request: NextRequest) {
  try {
    console.log("Modifying subscription...");
    
    const { newPriceId } = await request.json();
    
    if (!newPriceId) {
      return NextResponse.json(
        { error: "New price ID is required" },
        { status: 400 }
      );
    }

    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", user.email);

    // Get user's Stripe customer ID
    const mapping = await getUserStripeMapping(user.id);
    if (!mapping) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 404 }
      );
    }

    // Get user's current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: mapping.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const currentSubscription = subscriptions.data[0];
    const currentPriceId = currentSubscription.items.data[0]?.price.id;

    console.log("Current subscription:", currentSubscription.id);
    console.log("Current price ID:", currentPriceId);
    console.log("New price ID:", newPriceId);

    // Check if trying to subscribe to the same plan
    if (currentPriceId === newPriceId) {
      return NextResponse.json(
        { error: "You are already subscribed to this plan" },
        { status: 400 }
      );
    }

    // Update the subscription
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.id,
      {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations", // Prorate the billing
      }
    );

    console.log("Subscription updated:", updatedSubscription.id);

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        current_period_end: updatedSubscription.current_period_end,
      },
    });
  } catch (error) {
    console.error("Error modifying subscription:", error);
    return NextResponse.json(
      { error: "Failed to modify subscription" },
      { status: 500 }
    );
  }
}
