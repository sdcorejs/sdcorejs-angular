import { Routes } from '@angular/router';
import { PageListLiveDetailComponent } from './page-list-live-detail.component';
import { PageListLiveComponent } from './page-list-live.component';

/** Chi tiết là route con của danh sách: mở/đóng không làm mất bộ lọc, trang và vị trí cuộn. */
export const PAGE_LIST_LIVE_ROUTES: Routes = [
  {
    path: '',
    component: PageListLiveComponent,
    children: [{ path: ':id/detail', component: PageListLiveDetailComponent }],
  },
];
