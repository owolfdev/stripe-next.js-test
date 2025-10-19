import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    console.log("Force fixing mapping for user:", user.email);

    // From your Stripe data, we know the customer ID is: cus_TGFGCNtEniGyzz
    const customerId = "cus_TGFGCNtEniGyzz";

    // Use raw SQL to handle the constraint properly
    const { data, error } = await supabase.rpc("fix_user_stripe_mapping", {
      p_user_id: user.id,
      p_stripe_customer_id: customerId,
    });

    if (error) {
      console.error("Error with RPC call:", error);

      // Fallback: Delete and recreate manually
      console.log("Falling back to manual fix...");

      // Delete any existing mapping for this user
      await supabase
        .from("stripe_test_user_stripe_mapping")
        .delete()
        .eq("user_id", user.id);

      // Delete any existing mapping for this stripe customer
      await supabase
        .from("stripe_test_user_stripe_mapping")
        .delete()
        .eq("stripe_customer_id", customerId);

      // Create new mapping
      const { data: newMapping, error: createError } = await supabase
        .from("stripe_test_user_stripe_mapping")
        .insert({
          user_id: user.id,
          stripe_customer_id: customerId,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating mapping:", createError);
        return NextResponse.json(
          { error: `Failed to create mapping: ${createError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "User-Stripe mapping created successfully (fallback method)",
        customerId: customerId,
        userId: user.id,
        mapping: newMapping,
        action: "created_fallback",
      });
    }

    return NextResponse.json({
      success: true,
      message: "User-Stripe mapping fixed successfully",
      customerId: customerId,
      userId: user.id,
      data: data,
      action: "fixed",
    });
  } catch (error) {
    console.error("Error fixing mapping:", error);
    return NextResponse.json(
      { error: `Failed to fix mapping: ${error.message}` },
      { status: 500 }
    );
  }
}

