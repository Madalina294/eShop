import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable} from 'rxjs';
import { ProductData } from '../../models/admin';
import { environment } from '../../../environments/environments';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly baseUrl = `${environment.apiUrl}/user`;
  private readonly http = inject(HttpClient);

  deleteAccount(userId: number) {
    return this.http.delete(this.baseUrl + `/delete/${userId}`);
  }


  updateProfileWithFormData(formData: any): Observable<any>{
    return this.http.put(this.baseUrl + `/update-infos`, formData);
  }

  updatePreferredTheme(userId: number, theme: string): Observable<any> {
    return this.http.put(this.baseUrl + `/update-theme/${userId}/${theme}`, {});
  }

  updatePreferredLanguage(userId: number, language: string): Observable<any> {
    return this.http.put(this.baseUrl + `/update-language/${userId}/${language}`, {});
  }

  updatePassword(data: any): Observable<any>{
    return this.http.put(this.baseUrl + `/update-password`, data);
  }

  getAllProducts(): Observable<ProductData[]>{
    return this.http.get<ProductData[]>(this.baseUrl + `/get-all-products`)
  }

  getProductsPaginated(page: number = 0, size: number = 12, sortBy: string = 'id', sortDir: string = 'asc', categoryId?: number): Observable<any> {
    let params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy,
      sortDir: sortDir
    });

    if (categoryId !== undefined && categoryId !== null) {
      params.append('categoryId', categoryId.toString());
    }

    return this.http.get<any>(this.baseUrl + `/get-products-paginated?${params}`);
  }

  getCategories(): Observable<any[]>{
    return this.http.get<any[]>(this.baseUrl + `/get-categories`)
  }

  getProduct(id: number): Observable<ProductData>{
    return this.http.get<ProductData>(this.baseUrl + `/get-product/${id}`)
  }

  addToWishlist(productId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/wishlist/add/${productId}`, {});
  }

  removeFromWishlist(productId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/wishlist/remove/${productId}`);
  }

  getUserWishlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/wishlist`);
  }

  checkIfInWishlist(productId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/wishlist/check/${productId}`);
  }

  // Cart methods
  addToCart(productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart/add/${productId}`, { quantity });
  }

  removeFromCart(productId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/remove/${productId}`);
  }

  getUserCart(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/cart`);
  }

  updateCartItemQuantity(productId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/cart/update/${productId}`, { quantity });
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/clear`);
  }

  checkIfInCart(productId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/cart/check/${productId}`);
  }
}
