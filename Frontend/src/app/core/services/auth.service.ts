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

  constructor(private http: HttpClient) {}

  login(data: LoginPayload): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/auth/login`, data).pipe(
      map((response) => response.data),
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.userKey, JSON.stringify(response));
      }),
    );
  }

  register(data: RegisterPayload): Observable<UserResponse> {
    return this.http.post<ApiResponse<UserResponse>>(`${this.baseUrl}/users`, data).pipe(
      map((response) => response.data),
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
