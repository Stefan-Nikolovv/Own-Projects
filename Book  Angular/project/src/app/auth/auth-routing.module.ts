import { RouterModule, Routes } from "@angular/router";
// import { authGuard } from "../shared/guards/auth.activate";
import { LoginComponent } from "./login/login.component";
import { LogoutComponent } from "./logout/logout.component";
import { RegisterComponent } from "./register/register.component";



const routes: Routes =[
    
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [],
        data: {
            loginRequired: false
          }
    }, 
    {
        path: 'register', 
        component: RegisterComponent,
        canActivate: [],
        data: {
            loginRequired: false
          }
        
    },
    {
        path: 'logout',
        component: LogoutComponent,
        canActivate: [],
        data: {
            loginRequired: true
          }
    }
    
]

export const AuthRoutingModule = RouterModule.forChild(routes);