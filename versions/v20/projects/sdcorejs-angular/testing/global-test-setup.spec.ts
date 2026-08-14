import { I18N_STORAGE_KEY } from '@sdcorejs/angular/i18n';

/**
 * Global test hygiene. Carries no specs of its own — a root-level `beforeEach` belongs to the
 * top-level suite, so Jasmine runs it ahead of every spec in the whole run.
 *
 * why: `I18nService.setLanguage()` persists the choice to `localStorage`, which outlives TestBed —
 * every spec in a karma run shares one browser. Around a dozen specs switch to English to assert a
 * translation and never switch back, so whichever Vietnamese-asserting spec Jasmine happens to
 * schedule after one of them fails. That is the whole story behind CI red on seed 946413:
 *
 *     SdTime shows the required error once the field is blurred
 *     Expected 'Please enter a time' to be 'Vui lòng nhập giờ'.
 *
 * The same suite is green on the next seed, which is what makes this class of bug so expensive to
 * chase. Clearing the key before each spec puts language resolution back to its default (config,
 * else `vi`) no matter what ran before, so no spec has to defend itself against its neighbours.
 * Specs that need another language keep working: they set `localStorage` or provide
 * `SD_CORE_CONFIGURATION` inside their own `beforeEach`/body, both of which run after this hook.
 */
beforeEach(() => localStorage.removeItem(I18N_STORAGE_KEY));
