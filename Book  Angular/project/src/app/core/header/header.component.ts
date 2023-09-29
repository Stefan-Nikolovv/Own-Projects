import { Component} from '@angular/core';

import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  
  get isLoggedIn() {
    return this.authService.isLoggedIn;
  }
 
  get userInfo(){
   return this.authService.savedUser
  };


constructor(private authService: AuthService){}



}
