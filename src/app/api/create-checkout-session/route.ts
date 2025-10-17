import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import {
  getUserStripeMapping,
  createUserStripeMapping,
} from "@/lib/supabase/database";
import { ensureProperCustomer } from "@/lib/stripe-customer-utils";

export async function POST(request: NextRequest) {
  try {
    console.log("Creating checkout session...");
    console.log("Environment check:", {
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV
    });
    
    const { priceId } = await request.json();
    console.log("Price ID:", priceId);

    if (!priceId) {
      console.log("No price ID provided");
      return NextResponse.json(
        { error: "Price ID is required" },
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
      console.log("User not authenticated");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", user.email);

    // Get or create Stripe customer (handling Guest customers automatically)
    const existingMapping = await getUserStripeMapping(user.id);
    const existingCustomerId = existingMapping?.stripe_customer_id || null;
    
    console.log("Existing customer ID:", existingCustomerId);
    
    // Ensure we have a proper customer (not a Guest customer)
    const customerId = await ensureProperCustomer(
      existingCustomerId,
      user.email!,
      user.id
    );
    
    console.log("Final customer ID:", customerId);
    
    // If we got a new customer ID (different from existing), update the mapping
    if (existingCustomerId !== customerId) {
      console.log("Customer ID changed, updating database mapping");
      await createUserStripeMapping(user.id, customerId);
      console.log("Updated user-stripe mapping in database");
    }

    console.log("Stripe secret key available:", !!config.stripe.secretKey);

    // Create checkout session
    console.log("Creating Stripe checkout session...");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/cancel`,
    });

    console.log("Checkout session created:", session.id);
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
