import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {StorageService} from '../storage/storage.service';
import {Observable} from 'rxjs';
import {ProductData} from '../admin/admin.service';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = 'http://localhost:8080/api/user'
  constructor(
    private http: HttpClient
  ) { }

  deleteAccount(userId: number) {
    return this.http.delete(this.baseUrl + `/delete/${userId}`, {headers: this.createAuthorizationHeader()});
  }


  updateProfileWithFormData(formData: any): Observable<any>{
    const headers = this.createAuthorizationHeader();
    return this.http.put(this.baseUrl + `/update-infos`, formData, {headers: headers});
  }

  updatePreferredTheme(userId: number, theme: string): Observable<any> {
    const headers = this.createAuthorizationHeader();
    return this.http.put(this.baseUrl + `/update-theme/${userId}/${theme}`, {}, {
      headers: headers
    });
  }

  updatePreferredLanguage(userId: number, language: string): Observable<any> {
    const headers = this.createAuthorizationHeader();
    return this.http.put(this.baseUrl + `/update-language/${userId}/${language}`, {}, {
      headers: headers
    });
  }

  updatePassword(data: any): Observable<any>{
    const headers = this.createAuthorizationHeader();
    console.log('Update password request:', data);
    console.log('Headers:', headers.keys());
    return this.http.put(this.baseUrl + `/update-password`, data, {headers: headers});
  }

  getAllProducts(): Observable<ProductData[]>{
    return this.http.get<ProductData[]>(this.baseUrl + `/get-all-products`, {
      headers: this.createAuthorizationHeader()
    })
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

    return this.http.get<any>(this.baseUrl + `/get-products-paginated?${params}`, {
      headers: this.createAuthorizationHeader()
    });
  }

  getCategories(): Observable<any[]>{
    return this.http.get<any[]>(this.baseUrl + `/get-categories`, {
      headers: this.createAuthorizationHeader()
    })
  }

  getProduct(id: number): Observable<ProductData>{
    return this.http.get<ProductData>(this.baseUrl + `/get-product/${id}`, {
      headers: this.createAuthorizationHeader()
    })
  }

  addToWishlist(productId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/wishlist/add/${productId}`, {}, {
      headers: this.createAuthorizationHeader()
    });
  }

  removeFromWishlist(productId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/wishlist/remove/${productId}`, {
      headers: this.createAuthorizationHeader()
    });
  }

  getUserWishlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/wishlist`, {
      headers: this.createAuthorizationHeader()
    });
  }

  checkIfInWishlist(productId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/wishlist/check/${productId}`, {
      headers: this.createAuthorizationHeader()
    });
  }

  // Cart methods
  addToCart(productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart/add/${productId}`, { quantity }, {
      headers: this.createAuthorizationHeader()
    });
  }

  removeFromCart(productId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/remove/${productId}`, {
      headers: this.createAuthorizationHeader()
    });
  }

  getUserCart(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/cart`, {
      headers: this.createAuthorizationHeader()
    });
  }

  updateCartItemQuantity(productId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/cart/update/${productId}`, { quantity }, {
      headers: this.createAuthorizationHeader()
    });
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/clear`, {
      headers: this.createAuthorizationHeader()
    });
  }

  checkIfInCart(productId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/cart/check/${productId}`, {
      headers: this.createAuthorizationHeader()
    });
  }
  createAuthorizationHeader(): HttpHeaders{
    const token = StorageService.getToken();
    if (!token) {
      console.error('No token found in storage');
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });
  }
}
