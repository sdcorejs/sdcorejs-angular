import { DateAdapter } from '@angular/material/core';

export abstract class SdDateAdapter<D> extends DateAdapter<D> {
  public abstract getHour(date: D): number;
  public abstract getMinute(date: D): number;
  public abstract getSecond(date: D): number;

  public abstract setHour(date: D, hour: number): D;
  public abstract setMinute(date: D, minute: number): D;
  public abstract setSecond(date: D, second: number): D;

  public abstract createDatetime(
    year: number, month: number, date: number,
    hour: number, minute: number, second: number,
  ): D;
}
