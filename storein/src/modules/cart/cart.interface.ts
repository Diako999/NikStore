export interface CartItem {
  productId:        string;
  variantId:        string;
  sku:              string;
  name:             string;
  slug:             string;
  thumbnail:        string | null;
  price:            number;
  comparePrice:     number | null;
  // Populated only when isWholesalePrice=true AND a system discount is active.
  // Stores the original retail price so the UI can show a 3-level price breakdown:
  // retailPrice (crossed) → comparePrice/wholesalePrice (crossed) → price (discounted)
  retailPrice?:     number;
  quantity:         number;
  stock:            number;
  attributes:       { key: string; value: string }[];
  isWholesalePrice: boolean;
  wholesaleMinQty:  number | null;
}

export interface Cart {
  userId:    string;
  items:     CartItem[];
  updatedAt: string;
}

export interface CartSummary extends Cart {
  subtotal:   number;
  totalItems: number;
  savings:    number;
}
