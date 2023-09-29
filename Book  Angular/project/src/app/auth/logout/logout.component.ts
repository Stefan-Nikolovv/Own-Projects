import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent {


  constructor(private authService: AuthService, private router: Router){
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/'])
      },
      error: () => {
        this.router.navigate(['/auth/login'])
      }
    })
  }
}
