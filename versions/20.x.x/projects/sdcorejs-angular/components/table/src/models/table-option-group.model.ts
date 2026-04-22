export interface SdTableOptionGroup<T = any> {
  fields: string[]; // Tiêu chí nhóm các thông tin của grid theo field nào
  htmlTemplate: (rowDatas: T[]) => string;
}
