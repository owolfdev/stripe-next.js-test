import Stripe from "stripe";
import { stripe } from "./stripe";

/**
 * Check if a Stripe customer is a Guest customer or has limited functionality
 */
export function isGuestCustomer(
  customer: Stripe.Customer | Stripe.DeletedCustomer
): boolean {
  // Check if customer is deleted
  if ("deleted" in customer && customer.deleted) {
    return true;
  }

  // Check if customer has minimal metadata (typical of Guest customers)
  if (!customer.metadata || !customer.metadata.supabase_user_id) {
    return true;
  }

  // Check if customer was created by Stripe Checkout (Guest customers often are)
  if (customer.description && customer.description.includes("Guest")) {
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
): Promise<{ newCustomerId: string; migratedData: Record<string, unknown> }> {
  try {
    // Retrieve the guest customer to get any useful data
    const guestCustomer = await stripe.customers.retrieve(guestCustomerId);

    let migratedData: Record<string, unknown> = {};

    // If it's not deleted, we can potentially migrate some data
    if (!("deleted" in guestCustomer) || !guestCustomer.deleted) {
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
      name:
        (typeof migratedData.name === "string"
          ? migratedData.name
          : undefined) || userEmail.split("@")[0], // Use name from migrated data or email prefix
      metadata: {
        supabase_user_id: userId,
        migrated_from_guest: guestCustomerId,
      },
      // Only include safe properties from migrated data
      ...(typeof migratedData.phone === "string"
        ? { phone: migratedData.phone }
        : {}),
      ...(typeof migratedData.address === "object" &&
      migratedData.address !== null
        ? { address: migratedData.address }
        : {}),
    });

    console.log(
      `Migrated guest customer ${guestCustomerId} to new customer ${newCustomer.id}`
    );

    return {
      newCustomerId: newCustomer.id,
      migratedData,
    };
  } catch (err) {
    console.error("Error migrating guest customer:", err);
    throw err;
  }
}

/**
 * Search for existing Stripe customer by email
 */
export async function findCustomerByEmail(
  email: string
): Promise<Stripe.Customer | null> {
  try {
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    return customers.data.length > 0 ? customers.data[0] : null;
  } catch (error) {
    console.error("Error searching for customer by email:", error);
    return null;
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
  // First, check if there's already a customer with this email in Stripe
  const existingCustomerByEmail = await findCustomerByEmail(userEmail);

  if (existingCustomerByEmail) {
    console.log(
      `Found existing customer by email: ${existingCustomerByEmail.id}`
    );

    // Check if this existing customer is a Guest customer that needs migration
    if (isGuestCustomer(existingCustomerByEmail)) {
      console.log(
        `Existing customer ${existingCustomerByEmail.id} is a Guest customer, migrating...`
      );
      const { newCustomerId } = await migrateGuestCustomer(
        existingCustomerByEmail.id,
        userEmail,
        userId
      );
      return newCustomerId;
    }

    // Update the existing customer with proper metadata if missing
    if (!existingCustomerByEmail.metadata?.supabase_user_id) {
      await stripe.customers.update(existingCustomerByEmail.id, {
        metadata: {
          ...existingCustomerByEmail.metadata,
          supabase_user_id: userId,
        },
      });
      console.log(
        `Updated customer ${existingCustomerByEmail.id} with Supabase user ID`
      );
    }

    return existingCustomerByEmail.id;
  }

  if (!existingCustomerId) {
    // No existing customer, create a new one
    const customer = await stripe.customers.create({
      email: userEmail,
      name: userEmail.split("@")[0], // Use email prefix as name
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
      console.log(
        `Customer ${existingCustomerId} is a Guest customer, migrating...`
      );
      const { newCustomerId } = await migrateGuestCustomer(
        existingCustomerId,
        userEmail,
        userId
      );
      return newCustomerId;
    }

    // Customer is proper and manageable
    return existingCustomerId;
  } catch {
    console.log(
      `Customer ${existingCustomerId} not found or error retrieving, creating new one`
    );

    // Customer doesn't exist or there's an error, create a new one
    const customer = await stripe.customers.create({
      email: userEmail,
      name: userEmail.split("@")[0], // Use email prefix as name
      metadata: {
        supabase_user_id: userId,
      },
    });
    return customer.id;
  }
}

/**
 * Find all customers with a specific email address (useful for identifying duplicates)
 */
export async function findAllCustomersByEmail(
  email: string
): Promise<Stripe.Customer[]> {
  try {
    const customers = await stripe.customers.list({
      email: email,
      limit: 100, // Get up to 100 customers with this email
    });

    return customers.data;
  } catch (error) {
    console.error("Error searching for all customers by email:", error);
    return [];
  }
}

/**
 * Get customer summary for debugging duplicate customers
 */
export async function getCustomerSummary(customerId: string): Promise<{
  id: string;
  email: string | null;
  name: string | null;
  created: number;
  hasSubscriptions: boolean;
  hasPaymentMethods: boolean;
  hasInvoices: boolean;
  metadata: Record<string, string>;
}> {
  try {
    const customer = await stripe.customers.retrieve(customerId);

    if ("deleted" in customer && customer.deleted) {
      throw new Error("Customer is deleted");
    }

    // Get subscriptions count
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    // Get payment methods count
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      limit: 1,
    });

    // Get invoices count
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 1,
    });

    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      created: customer.created,
      hasSubscriptions: subscriptions.data.length > 0,
      hasPaymentMethods: paymentMethods.data.length > 0,
      hasInvoices: invoices.data.length > 0,
      metadata: customer.metadata,
    };
  } catch (error) {
    console.error("Error getting customer summary:", error);
    throw error;
  }
}
