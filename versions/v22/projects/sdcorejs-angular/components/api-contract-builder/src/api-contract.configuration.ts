import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { SdApiContractScalarDataType } from './api-contract.model';

/**
 * Declaration of one global variable a contract may reference as `${env.<key>}`.
 *
 * Definition only — **never a value**. The builder is a design-time tool: it must be able to
 * autocomplete and validate `${env.token}` without the token itself ever entering the app, the
 * component, or the persisted JSON.
 */
export interface SdApiContractEnvironmentVariable {
  /** Composite env variables are not supported — a global is always a single scalar. */
  type: SdApiContractScalarDataType;
  label?: string;
  description?: string;
  /**
   * Marks a secret (token, api key). The UI badges it and never previews a value — there is no
   * value to preview, so this is purely an authoring signal.
   */
  sensitive?: boolean;
}

export interface SdApiContractConfiguration {
  env: Record<string, SdApiContractEnvironmentVariable>;
}

/** What the builder falls back to when the host application provides no configuration. */
export const SD_API_CONTRACT_EMPTY_CONFIGURATION: SdApiContractConfiguration = Object.freeze({ env: Object.freeze({}) });

export const SD_API_CONTRACT_CONFIGURATION = new InjectionToken<SdApiContractConfiguration>('sd-api-contract.configuration');

/**
 * Registers the env catalog available to every `<sd-api-contract-builder>` in the injector.
 *
 * ```ts
 * provideSdApiContract({
 *   env: {
 *     baseUrl: { type: 'string', label: 'Backend base URL' },
 *     token: { type: 'string', label: 'Access token', sensitive: true },
 *   },
 * });
 * ```
 */
export function provideSdApiContract(configuration: SdApiContractConfiguration): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SD_API_CONTRACT_CONFIGURATION, useValue: configuration }]);
}

/** Normalizes an optionally-injected configuration into one that is always safe to read. */
export function resolveSdApiContractConfiguration(
  configuration: SdApiContractConfiguration | null | undefined
): SdApiContractConfiguration {
  if (!configuration || typeof configuration !== 'object' || !configuration.env || typeof configuration.env !== 'object') {
    return SD_API_CONTRACT_EMPTY_CONFIGURATION;
  }
  return configuration;
}
