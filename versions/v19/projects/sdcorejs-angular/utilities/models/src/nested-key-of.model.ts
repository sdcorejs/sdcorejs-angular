type Primitive = string | number | boolean | null | undefined | Date | Function;

export type SdNestedKeyOf<ObjectType, Depth extends number[] = []> = Depth['length'] extends 4
  ? never
  : ObjectType extends object // 👈 Guard ở đây: chỉ process khi là object, fallback string nếu không phải
    ? {
        [Key in keyof ObjectType & string]: ObjectType[Key] extends Primitive
          ? Key
          : ObjectType[Key] extends Array<any>
            ? Key
            : ObjectType[Key] extends object
              ? Key | `${Key}.${SdNestedKeyOf<ObjectType[Key], [...Depth, 1]>}`
              : Key;
      }[keyof ObjectType & string]
    : string;
