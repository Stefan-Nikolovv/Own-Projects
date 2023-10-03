import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { IBook } from 'src/app/shared/interfaces/book';


@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit {

  constructor(private activatedRoute: ActivatedRoute, private fb: FormBuilder, private router: Router, private apiService: ApiService, private sant: DomSanitizer){}
  
  base64: string = "Base64...";
  fileSelected?: File;
  imageUrl?: string;

  barWidth: string = "0%";

  validationForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
    author: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
    description: ['', [Validators.required,Validators.minLength(15), Validators.maxLength(100)]],
    imageUrl: [""],
    type: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(20)]]
  });
 
  onSelectNewFile(elemnt: any): void {
    if (elemnt.target.files?.length == 0) return;
    this.fileSelected = (elemnt.target.files as FileList)[0];
    this.imageUrl = this.sant.bypassSecurityTrustUrl(window.URL.createObjectURL(this.fileSelected)) as string;
    this.base64 = "Base64...";
    this.validationForm.get(['imageUrl'])?.setValue(this.imageUrl)
  };


   file:string | null | undefined;
  onFileChanged(event: any): void{
    if(event.target.files){
     var reader = new FileReader();
     
     reader.readAsDataURL(event.target.files[0]);
     reader.onload = (e:any) => {
     this.file =  e.target.result;
     this.bookList[0].imageUrl = this.file;
     };
    };
      
    };
  
  editHandler(){
  if(this.validationForm.invalid){
    return;
  };
    
  const {author, title, description, type } = this.validationForm.value;
      this.apiService.updateBook(this.activatedRoute.snapshot.params?.["id"], this.file as string, author as string, title as string, description as string, type as string )
      .subscribe((book) => {
        this.router.navigate([`publication/details/${book._id}`]);
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
          this.validationForm.get(['author'])?.setValue(this.bookList[0].author);
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
