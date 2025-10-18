import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AllUsersComponent} from './all-users/all-users.component';
import {AdminDashboardComponent} from './admin-dashboard/admin-dashboard.component';
import { adminGuard } from '../auth/guard/admin.guard';
import {SendEmailComponent} from './send-email/send-email.component';
import {ViewUserAccountComponent} from './view-user-account/view-user-account.component';
import {CreateCategoryComponent} from './create-category/create-category.component';
import {ViewCategoriesComponent} from './view-categories/view-categories.component';
import {EditCategoryComponent} from './edit-category/edit-category.component';
import {AddProductComponent} from './add-product/add-product.component';
import {ViewProductsComponent} from './view-products/view-products.component';
import {EditProductComponent} from './edit-product/edit-product.component';

const routes: Routes = [
  {path: "", component: AdminDashboardComponent, canActivate: [adminGuard]},
  {path: "dashboard", component: AdminDashboardComponent, canActivate: [adminGuard]},
  {path: "all-users", component: AllUsersComponent, canActivate: [adminGuard]},
  {path: "send-email", component: SendEmailComponent, canActivate: [adminGuard]},
  {path: "create-category", component: CreateCategoryComponent, canActivate: [adminGuard]},
  {path: "add-product", component: AddProductComponent, canActivate: [adminGuard]},
  {path: "view-categories", component: ViewCategoriesComponent, canActivate: [adminGuard]},
  {path: "edit-category", component: EditCategoryComponent, canActivate: [adminGuard]},
  {path: "view-products", component: ViewProductsComponent, canActivate: [adminGuard]},
  {path: "edit-product", component: EditProductComponent, canActivate: [adminGuard]},
  {path: "view-user-account", component: ViewUserAccountComponent, canActivate: [adminGuard]}
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
