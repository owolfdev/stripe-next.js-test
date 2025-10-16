// Product configuration for controlling which plans appear in your app
import { config } from "./config";
import Stripe from "stripe";

export interface ProductFilter {
  // Metadata-based filtering
  metadata?: {
    display?: "public" | "internal" | "test";
    category?: string;
    tier?: string;
    environment?: "development" | "staging" | "production";
  };

  // Name-based filtering
  allowedNames?: string[];
  excludedNames?: string[];

  // Price-based filtering
  minPrice?: number;
  maxPrice?: number;

  // Currency filtering
  allowedCurrencies?: string[];
}

// Configuration for different environments
export const productConfigs = {
  development: {
    metadata: {
      display: "public", // or undefined to show all
    },
    excludedNames: ["test"],
    minPrice: 0,
    maxPrice: 1000,
  } as ProductFilter,

  production: {
    metadata: {
      display: "public",
    },
    excludedNames: ["test", "internal", "development"],
    minPrice: 1,
    maxPrice: 1000,
  } as ProductFilter,

  staging: {
    metadata: {
      display: "public",
    },
    excludedNames: ["test"],
    minPrice: 0,
    maxPrice: 1000,
  } as ProductFilter,
};

export function getCurrentProductConfig(): ProductFilter {
  const environment = config.app.environment;

  switch (environment) {
    case "production":
      return productConfigs.production;
    case "staging":
      return productConfigs.staging;
    default:
      return productConfigs.development;
  }
}

export function shouldShowProduct(
  product: Stripe.Product,
  price: Stripe.Price,
  filter: ProductFilter
): boolean {
  const productName = product.name?.toLowerCase() || "";
  const amount = (price.unit_amount || 0) / 100;
  const currency = price.currency?.toUpperCase();

  // Check metadata filtering
  if (filter.metadata) {
    const metadata = product.metadata || {};

    if (
      filter.metadata.display &&
      metadata.display !== filter.metadata.display
    ) {
      return false;
    }

    if (
      filter.metadata.category &&
      metadata.category !== filter.metadata.category
    ) {
      return false;
    }

    if (filter.metadata.tier && metadata.tier !== filter.metadata.tier) {
      return false;
    }

    if (
      filter.metadata.environment &&
      metadata.environment !== filter.metadata.environment
    ) {
      return false;
    }
  }

  // Check name filtering
  if (filter.allowedNames && filter.allowedNames.length > 0) {
    const isAllowed = filter.allowedNames.some((allowedName) =>
      productName.includes(allowedName.toLowerCase())
    );
    if (!isAllowed) return false;
  }

  if (filter.excludedNames && filter.excludedNames.length > 0) {
    const isExcluded = filter.excludedNames.some((excludedName) =>
      productName.includes(excludedName.toLowerCase())
    );
    if (isExcluded) return false;
  }

  // Check price filtering
  if (filter.minPrice !== undefined && amount < filter.minPrice) {
    return false;
  }

  if (filter.maxPrice !== undefined && amount > filter.maxPrice) {
    return false;
  }

  // Check currency filtering
  if (filter.allowedCurrencies && filter.allowedCurrencies.length > 0) {
    if (!filter.allowedCurrencies.includes(currency)) {
      return false;
    }
  }

  return true;
}

// Utility function to get product display order
export function getProductSortOrder(product: Stripe.Product): number {
  const metadata = product.metadata || {};
  const sortOrder = parseInt(metadata.sort_order || "999");
  const isPopular = metadata.popular === "true";

  // Popular products first, then by sort order
  return isPopular ? 0 : sortOrder;
}
