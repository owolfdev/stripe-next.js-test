import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "thb", email } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    // Create a Stripe Checkout session for the donation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: "Donation",
              description: "Thank you for your support!",
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }`,
      metadata: {
        type: "donation",
        email: email || "anonymous",
      },
      customer_email: email || undefined,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error creating donation:", error);
    return NextResponse.json(
      { error: "Failed to create donation" },
      { status: 500 }
    );
  }
}
