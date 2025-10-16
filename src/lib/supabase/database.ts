import { createClient } from "./server";

export interface UserStripeMapping {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  created_at: string;
  updated_at: string;
}

export async function getUserStripeMapping(
  userId: string
): Promise<UserStripeMapping | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stripe_test_user_stripe_mapping")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user stripe mapping:", error);
    return null;
  }

  return data;
}

export async function createUserStripeMapping(
  userId: string,
  stripeCustomerId: string
): Promise<UserStripeMapping | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stripe_test_user_stripe_mapping")
    .insert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating user stripe mapping:", error);
    return null;
  }

  return data;
}

export async function updateUserStripeMapping(
  userId: string,
  stripeCustomerId: string
): Promise<UserStripeMapping | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stripe_test_user_stripe_mapping")
    .update({ stripe_customer_id: stripeCustomerId })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user stripe mapping:", error);
    return null;
  }

  return data;
}
