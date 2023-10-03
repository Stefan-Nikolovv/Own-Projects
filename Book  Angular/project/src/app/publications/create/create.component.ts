import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/api.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {
  base64: string = "Base64...";
  fileSelected?: File;
  imageUrl?: string;

  barWidth: string = "0%";

  validationForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
    author: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
    description: ['', [Validators.required,Validators.minLength(15), Validators.maxLength(100)]],
    createinputfile: [""],
    type: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(20)]]
  });


  
  constructor(private fb: FormBuilder, private router: Router, private apiSerivce: ApiService, private sant: DomSanitizer){}
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  onSelectNewFile(elemnt: any): void {
    if (elemnt.target.files?.length == 0) return;
    this.fileSelected = (elemnt.target.files as FileList)[0];
    this.imageUrl = this.sant.bypassSecurityTrustUrl(window.URL.createObjectURL(this.fileSelected)) as string;
    this.base64 = "Base64...";
  };


   file:string | null | undefined;
  onFileChanged(event: any): void{
    if(event.target.files){
     var reader = new FileReader();
     
     reader.readAsDataURL(event.target.files[0]);
     reader.onload = (e:any) => {
     this.file =  e.target.result;
     
     };
    };
      
    };

  createdHandler(){
    if(this.validationForm.invalid) {
      return;
    };
    
    const { author, title, description, type } = this.validationForm.value;
      this.apiSerivce.createBook(this.file as string, author as string, title as string, description as string, type as string )
      .subscribe(() => {
        this.router.navigate(['/'])
      });
  };
};
