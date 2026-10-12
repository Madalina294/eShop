/**
 * Shapes returned by the `/api/admin` endpoints.
 *
 * These used to be declared inside `admin.service.ts` and
 * `activity-logs.component.ts`, so a component could not reference one without
 * importing the service, and the paginated wrappers were spelled out three
 * times instead of reusing `Page<T>`.
 */

/** Mirrors `UserDto`. Note the backend names the id `userId`, not `id`. */
export interface UserData {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl?: string | null;
  mfaEnabled: boolean;
}

/** Mirrors `ProductDto` on the admin side. */
export interface ProductData {
  id: number;
  name: string;
  price: number;
  description: string;
  categoryId: number;
  categoryName?: string;
  image?: string | null;
  color: string;
  dimensions: string;
  material: string;
  weight: string;
  quantity: number;
}

/** Mirrors `CategoryDto`. */
export interface CategoryData {
  id: number;
  name: string;
  description?: string;
  image?: string | null;
}

// --- Statistics -------------------------------------------------------------

export interface UserOrderCount {
  userId: number;
  userName: string;
  userEmail: string;
  orderCount: number;
}

export interface TopCustomer {
  userId: number;
  userName: string;
  userEmail: string;
  totalSpent: number;
  orderCount: number;
}

export interface AverageCart {
  averageCartValue: number;
  totalOrders: number;
  totalRevenue: number;
}

// --- Activity log -----------------------------------------------------------

export interface ActivityLog {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  actionType: string;
  actionDescription: string;
  ipAddress: string;
  userAgent: string;
  status: string;
  metadata: string | null;
  createdAt: string;
}

/** Filters accepted by `GET /api/admin/activity-logs`. */
export interface ActivityLogFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  userId?: number | null;
  actionType?: string | null;
  status?: string | null;
  /** ISO_LOCAL_DATE_TIME, e.g. 2026-01-31T00:00:00 */
  startDate?: string | null;
  endDate?: string | null;
}
