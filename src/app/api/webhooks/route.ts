import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { config } from "@/lib/config";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !config.stripe.webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripe.webhookSecret
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Checkout session completed:", session.id);
      // Handle successful checkout
      break;

    case "customer.subscription.created":
      const subscription = event.data.object as Stripe.Subscription;
      console.log("Subscription created:", subscription.id);
      // Handle new subscription
      break;

    case "customer.subscription.updated":
      const updatedSubscription = event.data.object as Stripe.Subscription;
      console.log("Subscription updated:", updatedSubscription.id);
      // Handle subscription updates
      break;

    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object as Stripe.Subscription;
      console.log("Subscription deleted:", deletedSubscription.id);
      // Handle subscription cancellation
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
