import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserStripeMapping } from "@/lib/supabase/database";
import { stripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
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

    console.log("Debug mapping for user:", user.email);

    // Get user's Stripe customer ID from database
    const mapping = await getUserStripeMapping(user.id);
    console.log("Database mapping:", mapping);

    if (!mapping) {
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
        },
        databaseMapping: null,
        message: "No mapping found in database",
      });
    }

    // Get customer details from Stripe
    let customerDetails = null;
    try {
      customerDetails = await stripe.customers.retrieve(mapping.stripe_customer_id);
      console.log("Stripe customer:", customerDetails.id);
    } catch (error) {
      console.log("Error retrieving customer:", error);
    }

    // Get subscriptions from Stripe
    let subscriptions = null;
    try {
      const subs = await stripe.subscriptions.list({
        customer: mapping.stripe_customer_id,
        limit: 10,
        status: "all",
      });
      subscriptions = subs.data;
      console.log("Found subscriptions:", subs.data.length);
    } catch (error) {
      console.log("Error retrieving subscriptions:", error);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      databaseMapping: mapping,
      stripeCustomer: customerDetails,
      subscriptions: subscriptions,
    });
  } catch (error) {
    console.error("Debug mapping error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
