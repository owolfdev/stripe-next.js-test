import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createUserStripeMapping,
  getUserStripeMapping,
  updateUserStripeMapping,
} from "@/lib/supabase/database";

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

    // From your Stripe data, we know the customer ID is: cus_TGFGCNtEniGyzz
    const customerId = "cus_TGFGCNtEniGyzz";

    // Check if mapping already exists
    const existingMapping = await getUserStripeMapping(user.id);

    if (existingMapping) {
      console.log("Mapping already exists:", existingMapping);

      // If the mapping is already correct, return success
      if (existingMapping.stripe_customer_id === customerId) {
        return NextResponse.json({
          success: true,
          message: "User-Stripe mapping is already correct",
          customerId: customerId,
          userId: user.id,
          mapping: existingMapping,
          action: "already_correct",
        });
      }

      // Update existing mapping
      const result = await updateUserStripeMapping(user.id, customerId);
      if (result) {
        return NextResponse.json({
          success: true,
          message: "User-Stripe mapping updated successfully",
          customerId: customerId,
          userId: user.id,
          mapping: result,
          action: "updated",
        });
      } else {
        return NextResponse.json(
          { error: "Failed to update existing mapping" },
          { status: 500 }
        );
      }
    } else {
      // Create new mapping
      const result = await createUserStripeMapping(user.id, customerId);
      if (result) {
        console.log(`Created user-Stripe mapping: ${user.id} -> ${customerId}`);
        return NextResponse.json({
          success: true,
          message: "User-Stripe mapping created successfully",
          customerId: customerId,
          userId: user.id,
          mapping: result,
          action: "created",
        });
      } else {
        return NextResponse.json(
          { error: "Failed to create mapping" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error creating mapping:", error);
    return NextResponse.json(
      { error: `Failed to create mapping: ${error.message}` },
      { status: 500 }
    );
  }
}
