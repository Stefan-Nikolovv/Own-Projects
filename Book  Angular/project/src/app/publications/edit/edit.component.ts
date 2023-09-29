import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { IBook } from 'src/app/shared/interfaces/book';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit {

  constructor(private fb: FormBuilder, private router: Router, private activatedRoute: ActivatedRoute, private apiService: ApiService){}
  
  validationForm = this.fb.group({
    title: ["", [Validators.required, Validators.minLength(5), Validators.maxLength(10)]],
    description: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(150)]],
    imageUrl: ['', [Validators.required]],
    type: ['', [Validators.required]]
  });
 
  
  editHandler(){
  if(this.validationForm.invalid){
    return;
  }
    
  const {title, description, imageUrl, type} = this.validationForm.value;
      this.apiService.updateBook(this.activatedRoute.snapshot.params?.["id"], title as string, description as string, imageUrl as string, type as string )
      .subscribe((book) => {
        this.router.navigate([`/details/${book._id}`])
      })
  };

  

  

  bookList: IBook[] | any;
  errorFetcingData = false
    ngOnInit(): void {
      this.apiService.getOneBook(this.activatedRoute.snapshot.params?.["id"])
      .subscribe({
        next: (value) => {
          
          this.bookList = [...value];
          
          this.validationForm.get(['title'])?.setValue(this.bookList[0].title); 
          this.validationForm.get(['description'])?.setValue(this.bookList[0].description); 
          this.validationForm.get(['imageUrl'])?.setValue(this.bookList[0].imageUrl); 
          this.validationForm.get(['type'])?.setValue(this.bookList[0].type);
        },
        error: (err) => {
          this.errorFetcingData = true;
         
        }
      });
    }
    

}
