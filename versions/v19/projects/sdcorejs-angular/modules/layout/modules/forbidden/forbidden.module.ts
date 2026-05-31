import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Routes } from './forbidden.routing';

@NgModule({
  imports: [CommonModule, RouterModule.forChild(Routes)],
  exports: [],
})
export class ForbiddenModule {}
