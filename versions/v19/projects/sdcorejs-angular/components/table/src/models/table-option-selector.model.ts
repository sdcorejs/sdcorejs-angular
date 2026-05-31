import { SdButton } from '@sdcorejs/angular/components/button';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';

export interface SdTableOptionSelector<T = any> {
  /** Báº­t/táº¯t cá»™t checkbox selector. Máº·c Ä‘á»‹nh: true. */
  visible?: boolean;
  /** Chá»‰ cho chá»n 1 dÃ²ng táº¡i má»™t thá»i Ä‘iá»ƒm. */
  single?: boolean;
  /** Danh sÃ¡ch action hiá»ƒn thá»‹ khi cÃ³ item Ä‘Æ°á»£c chá»n. */
  actions?: SdTableAction<T>[];
  /** Ná»™i dung hiá»ƒn thá»‹ bÃªn cáº¡nh selector/action bar. */
  message?: string | ((selectedItems?: T[]) => string);
  /** Callback khi user chá»n/bá» chá»n má»™t dÃ²ng. */
  onSelect?: (rowData?: T, selectedItems?: T[]) => void;
  /** Callback khi user chá»n táº¥t cáº£ hoáº·c bá» chá»n táº¥t cáº£. */
  onSelectAll?: (selectedItems: T[]) => void;
  /** Disable checkbox cá»§a tá»«ng dÃ²ng theo Ä‘iá»u kiá»‡n. */
  disabled?: (rowData?: T, selectedItems?: T[]) => boolean;
  /**
   * Predicate Ä‘á»ƒ tá»± Ä‘á»™ng pre-select item sau má»—i láº§n load.
   * Table sáº½ gá»i hÃ m nÃ y cho tá»«ng item vÃ  set isSelected = true náº¿u tráº£ vá» true.
   * DÃ¹ng khi cáº§n programmatically set selected items tá»« bÃªn ngoÃ i.
   */
  defaultSelected?: (rowData: T) => boolean;
  /**
   * Giá»¯ láº¡i selection khi user chuyá»ƒn trang / filter / sort / reload.
   * Selection chá»‰ bá»‹ clear khi user báº¥m nÃºt X (onClearSelection) hoáº·c bá» chá»n tá»«ng item.
   *
   * - Default (false): selection bá»‹ máº¥t khi data items Ä‘Æ°á»£c re-fetch (server-side) hoáº·c
   *   item references thay Ä‘á»•i. Action bar chá»‰ hiá»ƒn thá»‹ sá»‘ item selected á»Ÿ page hiá»‡n táº¡i.
   * - Enabled (true): table giá»¯ map ná»™i bá»™ selectedItems theo `meta.id` (hash cá»§a data).
   *   Sau má»—i #render, restore `isSelected` cho item nÃ o id Ä‘Ã£ cÃ³ trong map.
   *   `selectedTableItems()` tráº£ vá» TOÃ€N Bá»˜ item Ä‘Ã£ chá»n xuyÃªn trang (ká»ƒ cáº£ off-page),
   *   nÃªn action bar + callback `click(items)` nháº­n Ä‘áº§y Ä‘á»§ data Ä‘ang Ä‘Æ°á»£c chá»n.
   *
   * LÆ°u Ã½: matching dá»±a trÃªn `Utilities.hash(data)` â€” hai item cÃ³ cÃ¹ng data shape sáº½
   * trÃ¹ng id (mong muá»‘n). Náº¿u data cÃ³ timestamp/random field thay Ä‘á»•i giá»¯a cÃ¡c láº§n fetch,
   * id sáº½ khÃ¡c vÃ  selection khÃ´ng restore Ä‘Æ°á»£c.
   */
  preserveSelection?: boolean;
}

export type SdTableAction<T = any> = SdTableActionNormal<T> | SdTableActionChildren<T>;

export interface SdTableActionNormal<T = any> {
  /**
   * TÃªn icon hiá»ƒn thá»‹ trÃªn action button.
   * GiÃ¡ trá»‹ nÃ y Ä‘Æ°á»£c render qua `mat-icon`, vÃ¬ váº­y nÃªn dÃ¹ng Ä‘Ãºng tÃªn glyph cá»§a Material Icons.
   * Tra cá»©u icon táº¡i: https://fonts.google.com/icons
   */
  icon?: string;
  /**
   * Font set cá»§a Material icon.
   * Kiá»ƒu thá»±c táº¿ láº¥y tá»« `SdButton['fontSet']` vÃ  chá»‰ há»— trá»£ cÃ¡c giÃ¡ trá»‹ thuá»™c `MaterialIconFontSet`,
   * vÃ­ dá»¥: `material-icons`, `material-icons-outlined`, `material-icons-round`,
   * `material-icons-sharp`.
   * Náº¿u khÃ´ng truyá»n, `SdButton` sáº½ dÃ¹ng font set máº·c Ä‘á»‹nh cá»§a nÃ³.
   */
  fontSet?: SdUnwrapSignal<SdButton['fontSet']>;
  /** Tooltip hiá»ƒn thá»‹ khi hover action button. */
  tooltip?: SdUnwrapSignal<SdButton['tooltip']>;
  /** Text label hiá»ƒn thá»‹ trÃªn button action. */
  title?: SdUnwrapSignal<SdButton['title']>;
  /**
   * MÃ u cá»§a `SdButton`.
   * Kiá»ƒu thá»±c táº¿ map theo `SdButton['color']`, hiá»‡n dÃ¹ng cÃ¡c token nhÆ°
   * `primary`, `secondary`, `info`, `success`, `warning`, `error`.
   */
  color?: SdUnwrapSignal<SdButton['color']>;
  /**
   * Variant hiá»ƒn thá»‹ cá»§a `SdButton`.
   * Kiá»ƒu thá»±c táº¿ lÃ  `fill | light | outline | link`.
   */
  type?: SdUnwrapSignal<SdButton['type']>;
  /** áº¨n action theo cá» tÄ©nh hoáº·c theo Ä‘iá»u kiá»‡n cá»§a dá»¯ liá»‡u dÃ²ng. */
  hidden?: boolean | ((rowData?: T) => boolean);
  /** Gom action vÃ o nhÃ³m hiá»ƒn thá»‹ compact náº¿u table há»— trá»£ grouped actions. */
  isGrouped?: boolean;
  /** HÃ m xá»­ lÃ½ khi click action, nháº­n toÃ n bá»™ item Ä‘ang Ä‘Æ°á»£c chá»n. */
  click: (selectedItems?: T[]) => void;
}

interface SdTableActionChildren<T = any> {
  /**
   * TÃªn icon cá»§a action cha (group action).
   * GiÃ¡ trá»‹ nÃªn lÃ  tÃªn glyph Material Icons: https://fonts.google.com/icons
   */
  icon?: string;
  /**
   * Font set cá»§a Material icon cho action cha.
   * DÃ¹ng cÃ¹ng kiá»ƒu dá»¯ liá»‡u vá»›i `SdButton['fontSet']`.
   */
  fontSet?: SdUnwrapSignal<SdButton['fontSet']>;
  /** Tooltip cá»§a action cha. */
  tooltip?: SdUnwrapSignal<SdButton['tooltip']>;
  /** Label cá»§a action cha. */
  title?: SdUnwrapSignal<SdButton['title']>;
  /** MÃ u cá»§a action cha theo kiá»ƒu `SdButton['color']`. */
  color?: SdUnwrapSignal<SdButton['color']>;
  /** Variant hiá»ƒn thá»‹ cá»§a action cha theo kiá»ƒu `SdButton['type']`. */
  type?: SdUnwrapSignal<SdButton['type']>;
  /** áº¨n action cha theo cá» tÄ©nh hoáº·c theo Ä‘iá»u kiá»‡n cá»§a dá»¯ liá»‡u dÃ²ng. */
  hidden?: boolean | ((rowData?: T) => boolean);
  /** Gom action cha vÃ o nhÃ³m hiá»ƒn thá»‹ compact náº¿u table há»— trá»£ grouped actions. */
  isGrouped?: boolean;
  /** Danh sÃ¡ch action con hiá»ƒn thá»‹ bÃªn trong group action nÃ y. */
  children: SdTableActionNormal<T>[];
}

