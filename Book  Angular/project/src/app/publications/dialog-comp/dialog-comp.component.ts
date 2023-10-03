import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-dialog-comp',
  templateUrl: './dialog-comp.component.html',
  styleUrls: ['./dialog-comp.component.css']
})

export class DialogCompComponent {
constructor( 
private activatedRoute: ActivatedRoute,
  private apiService: ApiService,
   private router: Router,
    private authService: AuthService,){
  
   

      
}
clicknNO(){
  let r = this.router as any;
  let url = r.routerState.root._routerState.snapshot.url;
  let id = url.split('/')[3];
  this.router.navigate([`${`publication/details/${id}`}`]);
}


}
