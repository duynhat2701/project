import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response.model';
import { RequestItem } from '../../shared/models/request.model';

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly api = 'https://project-jet-five-10.vercel.app/api/requests';

  constructor(private http: HttpClient) {}

  create(data: { deviceId: number; quantity: number }): Observable<RequestItem> {
    return this.http.post<ApiResponse<RequestItem>>(this.api, data).pipe(
      map((response) => response.data),
    );
  }

  getAll(): Observable<RequestItem[]> {
    return this.http.get<ApiResponse<RequestItem[]>>(this.api).pipe(
      map((response) => response.data),
    );
  }

  getMy(): Observable<RequestItem[]> {
    return this.http.get<ApiResponse<RequestItem[]>>(`${this.api}/my`).pipe(
      map((response) => response.data),
    );
  }
}
