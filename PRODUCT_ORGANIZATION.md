# Product Organization Guide

This guide explains how to organize products in Stripe to control which plans appear in your app.

## 🎯 **Current System**

Your app uses **metadata-based filtering** to determine which products to display:

- ✅ **Development**: Shows all non-test products
- ✅ **Production**: Only shows products with `metadata.display = "public"`

## 🏗️ **Stripe Product Organization**

### **1. Product Categories**

Organize your products by adding metadata:

#### **Customer-Facing Products**

```
Name: "Premium Plan"
Metadata:
  display: "public"
  category: "subscription"
  tier: "premium"
  features: "unlimited,priority-support,analytics"
```

#### **Internal/Test Products**

```
Name: "Test Premium Plan"
Metadata:
  display: "internal"
  category: "test"
  environment: "development"
```

#### **Archived Products**

```
Name: "Old Premium Plan"
Status: "Archived" (in Stripe Dashboard)
```

### **2. Metadata Structure**

Use consistent metadata keys:

```json
{
  "display": "public|internal|test",
  "category": "subscription|one-time|addon",
  "tier": "basic|premium|pro|enterprise",
  "environment": "development|staging|production",
  "features": "feature1,feature2,feature3",
  "popular": "true|false",
  "sort_order": "1|2|3"
}
```

## 🚀 **Setting Up Products in Stripe**

### **Step 1: Create Production Products**

1. Go to **Stripe Dashboard** → **Products**
2. Click **Add product**
3. Fill in details:

```
Product Name: Premium Plan
Description: Premium subscription with advanced features

Pricing:
- Recurring: Monthly
- Price: $29.00 USD

Metadata:
Key: display
Value: public

Key: category
Value: subscription

Key: tier
Value: premium

Key: features
Value: unlimited,priority-support,analytics,custom-integrations

Key: popular
Value: false
```

### **Step 2: Create Test Products (for development)**

```
Product Name: Test Premium Plan
Description: Test version of premium plan

Pricing:
- Recurring: Monthly
- Price: $1.00 USD

Metadata:
Key: display
Value: internal

Key: environment
Value: development
```

### **Step 3: Organize by Environment**

#### **Development Environment**

- All products with `display: "internal"` or no metadata
- Test products for development

#### **Production Environment**

- Only products with `display: "public"`
- Customer-facing products only

## 🔧 **Advanced Filtering Options**

### **Option 1: Specific Plan Names**

```typescript
const allowedPlans = ["baby plan", "premium plan", "pro plan"];
return allowedPlans.some((plan) => productName.includes(plan));
```

### **Option 2: Price Range Filtering**

```typescript
const amount = (price.unit_amount || 0) / 100;
return amount > 0 && amount < 100; // Only $0-$100 plans
```

### **Option 3: Tier-Based Filtering**

```typescript
const allowedTiers = ["premium", "pro"];
return allowedTiers.includes(product.metadata?.tier);
```

### **Option 4: Sort Order**

```typescript
// Sort products by metadata.sort_order
filteredPrices.sort((a, b) => {
  const orderA = parseInt(a.product.metadata?.sort_order || "999");
  const orderB = parseInt(b.product.metadata?.sort_order || "999");
  return orderA - orderB;
});
```

## 📋 **Production Setup Checklist**

### **In Stripe Dashboard:**

- [ ] Create production products with proper names
- [ ] Add `display: "public"` metadata to customer-facing products
- [ ] Add `display: "internal"` to test/internal products
- [ ] Set up proper pricing (monthly/yearly)
- [ ] Add feature lists in metadata
- [ ] Mark popular plans with `popular: "true"`
- [ ] Archive old products instead of deleting

### **In Your App:**

- [ ] Environment-based filtering active
- [ ] Metadata filtering implemented
- [ ] Fallback system working
- [ ] Console logging for debugging

## 🎯 **Best Practices**

### **1. Product Naming**

- ✅ Use clear, descriptive names: "Premium Plan", "Pro Plan"
- ❌ Avoid: "Test Product", "Old Plan", "Plan 1"

### **2. Metadata Usage**

- ✅ Consistent key names across all products
- ✅ Use metadata for features, tiers, sorting
- ✅ Mark internal products clearly

### **3. Environment Separation**

- ✅ Different products for test/production
- ✅ Clear metadata for environment identification
- ✅ Separate price IDs for each environment

### **4. Product Lifecycle**

- ✅ Archive instead of delete old products
- ✅ Keep test products for development
- ✅ Version control for product changes

## 🔍 **Debugging**

### **Check What's Being Fetched:**

```javascript
// In browser console, you'll see:
"Fetched 5 total prices, showing 3 filtered prices";
```

### **Check Product Metadata:**

```javascript
// Add this to your getPrices function for debugging:
console.log("Product metadata:", product.metadata);
```

### **Test Different Environments:**

```bash
# Development
NODE_ENV=development npm run dev

# Production
NODE_ENV=production npm run dev
```

## 🚀 **Migration Strategy**

### **For Existing Products:**

1. **Add metadata** to existing products in Stripe Dashboard
2. **Test filtering** in development environment
3. **Deploy to production** with metadata filtering
4. **Monitor** which products are showing

### **For New Products:**

1. **Create product** in Stripe with proper metadata
2. **Test** in development environment
3. **Deploy** - product automatically appears in app

This system gives you complete control over which products appear in your app while maintaining flexibility for development and testing!
