import { Component, OnInit } from '@angular/core';

import { ActivatedRoute,Params,  Router } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { IBook } from 'src/app/shared/interfaces/book';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

  constructor(private activatedRoute: ActivatedRoute,
     private apiService: ApiService,
      private router: Router,
       private authService: AuthService,
      
       ){
  };
  imageUrl?: string;
  get isLoggedIn() {
    return this.authService.isLoggedIn;
  };

  owner: boolean | false = false
  
  openModel(event: any) {
    event.preventDefault();
    const modelDiv = document.getElementById('myModal');
    if(modelDiv!= null) {
      modelDiv.style.display = 'block';
    }; 
  };

  CloseModel() { 
    const modelDiv = document.getElementById('myModal');
    if(modelDiv!= null) {
      modelDiv.style.display = 'none';
    };
  };
  


  deleteHandler(){
      this.apiService.deleteBook(this.activatedRoute.snapshot.params?.["id"])
      .subscribe(() => {
        this.router.navigate([`/`])
      });
    
  };

  bookList: IBook[] | null = null;
  errorFetcingData = false
    ngOnInit(): void {
      this.apiService.getOneBook(this.activatedRoute.snapshot.params?.["id"])
      .subscribe({
        next: (value) => {
          if(value[0].userId === this.authService.savedUser?._id){
           this.owner = true;
          }
          this.bookList = value;
        },
        error: (err) => {
          this.errorFetcingData = true;
         
        }
      });
    };
   
  
};


