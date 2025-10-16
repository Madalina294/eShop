import { Component } from '@angular/core';
import {MatButton} from "@angular/material/button";
import {MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {RouterLink} from "@angular/router";
import {TranslatePipe} from "@ngx-translate/core";
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-view-products',
    imports: [
        MatButton,
        MatCard,
        MatCardHeader,
        MatCardSubtitle,
        MatCardTitle,
        MatIcon,
        RouterLink,
        TranslatePipe
    ],
  templateUrl: './view-products.component.html',
  styleUrl: './view-products.component.scss'
})
export class ViewProductsComponent {

}
