import type { PatternMockResource } from '../mock-api.model';
import { APPROVAL_RESOURCE } from './approval.resource';
import { CATEGORY_RESOURCE } from './category.resource';
import { CUSTOMER_RESOURCE } from './customer.resource';
import { ORDER_RESOURCE } from './order.resource';
import { PARTNER_RESOURCE } from './partner.resource';
import { PRODUCT_RESOURCE } from './product.resource';
import { SETTINGS_RESOURCE } from './settings.resource';

// why: each resource is typed by its own record; the backend only needs the common shape.
const erase = (resource: object): PatternMockResource => resource as PatternMockResource;

/** Every collection the mock API serves. */
export const PATTERN_MOCK_RESOURCES: readonly PatternMockResource[] = [
  erase(PRODUCT_RESOURCE),
  erase(CUSTOMER_RESOURCE),
  erase(ORDER_RESOURCE),
  erase(APPROVAL_RESOURCE),
  erase(CATEGORY_RESOURCE),
  erase(PARTNER_RESOURCE),
  erase(SETTINGS_RESOURCE),
];
