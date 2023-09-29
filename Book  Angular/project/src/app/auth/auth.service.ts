import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';

import { BehaviorSubject, filter, Subscription, tap } from 'rxjs';
import { IUser } from '../shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private user$$ = new BehaviorSubject<undefined | null | IUser>(undefined);
  user$ = this.user$$.asObservable().pipe(
    filter((val): val is IUser | null => val !== undefined)
  );

      user: IUser | null = null;
      
       

      get isLoggedIn() {
        return localStorage.getItem('user') || null;
      }
      get savedUser(){
        return JSON.parse(localStorage.getItem('user')!);
      }
     
      
  subscription : Subscription
  
  constructor(private httpClient: HttpClient) { 
    this.subscription = this.user$.subscribe(user => {
      this.user = user;
    })
  }
  
  

  register(firstName: string, lastName: string, email: string, password: string) {
      return this.httpClient.post<IUser>('/api/register', {firstName, lastName,email, password})
      .pipe(tap((user) =>{
        localStorage.setItem('user', JSON.stringify(user));
        
        return this.user$$.next(user)
      }

        ))
  };

  login(email: string, password: string) {
    return this.httpClient.post<IUser>('/api/login', {email, password})
    .pipe(tap((user) => {
      localStorage.setItem('user', JSON.stringify(user));
     
      return this.user$$.next(user)
    }
      
      ));
};

logout(){
  return this.httpClient.post<void>('/api/logout', {}, {withCredentials: true})
  .pipe(tap(() => localStorage.clear()));
};

ngOnDestroy(): void {
  this.subscription.unsubscribe();
};

};
