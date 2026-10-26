import { Injectable, signal } from '@angular/core';
import { readSessionValue, writeSessionValue } from '../session-state';
import { PATTERN_ROLES, type PatternRole } from './pattern-permission';

const ROLE_KEY = 'sd-pattern.role';

const readRole = (): PatternRole => {
  const stored = readSessionValue<string>(ROLE_KEY, 'admin');
  return PATTERN_ROLES.some(role => role.value === stored) ? (stored as PatternRole) : 'admin';
};

/**
 * Sample role of the pattern screens, kept for the browser tab. Provided at the `/pattern` route by
 * `provideSdPatterns()`; the permission configuration of that route reads it, so it depends on nothing.
 */
@Injectable()
export class PatternRoleStore {
  readonly #role = signal<PatternRole>(readRole());
  readonly role = this.#role.asReadonly();

  set(role: PatternRole): void {
    this.#role.set(role);
    writeSessionValue(ROLE_KEY, role);
  }
}
