import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

export abstract class BaseApiService {
  protected handleRequest<T>(request$: Observable<T>): Observable<T> {
    return request$.pipe(
      timeout(15000),
      catchError((error: HttpErrorResponse) => {
        console.error('API Error:', error);
        return throwError(() => error);
      }),
    );
  }
}
