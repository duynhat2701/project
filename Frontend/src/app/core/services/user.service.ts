import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response.model';
import { UserModel } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = 'https://project-1-y5rk.onrender.com/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<UserModel[]> {
    return this.http.get<ApiResponse<UserModel[]>>(this.api).pipe(
      map((response) => response.data),
    );
  }
}
