import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {AllProductsComponent} from './all-products/all-products.component';
import {userGuard} from '../auth/guard/user.guard';
import {ViewProductComponent} from './view-product/view-product.component';


const routes: Routes = [
  {path: "", component: AllProductsComponent, canActivate: [userGuard]},
  {path: "all-products", component: AllProductsComponent, canActivate: [userGuard]},
  {path: "view-product", component: ViewProductComponent, canActivate: [userGuard]}

]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule{}
