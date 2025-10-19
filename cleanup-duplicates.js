#!/usr/bin/env node

/**
 * Script to help identify and clean up duplicate Stripe customers
 *
 * Usage:
 *   node cleanup-duplicates.js analyze owolfdev@gmail.com
 *   node cleanup-duplicates.js delete cus_TGFFWj0sdBuSLs
 */

const email = process.argv[3];
const action = process.argv[2];
const customerId = process.argv[3];

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("Please set your environment variables first");
  process.exit(1);
}

const API_BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

async function analyzeDuplicates(email) {
  console.log(`🔍 Analyzing duplicate customers for: ${email}`);

  try {
    const response = await fetch(
      `${API_BASE}/api/debug-duplicates?email=${encodeURIComponent(email)}`
    );
    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Error:", data.error);
      return;
    }

    console.log(`\n📊 Analysis Results:`);
    console.log(`   Total customers: ${data.totalCustomers}`);
    console.log(`   To keep: ${data.summary.toKeep}`);
    console.log(`   To delete: ${data.summary.toDelete}`);
    console.log(`   Errors: ${data.summary.errors}`);

    console.log(`\n👥 Customer Details:`);
    data.customers.forEach((customer, index) => {
      console.log(`\n   ${index + 1}. ${customer.id}`);
      console.log(`      Email: ${customer.email}`);
      console.log(`      Created: ${customer.createdAt}`);
      console.log(
        `      Has subscriptions: ${customer.hasSubscriptions ? "✅" : "❌"}`
      );
      console.log(
        `      Has payment methods: ${customer.hasPaymentMethods ? "✅" : "❌"}`
      );
      console.log(`      Has invoices: ${customer.hasInvoices ? "✅" : "❌"}`);
      console.log(`      Recommendation: ${customer.recommendation}`);

      if (customer.metadata?.supabase_user_id) {
        console.log(
          `      Supabase User ID: ${customer.metadata.supabase_user_id}`
        );
      }
    });

    if (data.summary.toDelete > 0) {
      console.log(`\n🗑️  Customers recommended for deletion:`);
      data.customers
        .filter((c) => c.recommendation === "DELETE")
        .forEach((customer) => {
          console.log(`   node cleanup-duplicates.js delete ${customer.id}`);
        });
    }
  } catch (error) {
    console.error("❌ Error analyzing duplicates:", error.message);
  }
}

async function deleteCustomer(customerId) {
  console.log(`🗑️  Deleting customer: ${customerId}`);

  try {
    const response = await fetch(`${API_BASE}/api/debug-duplicates`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customerId }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Error:", data.error);
      if (data.customer) {
        console.log("Customer details:", data.customer);
      }
      return;
    }

    console.log("✅ Customer deleted successfully:", data.customerId);
  } catch (error) {
    console.error("❌ Error deleting customer:", error.message);
  }
}

// Main execution
if (action === "analyze" && email) {
  analyzeDuplicates(email);
} else if (action === "delete" && customerId) {
  deleteCustomer(customerId);
} else {
  console.log(`
Usage:
  node cleanup-duplicates.js analyze <email>
  node cleanup-duplicates.js delete <customer-id>

Examples:
  node cleanup-duplicates.js analyze owolfdev@gmail.com
  node cleanup-duplicates.js delete cus_TGFFWj0sdBuSLs
`);
}
