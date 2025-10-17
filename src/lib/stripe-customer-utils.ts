import Stripe from "stripe";
import { stripe } from "./stripe";

/**
 * Check if a Stripe customer is a Guest customer or has limited functionality
 */
export function isGuestCustomer(customer: Stripe.Customer | Stripe.DeletedCustomer): boolean {
  // Check if customer is deleted
  if ('deleted' in customer && customer.deleted) {
    return true;
  }
  
  // Check if customer has minimal metadata (typical of Guest customers)
  if (!customer.metadata || !customer.metadata.supabase_user_id) {
    return true;
  }
  
  // Check if customer was created by Stripe Checkout (Guest customers often are)
  if (customer.description && customer.description.includes('Guest')) {
    return true;
  }
  
  return false;
}

/**
 * Create a new proper customer and migrate data from a Guest customer
 */
export async function migrateGuestCustomer(
  guestCustomerId: string,
  userEmail: string,
  userId: string
): Promise<{ newCustomerId: string; migratedData: any }> {
  try {
    // Retrieve the guest customer to get any useful data
    const guestCustomer = await stripe.customers.retrieve(guestCustomerId);
    
    let migratedData: any = {};
    
    // If it's not deleted, we can potentially migrate some data
    if (!('deleted' in guestCustomer) || !guestCustomer.deleted) {
      migratedData = {
        email: guestCustomer.email || userEmail,
        name: guestCustomer.name,
        phone: guestCustomer.phone,
        address: guestCustomer.address,
      };
    }
    
    // Create a new proper customer
    const newCustomer = await stripe.customers.create({
      email: userEmail,
      name: migratedData.name || userEmail.split('@')[0], // Use name from migrated data or email prefix
      metadata: {
        supabase_user_id: userId,
        migrated_from_guest: guestCustomerId,
      },
      ...migratedData, // Include any migrated data
    });
    
    console.log(`Migrated guest customer ${guestCustomerId} to new customer ${newCustomer.id}`);
    
    return {
      newCustomerId: newCustomer.id,
      migratedData,
    };
  } catch (error) {
    console.error("Error migrating guest customer:", error);
    throw error;
  }
}

/**
 * Get or create a proper customer for a user, handling Guest customers
 */
export async function ensureProperCustomer(
  existingCustomerId: string | null,
  userEmail: string,
  userId: string
): Promise<string> {
  if (!existingCustomerId) {
    // No existing customer, create a new one
    const customer = await stripe.customers.create({
      email: userEmail,
      name: userEmail.split('@')[0], // Use email prefix as name
      metadata: {
        supabase_user_id: userId,
      },
    });
    return customer.id;
  }
  
  try {
    // Check if the existing customer is valid and manageable
    const customer = await stripe.customers.retrieve(existingCustomerId);
    
    if (isGuestCustomer(customer)) {
      console.log(`Customer ${existingCustomerId} is a Guest customer, migrating...`);
      const { newCustomerId } = await migrateGuestCustomer(
        existingCustomerId,
        userEmail,
        userId
      );
      return newCustomerId;
    }
    
    // Customer is proper and manageable
    return existingCustomerId;
  } catch (error) {
    console.log(`Customer ${existingCustomerId} not found or error retrieving, creating new one`);
    
    // Customer doesn't exist or there's an error, create a new one
    const customer = await stripe.customers.create({
      email: userEmail,
      name: userEmail.split('@')[0], // Use email prefix as name
      metadata: {
        supabase_user_id: userId,
      },
    });
    return customer.id;
  }
}
