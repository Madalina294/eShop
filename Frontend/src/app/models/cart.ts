import { Product } from './product';

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  image?: string | null;
  product?: Product;
}

export interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  image?: string | null;
  product?: Product;
}
