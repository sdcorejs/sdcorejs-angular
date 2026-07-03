export type SdIconSet = 'material-icons' | 'material-icons-outlined' | 'material-icons-round' | 'material-icons-sharp' | 'lucide';
export type SdMaterialIconSet = Exclude<SdIconSet, 'lucide'>;
export const DefaultSdIconSet: SdIconSet = 'material-icons-outlined';
export const DefaultSdMaterialIconSet: SdMaterialIconSet = 'material-icons-outlined';
