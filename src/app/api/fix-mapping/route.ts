import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUserStripeMapping } from "@/lib/supabase/database";

export async function POST() {
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

    console.log("Fixing mapping for user:", user.email);

    // For your specific case, we know the customer ID from the logs
    const customerId = "cus_TFXWDM7yZcdPxx";
    
    // Create the mapping
    await createUserStripeMapping(user.id, customerId);
    
    console.log(`Created user-Stripe mapping: ${user.id} -> ${customerId}`);

    return NextResponse.json({ 
      success: true, 
      message: "User-Stripe mapping created successfully",
      customerId: customerId,
      userId: user.id
    });
  } catch (error) {
    console.error("Error creating mapping:", error);
    return NextResponse.json(
      { error: "Failed to create mapping" },
      { status: 500 }
    );
  }
}
