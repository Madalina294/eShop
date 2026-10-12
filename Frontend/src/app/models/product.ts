export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  categoryName?: string;
  image?: string | null;
  color?: string;
  dimensions?: string;
  material?: string;
  weight?: string;
  quantity: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string | null;
}

/** Shape returned by the Spring Data `Page<T>` serialization. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}
