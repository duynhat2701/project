import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response.model';
import { UserModel } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  role: 'EMPLOYEE' | 'ADMIN';
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<UserModel[]> {
    return this.http.get<ApiResponse<UserModel[]>>(this.api).pipe(
      map((response) => response.data ?? []),
    );
  }

  create(data: UserPayload): Observable<UserModel> {
    return this.http.post<ApiResponse<UserModel>>(this.api, data).pipe(
      map((response) => response.data),
    );
  }

  update(id: number, data: UserPayload): Observable<UserModel> {
    return this.http.put<ApiResponse<UserModel>>(`${this.api}/${id}`, data).pipe(
      map((response) => response.data),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`).pipe(
      map(() => void 0),
    );
  }
}
