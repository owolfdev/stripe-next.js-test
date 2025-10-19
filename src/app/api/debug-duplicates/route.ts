import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  findAllCustomersByEmail,
  getCustomerSummary,
} from "@/lib/stripe-customer-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    console.log(`Analyzing duplicate customers for email: ${email}`);

    // Find all customers with this email
    const customers = await findAllCustomersByEmail(email);

    if (customers.length === 0) {
      return NextResponse.json({
        email,
        message: "No customers found with this email",
        customers: [],
      });
    }

    console.log(`Found ${customers.length} customers with email ${email}`);

    // Get detailed summaries for each customer
    const customerSummaries = await Promise.all(
      customers.map(async (customer) => {
        try {
          const summary = await getCustomerSummary(customer.id);
          return {
            ...summary,
            createdAt: new Date(summary.created * 1000).toISOString(),
            isDuplicate: customers.length > 1,
            shouldKeep:
              summary.hasSubscriptions ||
              summary.hasPaymentMethods ||
              summary.hasInvoices,
            canDelete:
              !summary.hasSubscriptions &&
              !summary.hasPaymentMethods &&
              !summary.hasInvoices,
          };
        } catch (error) {
          console.error(
            `Error getting summary for customer ${customer.id}:`,
            error
          );
          return {
            id: customer.id,
            email: customer.email,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    // Sort by creation date (newest first)
    customerSummaries.sort((a, b) => {
      if ("createdAt" in a && "createdAt" in b && a.createdAt && b.createdAt) {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return 0;
    });

    // Identify which customers should be kept vs deleted
    const recommendations = customerSummaries.map((customer, index) => {
      if (customer.error) {
        return { ...customer, recommendation: "ERROR" };
      }

      // Type guard to ensure we have the full customer object
      if ("shouldKeep" in customer && "canDelete" in customer) {
        if (customer.shouldKeep) {
          return { ...customer, recommendation: "KEEP" };
        }

        if (customer.canDelete && index > 0) {
          return { ...customer, recommendation: "DELETE" };
        }

        if (customer.canDelete && index === 0 && customers.length > 1) {
          return { ...customer, recommendation: "DELETE" };
        }
      }

      return { ...customer, recommendation: "KEEP" };
    });

    return NextResponse.json({
      email,
      totalCustomers: customers.length,
      message:
        customers.length > 1 ? "Duplicate customers found" : "No duplicates",
      customers: recommendations,
      summary: {
        total: customers.length,
        toKeep: recommendations.filter((c) => c.recommendation === "KEEP")
          .length,
        toDelete: recommendations.filter((c) => c.recommendation === "DELETE")
          .length,
        errors: recommendations.filter((c) => c.recommendation === "ERROR")
          .length,
      },
    });
  } catch (error) {
    console.error("Error analyzing duplicate customers:", error);
    return NextResponse.json(
      { error: "Failed to analyze duplicate customers" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Get customer summary first to make sure it's safe to delete
    const summary = await getCustomerSummary(customerId);

    if (
      summary.hasSubscriptions ||
      summary.hasPaymentMethods ||
      summary.hasInvoices
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete customer with active subscriptions, payment methods, or invoices",
          customer: summary,
        },
        { status: 400 }
      );
    }

    // Delete the customer
    const deletedCustomer = await stripe.customers.del(customerId);

    console.log(`Deleted customer: ${customerId}`);

    return NextResponse.json({
      message: "Customer deleted successfully",
      customerId,
      deleted: deletedCustomer.deleted,
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
