import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import {
  getUserStripeMapping,
  createUserStripeMapping,
} from "@/lib/supabase/database";

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

    // Get or create Stripe customer
    let customerId: string;
    const existingMapping = await getUserStripeMapping(user.id);

    if (existingMapping) {
      customerId = existingMapping.stripe_customer_id;
      console.log("Using existing Stripe customer:", customerId);
      
      // Verify the customer exists in the current Stripe mode (test/live)
      try {
        await stripe.customers.retrieve(customerId);
        console.log("Customer verified in current Stripe mode");
      } catch (error) {
        console.log("Customer doesn't exist in current Stripe mode, creating new one");
        // Customer doesn't exist in current mode, create a new one
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: {
            supabase_user_id: user.id,
          },
        });
        customerId = customer.id;
        console.log("Created new Stripe customer:", customerId);

        // Update the mapping in database
        await createUserStripeMapping(user.id, customerId);
        console.log("Updated user-stripe mapping in database");
      }
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log("Created new Stripe customer:", customerId);

      // Store the mapping in database
      await createUserStripeMapping(user.id, customerId);
      console.log("Stored user-stripe mapping in database");
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
