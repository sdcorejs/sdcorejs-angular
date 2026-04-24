import { SdTableColumn } from '@sdcorejs/angular/components';
import { SdColor } from '@sdcorejs/angular/utilities/models';

/**
 * @description
 * `SdSchemaProperty` lÃ  má»™t kiá»ƒu dá»¯ liá»‡u há»£p nháº¥t (discriminated union type)
 * Ä‘Æ°á»£c sá»­ dá»¥ng Ä‘á»ƒ Ä‘á»‹nh nghÄ©a cáº¥u trÃºc cá»§a tá»«ng thuá»™c tÃ­nh (trÆ°á»ng) trong má»™t mÃ´ hÃ¬nh dá»¯ liá»‡u.
 * NÃ³ cung cáº¥p cÃ¡c cáº¥u hÃ¬nh chi tiáº¿t vá» kiá»ƒu dá»¯ liá»‡u, cÃ¡ch hiá»ƒn thá»‹, hÃ nh vi trong danh sÃ¡ch
 * vÃ  cÃ¡c quy táº¯c cho viá»‡c thÃªm/cáº­p nháº­t dá»¯ liá»‡u.
 */
export type SdSchemaProperty<T = any> =
  | PropertyString<T>
  | PropertyNumber<T>
  | PropertyDate<T>
  | PropertyDatetime<T>
  | PropertyBoolean<T>
  | PropertyEnum<T>
  | PropertyRelation<T>;

/**
 * @description
 * Kiá»ƒu dá»¯ liá»‡u cho thuá»™c tÃ­nh `type` cá»§a `SdSchemaProperty`.
 * DÃ¹ng Ä‘á»ƒ phÃ¢n biá»‡t cÃ¡c loáº¡i thuá»™c tÃ­nh khÃ¡c nhau.
 */
export type SdSchemaPropertyType = SdSchemaProperty['type'];

/**
 * @description
 * Giao diá»‡n cÆ¡ báº£n cho táº¥t cáº£ cÃ¡c loáº¡i thuá»™c tÃ­nh trong schema.
 * Má»i thuá»™c tÃ­nh cá»¥ thá»ƒ Ä‘á»u pháº£i káº¿ thá»«a cÃ¡c thuá»™c tÃ­nh tá»« giao diá»‡n nÃ y.
 */
interface PropertyBase<T = any> {
  /**
   * @description
   * TÃªn trÆ°á»ng (field name) cá»§a thuá»™c tÃ­nh trong model.
   * ÄÃ¢y lÃ  khÃ³a Ä‘á»ƒ Ã¡nh xáº¡ thuá»™c tÃ­nh nÃ y vá»›i dá»¯ liá»‡u thá»±c táº¿ cá»§a model.
   * @example 'name', 'statusCode', 'createdAt'
   */
  code: Extract<keyof T, string>;
  /**
   * @description
   * NhÃ£n tiáº¿ng Viá»‡t cá»§a trÆ°á»ng thÃ´ng tin, hiá»ƒn thá»‹ trÃªn giao diá»‡n ngÆ°á»i dÃ¹ng.
   * @example 'TÃªn sáº£n pháº©m', 'MÃ£ Ä‘Æ¡n hÃ ng', 'NgÃ y táº¡o'
   */
  label: string;
  /**
   * @description
   * (TÃ¹y chá»n) Cáº¥u hÃ¬nh liÃªn quan Ä‘áº¿n cÃ¡ch thuá»™c tÃ­nh nÃ y Ä‘Æ°á»£c hiá»ƒn thá»‹ trong danh sÃ¡ch (báº£ng).
   * @see List
   */
  list?: List<T>;
  /**
   * @description
   * (TÃ¹y chá»n) Cáº¥u hÃ¬nh liÃªn quan Ä‘áº¿n cÃ¡ch thuá»™c tÃ­nh nÃ y Ä‘Æ°á»£c hiá»ƒn thá»‹ trong mÃ n hÃ¬nh chi tiáº¿t (form).
   * @see Detail
   */
  detail?: Detail<T>;
}

/**
 * @description
 * Äá»‹nh nghÄ©a thuá»™c tÃ­nh cÃ³ kiá»ƒu dá»¯ liá»‡u lÃ  chuá»—i vÄƒn báº£n.
 */
interface PropertyString<T> extends PropertyBase<T> {
  /**
   * @description Kiá»ƒu cá»§a thuá»™c tÃ­nh. LuÃ´n lÃ  'string'.
   */
  type: 'string';
}

/**
 * @description
 * Äá»‹nh nghÄ©a thuá»™c tÃ­nh cÃ³ kiá»ƒu dá»¯ liá»‡u lÃ  sá»‘.
 */
interface PropertyNumber<T> extends PropertyBase<T> {
  /**
   * @description Kiá»ƒu cá»§a thuá»™c tÃ­nh. LuÃ´n lÃ  'number'.
   */
  type: 'number';
}

/**
 * @description
 * Äá»‹nh nghÄ©a thuá»™c tÃ­nh cÃ³ kiá»ƒu dá»¯ liá»‡u lÃ  ngÃ y thÃ¡ng (chá»‰ ngÃ y, khÃ´ng cÃ³ thá»i gian).
 */
interface PropertyDate<T> extends PropertyBase<T> {
  /**
   * @description Kiá»ƒu cá»§a thuá»™c tÃ­nh. LuÃ´n lÃ  'date'.
   */
  type: 'date';
}

/**
 * @description
 * Äá»‹nh nghÄ©a thuá»™c tÃ­nh cÃ³ kiá»ƒu dá»¯ liá»‡u lÃ  ngÃ y vÃ  giá».
 */
interface PropertyDatetime<T> extends PropertyBase<T> {
  /**
   * @description Kiá»ƒu cá»§a thuá»™c tÃ­nh. LuÃ´n lÃ  'datetime'.
   */
  type: 'datetime';
}

/**
 * @description
 * Äá»‹nh nghÄ©a thuá»™c tÃ­nh cÃ³ kiá»ƒu dá»¯ liá»‡u lÃ  boolean (Ä‘Ãºng/sai).
 */
interface PropertyBoolean<T> extends PropertyBase<T> {
  /**
   * @description Kiá»ƒu cá»§a thuá»™c tÃ­nh. LuÃ´n lÃ  'boolean'.
   */
  type: 'boolean';
  /**
   * @description
   * (TÃ¹y chá»n) Kiá»ƒu hiá»ƒn thá»‹ cá»¥ thá»ƒ cho thuá»™c tÃ­nh boolean trÃªn giao diá»‡n.
   * @default 'dropdown'
   */
  subType?: 'dropdown' | 'checkbox' | 'switch' | 'radio';
  /**
   * @description
   * (TÃ¹y chá»n) VÄƒn báº£n hiá»ƒn thá»‹ trÃªn giao diá»‡n khi giÃ¡ trá»‹ lÃ  `true`.
   * @example 'Hoáº¡t Ä‘á»™ng', 'ÄÃ£ duyá»‡t'
   */
  displayOnTrue?: string;
  /**
   * @description
   * (TÃ¹y chá»n) VÄƒn báº£n hiá»ƒn thá»‹ trÃªn giao diá»‡n khi giÃ¡ trá»‹ lÃ  `false`.
   * @example 'KhÃ´ng hoáº¡t Ä‘á»™ng', 'ChÆ°a duyá»‡t'
   */
  displayOnFalse?: string;
}

/**
 * @description
 * Äá»‹nh nghÄ©a thuá»™c tÃ­nh kiá»ƒu enum (liá»‡t kÃª), cho phÃ©p chá»n má»™t trong cÃ¡c giÃ¡ trá»‹ Ä‘á»‹nh sáºµn.
 */
interface PropertyEnum<T> extends PropertyBase<T> {
  /**
   * @description Kiá»ƒu cá»§a thuá»™c tÃ­nh. LuÃ´n lÃ  'enum'.
   */
  type: 'enum';
  /**
   * @description
   * Máº£ng cÃ¡c Ä‘á»‘i tÆ°á»£ng tÃ¹y chá»n cho thuá»™c tÃ­nh enum. Má»—i Ä‘á»‘i tÆ°á»£ng bao gá»“m:
   * - `value`: GiÃ¡ trá»‹ thá»±c táº¿ cá»§a tÃ¹y chá»n.
   * - `display`: VÄƒn báº£n hiá»ƒn thá»‹ cho ngÆ°á»i dÃ¹ng.
   * - `badgeColor`: (TÃ¹y chá»n) MÃ u sáº¯c cho badge hiá»ƒn thá»‹ tÃ¹y chá»n (vÃ­ dá»¥: 'success', 'warning').
   * - `badgeIcon`: (TÃ¹y chá»n) Icon cho badge hiá»ƒn thá»‹ tÃ¹y chá»n.
   */
  options: {
    value: string;
    display: string;
    badgeColor?: SdColor;
    badgeIcon?: string;
  }[];
}

/**
 * @description
 * Äá»‹nh nghÄ©a thuá»™c tÃ­nh quan há»‡ (relation), liÃªn káº¿t Ä‘áº¿n má»™t mÃ´ hÃ¬nh dá»¯ liá»‡u khÃ¡c.
 */
interface PropertyRelation<T> extends PropertyBase<T> {
  /**
   * @description Kiá»ƒu cá»§a thuá»™c tÃ­nh. LuÃ´n lÃ  'relation'.
   */
  type: 'relation';
  /**
   * @description
   * Kiá»ƒu quan há»‡ giá»¯a mÃ´ hÃ¬nh hiá»‡n táº¡i vÃ  mÃ´ hÃ¬nh Ä‘Æ°á»£c liÃªn káº¿t.
   * @example 'OneToOne', 'OneToMany', 'ManyToMany', 'ManyToOne'
   */
  relation: 'OneToOne' | 'OneToMany' | 'ManyToMany' | 'ManyToOne';
  /**
   * @description
   * TÃªn cá»§a module backend mÃ  má»‘i quan há»‡ nÃ y trá» tá»›i.
   * @example 'user-management', 'product-catalog'
   */
  module: string;
  /**
   * @description
   * `typeCode` cá»§a mÃ´ hÃ¬nh Ä‘Æ°á»£c liÃªn káº¿t (nhÆ° Ä‘Æ°á»£c Ä‘á»‹nh nghÄ©a trong `SdSchema` cá»§a nÃ³).
   * @example 'CUSTOMER_DETAIL', 'PRODUCT_ITEM'
   */
  typeCode: string;
  /**
   * @description
   * (TÃ¹y chá»n) TrÆ°á»ng nÃ o cá»§a model hiá»‡n táº¡i sáº½ Ä‘Æ°á»£c Ã¡nh xáº¡ Ä‘áº¿n trÆ°á»ng nÃ o cá»§a model Ä‘Æ°á»£c liÃªn káº¿t (mappedTo).
   * VÃ­ dá»¥: Property `orderId` cá»§a `OrderDetail` cÃ³ quan há»‡ Ä‘áº¿n `Order`
   * cÃ³ thá»ƒ `mappedTo` Ä‘áº¿n trÆ°á»ng 'orderDetailIds' cá»§a `Order` model.
   * @example 'orderDetailIds' (trÆ°á»ng nÃ y thuá»™c vá» model Ä‘Æ°á»£c liÃªn káº¿t)
   */
  mappedTo?: string;
  /**
   * @description
   * (TÃ¹y chá»n) Má»™t Ä‘á»‘i tÆ°á»£ng chá»©a cÃ¡c tham sá»‘ truy váº¥n bá»• sung
   * Ä‘á»ƒ Ã¡p dá»¥ng khi láº¥y dá»¯ liá»‡u cho má»‘i quan há»‡ nÃ y.
   * @example `{ isActive: true, status: 'approved' }`
   */
  query?: Record<string, never>;

  /**
   * @description
   * (TÃ¹y chá»n) TrÆ°á»ng tá»« mÃ´ hÃ¬nh liÃªn káº¿t sáº½ Ä‘Æ°á»£c sá»­ dá»¥ng lÃ m giÃ¡ trá»‹ duy nháº¥t.
   * Máº·c Ä‘á»‹nh lÃ  khÃ³a chÃ­nh (`primaryKey`) cá»§a `SdSchema` cá»§a mÃ´ hÃ¬nh Ä‘Æ°á»£c liÃªn káº¿t.
   * @example 'id', 'code'
   */
  valueField?: string;
  /**
   * @description
   * (TÃ¹y chá»n) TrÆ°á»ng tá»« mÃ´ hÃ¬nh liÃªn káº¿t sáº½ Ä‘Æ°á»£c hiá»ƒn thá»‹ cho ngÆ°á»i dÃ¹ng trÃªn giao diá»‡n.
   * @example 'name', 'fullName'
   */
  displayField?: string;
  /**
   * @description
   * (TÃ¹y chá»n) Danh sÃ¡ch cÃ¡c trÆ°á»ng trong mÃ´ hÃ¬nh liÃªn káº¿t sáº½ Ä‘Æ°á»£c dÃ¹ng Ä‘á»ƒ tÃ¬m kiáº¿m
   * khi ngÆ°á»i dÃ¹ng nháº­p vÃ o Ã´ tÃ¬m kiáº¿m cá»§a trÆ°á»ng quan há»‡.
   * @example ['name', 'email', 'phone']
   */
  searchFields?: string[];
  /**
   * @description
   * (TÃ¹y chá»n) Má»™t chuá»—i Ä‘á»‹nh dáº¡ng vÄƒn báº£n Ä‘á»ƒ tÃ¹y chá»‰nh cÃ¡ch hiá»ƒn thá»‹ cá»§a thá»±c thá»ƒ liÃªn káº¿t.
   * @example `${code} - ${name}` sáº½ hiá»ƒn thá»‹ "PROD001 - BÃ n phÃ­m cÆ¡"
   */
  transform?: string;
  /**
   * @description
   * (TÃ¹y chá»n) Má»™t chuá»—i Ä‘á»‹nh dáº¡ng HTML Ä‘á»ƒ tÃ¹y chá»‰nh cÃ¡ch hiá»ƒn thá»‹ cá»§a thá»±c thá»ƒ liÃªn káº¿t.
   * Há»¯u Ã­ch cho cÃ¡c trÆ°á»ng há»£p hiá»ƒn thá»‹ phá»©c táº¡p hÆ¡n so vá»›i `transform`.
   * @example `<div><span>${code}</span> - <strong>${name}</strong></div>`
   */
  template?: string;
}

/**
 * @description
 * Giao diá»‡n Ä‘á»‹nh nghÄ©a cÃ¡c cáº¥u hÃ¬nh cho thuá»™c tÃ­nh khi hiá»ƒn thá»‹ trong danh sÃ¡ch (báº£ng).
 */
interface List<T = any> {
  /**
   * @description
   * (TÃ¹y chá»n) Chiá»u rá»™ng cá»§a cá»™t trong báº£ng.
   * CÃ³ thá»ƒ lÃ  sá»‘ (pixels) hoáº·c chuá»—i (vÃ­ dá»¥: '100px', '20%').
   * @see SdTableColumn['width']
   */
  width?: SdTableColumn<T>['width'];
  /**
   * @description
   * (TÃ¹y chá»n) Náº¿u lÃ  `true`, cá»™t nÃ y sáº½ bá»‹ áº©n hoÃ n toÃ n vÃ  ngÆ°á»i dÃ¹ng khÃ´ng thá»ƒ hiá»ƒn thá»‹ láº¡i
   * thÃ´ng qua cÃ i Ä‘áº·t hiá»ƒn thá»‹ cá»™t.
   * @see SdTableColumn['hidden']
   * @default false
   */
  hidden?: SdTableColumn<T>['hidden'];
  /**
   * @description
   * (TÃ¹y chá»n) Náº¿u lÃ  `true`, cá»™t nÃ y sáº½ bá»‹ áº©n máº·c Ä‘á»‹nh nhÆ°ng ngÆ°á»i dÃ¹ng cÃ³ thá»ƒ hiá»ƒn thá»‹ láº¡i
   * thÃ´ng qua cÃ i Ä‘áº·t hiá»ƒn thá»‹ cá»™t.
   * @see SdTableColumn['invisible']
   * @default false
   */
  invisible?: SdTableColumn<T>['invisible'];
  /**
   * @description
   * (TÃ¹y chá»n) Náº¿u lÃ  `true`, cá»™t nÃ y cÃ³ thá»ƒ Ä‘Æ°á»£c sáº¯p xáº¿p (sort) trong báº£ng.
   * @see SdTableColumn['sortable']
   * @default false
   */
  sortable?: SdTableColumn<T>['sortable'];
  /**
   * @description
   * (TÃ¹y chá»n) Cáº¥u hÃ¬nh bá»™ lá»c cho cá»™t nÃ y trong báº£ng.
   * @see SdTableColumn['filter']
   */
  filter?: SdTableColumn<T>['filter'];
  /**
   * @description
   * (TÃ¹y chá»n) HÃ m hoáº·c chuá»—i Ä‘á»‹nh dáº¡ng vÄƒn báº£n Ä‘á»ƒ chuyá»ƒn Ä‘á»•i giÃ¡ trá»‹ hiá»ƒn thá»‹ cá»§a cá»™t.
   * @see SdTableColumn['transform']
   */
  transform?: SdTableColumn<T>['transform'];
  /**
   * @description
   * (TÃ¹y chá»n) Chuá»—i template HTML Ä‘á»ƒ tÃ¹y chá»‰nh cÃ¡ch hiá»ƒn thá»‹ ná»™i dung cá»§a Ã´ trong báº£ng.
   * @see SdTableColumn['htmlTemplate']
   */
  htmlTemplate?: SdTableColumn<T>['htmlTemplate'];
}

/**
 * @description
 * Giao diá»‡n Ä‘á»‹nh nghÄ©a cÃ¡c cáº¥u hÃ¬nh cho thuá»™c tÃ­nh khi hiá»ƒn thá»‹ trong mÃ n hÃ¬nh chi tiáº¿t (form táº¡o/cáº­p nháº­t).
 */
interface Detail<T = any> {
  /**
   * @description
   * (TÃ¹y chá»n) Náº¿u lÃ  `true`, trÆ°á»ng nÃ y cÃ³ thá»ƒ Ä‘Æ°á»£c chÃ¨n (insert) khi táº¡o má»›i Ä‘á»‘i tÆ°á»£ng.
   * @default true
   */
  insertable?: boolean;
  /**
   * @description
   * (TÃ¹y chá»n) Náº¿u lÃ  `true`, trÆ°á»ng nÃ y cÃ³ thá»ƒ Ä‘Æ°á»£c cáº­p nháº­t (update) khi chá»‰nh sá»­a Ä‘á»‘i tÆ°á»£ng.
   * @default true
   */
  updatable?: boolean;
  /**
   * @description
   * (TÃ¹y chá»n) Náº¿u lÃ  `true`, trÆ°á»ng nÃ y lÃ  báº¯t buá»™c (required) khi nháº­p liá»‡u.
   * @default false
   */
  required?: boolean;
  /**
   * @description
   * (TÃ¹y chá»n) GiÃ¡ trá»‹ máº·c Ä‘á»‹nh cá»§a trÆ°á»ng khi táº¡o má»›i.
   * @default undefined
   */
  defaultValue?: never; // Sá»­ dá»¥ng 'never' Ä‘á»ƒ Ä‘áº£m báº£o ráº±ng Ä‘Ã¢y lÃ  má»™t thuá»™c tÃ­nh marker vÃ  khÃ´ng nÃªn Ä‘Æ°á»£c gÃ¡n giÃ¡ trá»‹ cá»¥ thá»ƒ á»Ÿ Ä‘Ã¢y. GiÃ¡ trá»‹ sáº½ Ä‘Æ°á»£c gÃ¡n trong cÃ¡c thÃ nh pháº§n UI dá»±a trÃªn kiá»ƒu dá»¯ liá»‡u cá»§a Property.
}
