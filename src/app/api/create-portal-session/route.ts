import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Create a customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${config.app.siteUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    
    // Check if it's a specific Stripe error
    if (error instanceof Error) {
      if (error.message.includes('billing portal') || error.message.includes('portal')) {
        return NextResponse.json(
          { error: "Customer Portal is not enabled for this account. Please contact support." },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
