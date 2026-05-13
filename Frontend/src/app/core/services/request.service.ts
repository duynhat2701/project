import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response.model';
import { RequestItem } from '../../shared/models/request.model';
import { environment } from '../../../environments/environment';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class RequestService extends BaseApiService {
  private readonly api = `${environment.apiBaseUrl}/requests`;

  constructor(private http: HttpClient) {
    super();
  }

  create(data: { deviceId: number; quantity: number }): Observable<RequestItem> {
    return this.handleRequest(
      this.http.post<ApiResponse<RequestItem>>(this.api, data).pipe(
        map((response) => response.data),
      ),
    );
  }

  getAll(): Observable<RequestItem[]> {
    return this.handleRequest(
      this.http.get<ApiResponse<RequestItem[]>>(this.api).pipe(
        map((response) => response.data),
      ),
    );
  }

  getMy(): Observable<RequestItem[]> {
    return this.handleRequest(
      this.http.get<ApiResponse<RequestItem[]>>(`${this.api}/my`).pipe(
        map((response) => response.data),
      ),
    );
  }
  reject(id: number): Observable<RequestItem> {
    return this.handleRequest(
      this.http.post<ApiResponse<RequestItem>>(`${this.api}/reject/${id}`, {}).pipe(
        map((response) => response.data),
      ),
    );
  }
}
