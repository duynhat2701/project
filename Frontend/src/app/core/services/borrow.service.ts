import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Borrow } from '../../shared/models/borrow.model';
import { ApiResponse } from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class BorrowService {
  private readonly api = 'https://project-jet-five-10.vercel.app';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Borrow[]> {
    return this.http.get<ApiResponse<Borrow[]>>(this.api).pipe(
      map((response) => response.data),
    );
  }

  getMy(): Observable<Borrow[]> {
    return this.http.get<ApiResponse<Borrow[]>>(`${this.api}/my`).pipe(
      map((response) => response.data),
    );
  }

  approve(requestId: number): Observable<Borrow> {
    return this.http.post<ApiResponse<Borrow>>(`${this.api}/approve/${requestId}`, {}).pipe(
      map((response) => response.data),
    );
  }

  returnDevice(borrowId: number): Observable<Borrow> {
    return this.http.post<ApiResponse<Borrow>>(`${this.api}/return/${borrowId}`, {}).pipe(
      map((response) => response.data),
    );
  }
}
