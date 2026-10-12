import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environments';
import { Page } from '../../models/product';
import {
  ActivityLog,
  ActivityLogFilters,
  AverageCart,
  CategoryData,
  ProductData,
  TopCustomer,
  UserData,
  UserOrderCount,
} from '../../models/admin';

/**
 * Everything under `/api/admin`.
 *
 * Reworked off three long-standing problems: the base URL was hardcoded to
 * `http://localhost:8080`, every call built its own `Authorization` header even
 * though `authInterceptor` already adds one, and the DTOs were declared in this
 * file instead of `models/`.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;
  private readonly http = inject(HttpClient);

  // --- Users ----------------------------------------------------------------

  getAllUsers(): Observable<UserData[]> {
    return this.http.get<UserData[]>(`${this.baseUrl}/users`);
  }

  getUsersPaginated(
    page = 0,
    size = 10,
    sortBy = 'id',
    sortDir: 'asc' | 'desc' = 'asc'
  ): Observable<Page<UserData>> {
    const params = new HttpParams({ fromObject: { page, size, sortBy, sortDir } });
    return this.http.get<Page<UserData>>(`${this.baseUrl}/users/paginated`, { params });
  }

  getUserById(userId: number): Observable<UserData> {
    return this.http.get<UserData>(`${this.baseUrl}/get-user/${userId}`);
  }

  deleteUser(userId: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete-user/${userId}`);
  }

  /**
   * The endpoint reads `subject`, `content` and `toEmail` as QUERY PARAMETERS,
   * not a JSON body — the previous implementation posted a body, so nothing
   * ever arrived and the mail was silently never sent.
   */
  sendEmail(request: { subject: string; content: string; toEmail: string }): Observable<unknown> {
    const params = new HttpParams({ fromObject: { ...request } });
    return this.http.post(`${this.baseUrl}/send-email`, null, { params });
  }

  // --- Products -------------------------------------------------------------

  getProductsPaginated(
    page = 0,
    size = 10,
    sortBy = 'id',
    sortDir: 'asc' | 'desc' = 'asc'
  ): Observable<Page<ProductData>> {
    const params = new HttpParams({ fromObject: { page, size, sortBy, sortDir } });
    return this.http.get<Page<ProductData>>(`${this.baseUrl}/products/paginated`, { params });
  }

  getProduct(productId: number): Observable<ProductData> {
    return this.http.get<ProductData>(`${this.baseUrl}/product/get-product/${productId}`);
  }

  addProduct(data: FormData): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/product/add-product`, data);
  }

  updateProduct(data: FormData): Observable<ProductData> {
    return this.http.put<ProductData>(`${this.baseUrl}/product/edit-product`, data);
  }

  deleteProduct(productId: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/product/delete-product/${productId}`);
  }

  // --- Categories -----------------------------------------------------------

  getCategories(): Observable<CategoryData[]> {
    return this.http.get<CategoryData[]>(`${this.baseUrl}/category/get-categories`);
  }

  getCategoryById(id: number): Observable<CategoryData> {
    return this.http.get<CategoryData>(`${this.baseUrl}/category/get-category/${id}`);
  }

  createCategory(data: Partial<CategoryData>): Observable<CategoryData> {
    return this.http.post<CategoryData>(`${this.baseUrl}/category/create-category`, data);
  }

  updateCategory(data: Partial<CategoryData>): Observable<CategoryData> {
    return this.http.put<CategoryData>(`${this.baseUrl}/category/edit-category`, data);
  }

  deleteCategory(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/category/delete-category/${id}`);
  }

  // --- Statistics -----------------------------------------------------------

  getOrdersCountByUser(): Observable<UserOrderCount[]> {
    return this.http.get<UserOrderCount[]>(`${this.baseUrl}/statistics/orders-by-user`);
  }

  getTopCustomers(limit = 10): Observable<TopCustomer[]> {
    const params = new HttpParams({ fromObject: { limit } });
    return this.http.get<TopCustomer[]>(`${this.baseUrl}/statistics/top-customers`, { params });
  }

  getAverageCartValue(): Observable<AverageCart> {
    return this.http.get<AverageCart>(`${this.baseUrl}/statistics/average-cart`);
  }

  // --- Activity log ---------------------------------------------------------

  /** Takes a typed filter object instead of a pre-built query string. */
  getActivityLogs(filters: ActivityLogFilters = {}): Observable<Page<ActivityLog>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 10)
      .set('sortBy', filters.sortBy ?? 'createdAt')
      .set('sortDir', filters.sortDir ?? 'desc');

    // Only send the optional filters that are actually set: a blank one would
    // be matched literally by the backend.
    for (const key of ['userId', 'actionType', 'status', 'startDate', 'endDate'] as const) {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value as string | number);
      }
    }

    return this.http.get<Page<ActivityLog>>(`${this.baseUrl}/activity-logs`, { params });
  }
}
