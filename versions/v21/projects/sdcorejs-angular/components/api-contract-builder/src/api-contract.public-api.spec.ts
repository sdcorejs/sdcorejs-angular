import * as entryPoint from '@sdcorejs/angular/components/api-contract-builder';

/**
 * Guards the published surface of `@sdcorejs/angular/components/api-contract-builder`.
 *
 * The import above is the real secondary entry point (resolved through the workspace path mapping),
 * so a missing `index.ts` export or a broken `ng-package.json` fails here rather than in a consumer.
 */
describe('api-contract-builder public API', () => {
  const exported = entryPoint as unknown as Record<string, unknown>;

  it('resolves the secondary entry point', () => {
    expect(entryPoint.SdApiContractBuilder).toBeDefined();
  });

  it('exports the component, the configuration and the diagnostics engine', () => {
    for (const name of [
      'SdApiContractBuilder',
      'SD_API_CONTRACT_CONFIGURATION',
      'SD_API_CONTRACT_EMPTY_CONFIGURATION',
      'provideSdApiContract',
      'resolveSdApiContractConfiguration',
      'validateSdApiContract',
      'serializeSdApiContract',
    ]) {
      expect(exported[name]).withContext(name).toBeDefined();
    }
  });

  it('exports the vocabulary constants and their guards', () => {
    for (const name of [
      'SD_API_CONTRACT_VERSION',
      'SD_API_CONTRACT_DATA_TYPES',
      'SD_API_CONTRACT_SCALAR_DATA_TYPES',
      'SD_API_CONTRACT_HTTP_METHODS',
      'SD_API_CONTRACT_EXPRESSION_ROOTS',
      'SD_API_CONTRACT_ALLOWED_ROOTS',
      'sdIsApiContractDataType',
      'sdIsApiContractScalarDataType',
      'sdIsApiContractTemporalDataType',
      'sdIsApiContractHttpMethod',
    ]) {
      expect(exported[name]).withContext(name).toBeDefined();
    }
  });

  it('exports the pure expression, schema and serialization utilities', () => {
    for (const name of [
      'parseSdApiContractTemplate',
      'extractSdApiContractReferences',
      'listSdApiContractSchemaFields',
      'listSdApiContractResponseFields',
      'resolveSdApiContractSchemaPath',
      'resolveSdApiContractResponsePath',
      'formatSdApiContractExpression',
      'formatSdApiContractPointer',
      'parseSdApiContractUrlPlaceholders',
      'createSdApiContractNode',
      'changeSdApiContractNodeType',
      'cloneSdApiContractNode',
      'cloneSdApiContract',
      'getSdApiContractNodeAt',
      'setSdApiContractNodeAt',
      'addSdApiContractProperty',
      'renameSdApiContractProperty',
      'removeSdApiContractProperty',
      'sdApiContractRecordSet',
      'sdApiContractRecordRemove',
      'sdApiContractRecordRename',
    ]) {
      expect(exported[name]).withContext(name).toBeDefined();
    }
  });

  it('exports the reference samples used by the docs and the showcase', () => {
    for (const name of [
      'SD_API_CONTRACT_SAMPLE_ENVIRONMENT',
      'sdApiContractSearchSample',
      'sdApiContractCreateSample',
      'sdApiContractInvalidSample',
    ]) {
      expect(exported[name]).withContext(name).toBeDefined();
    }
  });

  it('hands out a fresh sample every call, so two consumers cannot share one object', () => {
    expect(entryPoint.sdApiContractSearchSample()).not.toBe(entryPoint.sdApiContractSearchSample());
    expect(entryPoint.sdApiContractSearchSample()).toEqual(entryPoint.sdApiContractSearchSample());
  });

  it('keeps the internal editors out of the public surface', () => {
    for (const name of [
      'SdApiContractNodeEditor',
      'SdApiContractSourceEditor',
      'SdApiContractRecordEditor',
      'SdApiContractDiagnosticList',
      'deepClone',
    ]) {
      expect(exported[name]).withContext(name).toBeUndefined();
    }
  });
});
