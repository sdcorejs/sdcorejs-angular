import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Routes } from './not-found.routing';

@NgModule({
  imports: [CommonModule, RouterModule.forChild(Routes)],
  exports: [],
})
export class NotFoundModule {}
