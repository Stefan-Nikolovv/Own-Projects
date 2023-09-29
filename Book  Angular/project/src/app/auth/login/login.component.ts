import { Component, } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { appEmailValidator } from 'src/app/shared/validators';
import { AuthService } from '../auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {

   re = new RegExp(`(^[a-zA-Z0-9]+\.[a-zA-Z0-9]+\@[a-z]+\.[bg|com|uk]+$)`);

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private fb: FormBuilder, private authService: AuthService) { }

  validationForm = this.fb.group({
    email: ["", [Validators.required, appEmailValidator]],
    password: ["", [Validators.required, Validators.minLength(5)]]
  });

  errorMessage: string = "";




  loginHandler() {

    if (this.validationForm.invalid) { return; }
    const { email, password } = this.validationForm.value;

    this.authService.login(email as string, password as string)
      .subscribe( {
        next: (user) => {
          
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.errorMessage = err.error.message;
        }
        
      });


  };


};


