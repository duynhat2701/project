import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response.model';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'EMPLOYEE';
}

export interface LoginResponse {
  token: string;
  type: string;
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'https://project-1-y5rk.onrender.com/api';
  private readonly tokenKey = 'token';
  private readonly userKey = 'currentUser';
  private readonly storage = sessionStorage;

  constructor(private http: HttpClient) {}

  login(data: LoginPayload): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/auth/login`, data).pipe(
      map((response) => response.data),
      tap((response) => {
        this.saveToken(response.token);
        this.saveUser(response);
      }),
    );
  }

  register(data: RegisterPayload): Observable<UserResponse> {
    return this.http.post<ApiResponse<UserResponse>>(`${this.baseUrl}/users`, data).pipe(
      map((response) => response.data),
    );
  }

  saveToken(token: string): void {
    this.storage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return this.storage.getItem(this.tokenKey);
  }

  saveUser(user: LoginResponse): void {
    this.storage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): LoginResponse | null {
    const rawUser = this.storage.getItem(this.userKey);
    return rawUser ? (JSON.parse(rawUser) as LoginResponse) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'ADMIN';
  }

  isEmployee(): boolean {
    return this.getUser()?.role === 'EMPLOYEE';
  }

  logout(): void {
    this.storage.removeItem(this.tokenKey);
    this.storage.removeItem(this.userKey);
  }
}
