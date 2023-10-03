import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/api.service';
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


  validationForm = this.fb.group({
    keyword: ['', [Validators.required]]
   
  });

constructor(private fb: FormBuilder, private router: Router, private apiSerivce: ApiService, private sant: DomSanitizer, private authService: AuthService){}

createdHandler(){
  
  if(this.validationForm.invalid) {
    return;
  }
  const { keyword } = this.validationForm.value;
 
    this.router.navigate(['/search'], { queryParams: { book: keyword } })
    
}

}
