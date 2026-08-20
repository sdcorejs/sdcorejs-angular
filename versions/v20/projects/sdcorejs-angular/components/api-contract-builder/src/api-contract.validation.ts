import { sdIsTemporalValueTransform } from '@sdcorejs/angular/forms/models';
import {
  resolveSdApiContractConfiguration,
  type SdApiContractConfiguration,
  type SdApiContractEnvironmentVariable,
} from './api-contract.configuration';
import { parseSdApiContractTemplate, type SdApiContractExpressionReference } from './api-contract.expression';
import {
  sdIsApiContractDataType,
  sdIsApiContractHttpMethod,
  sdIsApiContractScalarDataType,
  sdIsApiContractTemporalDataType,
  SD_API_CONTRACT_ALLOWED_ROOTS,
  SD_API_CONTRACT_VERSION,
  type SdApiContractDataType,
  type SdApiContractDiagnostic,
  type SdApiContractDiagnosticSeverity,
  type SdApiContractMappingContext,
} from './api-contract.model';
import {
  parseSdApiContractUrlPlaceholders,
  resolveSdApiContractResponsePath,
  resolveSdApiContractSchemaPath,
  type SdApiContractResolvedReference,
  type SdApiContractStructuralNode,
} from './api-contract.schema';

/**
 * Validates a contract against the grammar, the schema rules, the REST rules and the injected env
 * catalog.
 *
 * Pure and UI-free: it takes `unknown` because an externally supplied contract may be malformed,
 * and it **never repairs anything** — a silent fix would hide the very mistake the author needs to
 * see. Diagnostics come back in a fixed traversal order (metadata → `input` → `req` → `res` →
 * `output`, declaration order within each), so the same contract always yields the same list.
 */
export function validateSdApiContract(contract: unknown, configuration?: SdApiContractConfiguration): SdApiContractDiagnostic[] {
  const diagnostics: SdApiContractDiagnostic[] = [];

  if (!isRecord(contract)) {
    return [{ code: 'contract.invalid', severity: 'error', path: '', message: 'A contract must be an object.' }];
  }

  const env = resolveSdApiContractConfiguration(configuration).env;
  const inputSchema = readSchema(contract['input']);
  const response = isRecord(contract['res']) ? contract['res'] : null;

  const push = (code: string, severity: SdApiContractDiagnosticSeverity, path: string, message: string): void => {
    diagnostics.push({ code, severity, path, message });
  };

  // -------------------------------------------------------------------------
  // Reference resolution
  // -------------------------------------------------------------------------

  const resolveReference = (reference: SdApiContractExpressionReference): SdApiContractResolvedReference | null => {
    if (reference.root === 'env') {
      const key = reference.path[0];
      if (!key || !hasOwn(env, key)) return null;
      const variable: SdApiContractEnvironmentVariable = env[key];
      return { type: variable.type, required: true, label: variable.label, description: variable.description, node: null };
    }
    if (reference.root === 'input') {
      if (!inputSchema) return null;
      const node = resolveSdApiContractSchemaPath(inputSchema, reference.path);
      return node ? { type: node.type, required: node.required, label: node.label, description: node.description, node } : null;
    }
    if (!response) return null;
    return resolveSdApiContractResponsePath(response as never, reference.path);
  };

  /** Checks roots and existence for every reference. Returns `false` when a root was rejected. */
  const checkReferences = (
    references: readonly SdApiContractExpressionReference[],
    path: string,
    context: SdApiContractMappingContext
  ): boolean => {
    const allowed = SD_API_CONTRACT_ALLOWED_ROOTS[context];
    let rootsOk = true;

    for (const reference of references) {
      if (!allowed.includes(reference.root)) {
        rootsOk = false;
        push(
          'mapping.root.forbidden',
          'error',
          path,
          `"${reference.raw}" is not readable here — this position accepts ${allowed.map(root => `\${${root}.…}`).join(', ')}.`
        );
        continue;
      }
      if (resolveReference(reference)) continue;
      if (reference.root === 'env') {
        push(
          'mapping.env.unknown',
          'error',
          path,
          `Environment variable "${reference.path.join('.')}" is not declared in the injected configuration.`
        );
      } else {
        push('mapping.reference.missing', 'error', path, `"${reference.raw}" does not resolve to a declared field.`);
      }
    }

    return rootsOk;
  };

  // -------------------------------------------------------------------------
  // Node structure — shared by every layer
  // -------------------------------------------------------------------------

  const validateStructure = (
    node: Record<string, unknown>,
    path: string,
    allowTransform: boolean,
    requireContainerMembers: boolean
  ): boolean => {
    const type = node['type'];
    if (!sdIsApiContractDataType(type)) {
      push('schema.type.invalid', 'error', path, `"${String(type)}" is not a supported data type.`);
      return false;
    }

    if (type === 'object' && requireContainerMembers && !isRecord(node['properties'])) {
      push('schema.object.properties.missing', 'error', path, 'An object node must declare "properties".');
    }
    if (type === 'array' && !isRecord(node['items'])) {
      push('schema.array.items.missing', 'error', path, 'An array node must declare "items".');
    }
    if (sdIsApiContractScalarDataType(type)) {
      if (node['properties'] !== undefined)
        push('schema.scalar.properties.forbidden', 'error', path, `A "${type}" node cannot declare "properties".`);
      if (node['items'] !== undefined) push('schema.scalar.items.forbidden', 'error', path, `A "${type}" node cannot declare "items".`);
    }

    const required = node['required'];
    if (required !== undefined && typeof required !== 'boolean') {
      push('schema.required.invalid', 'error', path, '"required" must be true, false, or omitted.');
    }

    const transform = node['transform'];
    if (transform !== undefined) {
      if (!allowTransform || !sdIsApiContractTemporalDataType(type)) {
        push(
          'schema.transform.invalid',
          'error',
          path,
          '"transform" is only valid on a date or datetime node in input.schema / output.schema.'
        );
      } else if (!sdIsTemporalValueTransform(transform)) {
        push('schema.transform.unknown', 'error', path, `"${String(transform)}" is not a known temporal transform.`);
      }
    }

    return true;
  };

  const checkDuplicateKeysIgnoringCase = (record: Record<string, unknown>, basePath: string): void => {
    const seen = new Map<string, string>();
    for (const key of Object.keys(record)) {
      const normalized = key.trim().toLowerCase();
      if (!normalized) continue;
      const previous = seen.get(normalized);
      if (previous !== undefined) {
        push(
          'schema.property.key.duplicate',
          'error',
          `${basePath}.${key}`,
          `"${key}" collides with "${previous}" — header names are case-insensitive.`
        );
      } else {
        seen.set(normalized, key);
      }
    }
  };

  // -------------------------------------------------------------------------
  // Declaration layers — `input.schema`, `res.headers`, `res.body`
  // -------------------------------------------------------------------------

  const validateDeclaration = (node: unknown, path: string, allowTransform: boolean): void => {
    if (!isRecord(node)) return;
    if (!validateStructure(node, path, allowTransform, true)) return;

    if (node['source'] !== undefined || node['value'] !== undefined) {
      push('schema.mapping.forbidden', 'error', path, 'A declaration cannot carry "source" or "value" — nothing maps into it.');
    }

    const type = node['type'];
    const properties = node['properties'];
    if (type === 'object' && isRecord(properties)) {
      for (const key of Object.keys(properties)) {
        const childPath = `${path}.properties.${key}`;
        if (!key.trim()) push('schema.property.key.empty', 'error', childPath, 'A property name cannot be empty.');
        validateDeclaration(properties[key], childPath, allowTransform);
      }
    }
    if (type === 'array' && isRecord(node['items'])) {
      validateDeclaration(node['items'], `${path}.items`, allowTransform);
    }
  };

  // -------------------------------------------------------------------------
  // Mapped layers — `req.*`, `output.schema`
  // -------------------------------------------------------------------------

  const validateStaticValue = (value: unknown, type: SdApiContractDataType, path: string): void => {
    if (value === null) return;
    const ok =
      type === 'string' || type === 'date' || type === 'datetime'
        ? typeof value === 'string'
        : type === 'number'
          ? typeof value === 'number' && Number.isFinite(value)
          : type === 'boolean'
            ? typeof value === 'boolean'
            : type === 'object'
              ? isRecord(value)
              : Array.isArray(value);
    if (!ok) push('mapping.value.type-mismatch', 'error', path, `The static value does not fit the declared type "${type}".`);
  };

  const validateSource = (
    node: Record<string, unknown>,
    type: SdApiContractDataType,
    path: string,
    context: SdApiContractMappingContext
  ): void => {
    const source = node['source'];
    if (typeof source !== 'string') {
      push('mapping.template.invalid', 'error', path, '"source" must be a string template.');
      return;
    }

    const template = parseSdApiContractTemplate(source);
    if (!template.valid) {
      push('mapping.template.invalid', 'error', path, template.errors[0].message);
      return;
    }

    if (!checkReferences(template.references, path, context)) return;

    if (template.kind === 'exact') {
      const resolved = resolveReference(template.references[0]);
      if (!resolved) return;
      if (!isTypeCompatible(resolved.type, type)) {
        push('mapping.type.mismatch', 'error', path, `"${source}" resolves to "${resolved.type}", which cannot fill a "${type}" node.`);
      }
      if (context === 'output' && node['required'] === true && resolved.required !== true) {
        push(
          'mapping.required.optional-source',
          'warning',
          path,
          `A required output field is fed by "${source}", which is not declared required.`
        );
      }
      return;
    }

    // why: literal + interpolated đều cho ra string. `req.url` không đi qua đây nên vẫn nội suy tự do.
    if (type !== 'string') {
      push('mapping.interpolation.forbidden', 'error', path, `String interpolation can only fill a "string" node, not "${type}".`);
    }
  };

  const validateMapped = (
    node: unknown,
    path: string,
    context: SdApiContractMappingContext,
    covered: boolean,
    allowTransform: boolean
  ): void => {
    if (!isRecord(node)) return;

    const hasSource = node['source'] !== undefined;
    const hasValue = node['value'] !== undefined;
    const wholeNodeMapped = hasSource || hasValue;

    if (!validateStructure(node, path, allowTransform, !wholeNodeMapped)) return;
    const type = node['type'] as SdApiContractDataType;

    if (hasSource && hasValue) {
      push('mapping.source-and-value', 'error', path, '"source" and "value" are mutually exclusive.');
    }

    const properties = node['properties'];
    const childCount = type === 'object' && isRecord(properties) ? Object.keys(properties).length : 0;
    if (wholeNodeMapped && childCount > 0) {
      push('mapping.object.conflict', 'error', path, 'An object mapped as a whole cannot also map its properties.');
    }

    if (hasSource) validateSource(node, type, path, context);
    else if (hasValue) validateStaticValue(node['value'], type, path);
    else if (!covered && (type !== 'object' || childCount === 0)) {
      push('mapping.node.unmapped', 'warning', path, 'This node receives no value — declare a "source" or a static "value".');
    }

    const childCovered = covered || wholeNodeMapped;
    if (type === 'object' && isRecord(properties)) {
      for (const key of Object.keys(properties)) {
        const childPath = `${path}.properties.${key}`;
        if (!key.trim()) push('schema.property.key.empty', 'error', childPath, 'A property name cannot be empty.');
        validateMapped(properties[key], childPath, context, childCovered, allowTransform);
      }
    }
    if (type === 'array' && isRecord(node['items'])) {
      validateMapped(node['items'], `${path}.items`, context, childCovered, allowTransform);
    }
  };

  // -------------------------------------------------------------------------
  // 1. Contract metadata
  // -------------------------------------------------------------------------

  if (contract['contractVersion'] !== SD_API_CONTRACT_VERSION) {
    push('contract.version.invalid', 'error', 'contractVersion', `"contractVersion" must be ${SD_API_CONTRACT_VERSION}.`);
  }
  if (!isFilledString(contract['code'])) push('contract.code.empty', 'error', 'code', 'A contract needs a non-empty "code".');
  if (!isFilledString(contract['name'])) push('contract.name.empty', 'error', 'name', 'A contract needs a non-empty "name".');

  // -------------------------------------------------------------------------
  // 2. input.schema
  // -------------------------------------------------------------------------

  if (!inputSchema) push('schema.missing', 'error', 'input.schema', '"input.schema" is missing.');
  else validateDeclaration(inputSchema, 'input.schema', true);

  // -------------------------------------------------------------------------
  // 3. req
  // -------------------------------------------------------------------------

  const request = isRecord(contract['req']) ? contract['req'] : null;
  if (!request) {
    push('req.method.invalid', 'error', 'req.method', 'The request is missing.');
    push('req.url.empty', 'error', 'req.url', 'The request is missing.');
  } else {
    const method = request['method'];
    if (!sdIsApiContractHttpMethod(method)) {
      push('req.method.invalid', 'error', 'req.method', `"${String(method)}" is not a supported HTTP method.`);
    }

    const url = request['url'];
    const placeholders = isFilledString(url) ? parseSdApiContractUrlPlaceholders(url) : { names: [], duplicates: [], malformed: [] };
    if (!isFilledString(url)) {
      push('req.url.empty', 'error', 'req.url', 'A request needs a non-empty "url".');
    } else {
      const template = parseSdApiContractTemplate(url);
      if (!template.valid) push('req.url.template.invalid', 'error', 'req.url', template.errors[0].message);
      else checkReferences(template.references, 'req.url', 'request');

      for (const fragment of placeholders.malformed) {
        push('req.url.placeholder.malformed', 'error', 'req.url', `"${fragment}" is not a valid path placeholder.`);
      }
      for (const name of placeholders.duplicates) {
        push('req.url.placeholder.duplicate', 'error', 'req.url', `Path placeholder "{${name}}" appears more than once.`);
      }
    }

    const pathRecord = isRecord(request['path']) ? request['path'] : null;
    const declaredPathKeys = pathRecord ? Object.keys(pathRecord) : [];
    for (const name of placeholders.names) {
      if (!declaredPathKeys.includes(name)) {
        push('req.path.missing', 'error', `req.path.${name}`, `The url declares "{${name}}" but "req.path" has no entry for it.`);
      }
    }
    for (const key of declaredPathKeys) {
      if (!placeholders.names.includes(key)) {
        push('req.path.unused', 'error', `req.path.${key}`, `"req.path.${key}" has no matching "{${key}}" in the url.`);
      }
    }

    if (pathRecord) {
      for (const key of declaredPathKeys) {
        const entryPath = `req.path.${key}`;
        const entry = pathRecord[key];
        if (!key.trim()) push('schema.property.key.empty', 'error', entryPath, 'A path parameter name cannot be empty.');
        if (isRecord(entry)) {
          if (entry['required'] !== true) {
            push('req.path.required', 'error', entryPath, 'A path parameter is part of the url and must be declared "required": true.');
          }
          if (entry['type'] !== undefined && !sdIsApiContractScalarDataType(entry['type'])) {
            push('req.path.type.invalid', 'error', entryPath, 'A path parameter must be a scalar.');
          }
        }
        validateMapped(entry, entryPath, 'request', false, false);
      }
    }

    const queryRecord = isRecord(request['query']) ? request['query'] : null;
    if (queryRecord) {
      for (const key of Object.keys(queryRecord)) {
        const entryPath = `req.query.${key}`;
        const entry = queryRecord[key];
        if (!key.trim()) push('schema.property.key.empty', 'error', entryPath, 'A query parameter name cannot be empty.');
        if (isRecord(entry) && entry['type'] !== undefined && !sdIsApiContractScalarDataType(entry['type']) && entry['type'] !== 'array') {
          push('req.query.type.invalid', 'error', entryPath, 'A query parameter must be a scalar or an array of scalars.');
        }
        validateMapped(entry, entryPath, 'request', false, false);
      }
    }

    const headerRecord = isRecord(request['headers']) ? request['headers'] : null;
    if (headerRecord) {
      checkDuplicateKeysIgnoringCase(headerRecord, 'req.headers');
      for (const key of Object.keys(headerRecord)) {
        const entryPath = `req.headers.${key}`;
        const entry = headerRecord[key];
        if (!key.trim()) push('req.header.name.empty', 'error', entryPath, 'A header name cannot be empty.');
        if (isRecord(entry) && entry['type'] !== undefined && !sdIsApiContractScalarDataType(entry['type'])) {
          push('req.header.type.invalid', 'error', entryPath, 'A header must be a scalar.');
        }
        validateMapped(entry, entryPath, 'request', false, false);
      }
    }

    if (request['body'] !== undefined) {
      if (method === 'GET' || method === 'HEAD') {
        push('req.body.unexpected', 'warning', 'req.body', `A ${method} request with a body is ignored by many clients and proxies.`);
      }
      validateMapped(request['body'], 'req.body', 'request', false, false);
    }
  }

  // -------------------------------------------------------------------------
  // 4. res
  // -------------------------------------------------------------------------

  if (!response) {
    push('res.status.invalid', 'error', 'res.status', 'The response declaration is missing.');
  } else {
    const rawStatus = response['status'];
    const statuses = Array.isArray(rawStatus) ? (rawStatus as unknown[]) : [rawStatus];
    if (Array.isArray(rawStatus) && rawStatus.length === 0) {
      push('res.status.empty', 'error', 'res.status', 'Declare at least one success status.');
    }
    const seenStatus = new Set<number>();
    for (const status of statuses) {
      if (typeof status !== 'number' || !Number.isInteger(status) || status < 100 || status > 599) {
        push('res.status.invalid', 'error', 'res.status', `"${String(status)}" is not an HTTP status code between 100 and 599.`);
      } else if (seenStatus.has(status)) {
        push('res.status.duplicate', 'error', 'res.status', `Status ${status} is declared more than once.`);
      } else {
        seenStatus.add(status);
      }
    }

    const responseHeaders = isRecord(response['headers']) ? response['headers'] : null;
    if (responseHeaders) {
      checkDuplicateKeysIgnoringCase(responseHeaders, 'res.headers');
      for (const key of Object.keys(responseHeaders)) {
        const entryPath = `res.headers.${key}`;
        if (!key.trim()) push('req.header.name.empty', 'error', entryPath, 'A header name cannot be empty.');
        validateDeclaration(responseHeaders[key], entryPath, false);
      }
    }

    if (response['body'] !== undefined) {
      if (seenStatus.has(204)) {
        push('res.body.unexpected', 'warning', 'res.body', 'HTTP 204 means "no content" — a declared body will never arrive.');
      }
      validateDeclaration(response['body'], 'res.body', false);
    }
  }

  // -------------------------------------------------------------------------
  // 5. output.schema
  // -------------------------------------------------------------------------

  const outputSchema = readSchema(contract['output']);
  if (!outputSchema) push('schema.missing', 'error', 'output.schema', '"output.schema" is missing.');
  else validateMapped(outputSchema, 'output.schema', 'output', false, true);

  return diagnostics;
}

/** `true` when a source of `sourceType` may fill a target of `targetType`. */
function isTypeCompatible(sourceType: SdApiContractDataType, targetType: SdApiContractDataType): boolean {
  if (sourceType === targetType) return true;
  // why: date/datetime là kiểu LOGIC, trên dây luôn là string — nên string ↔ temporal đi được cả hai
  // chiều. Mọi cặp khác phải khớp chính xác, vì exact expression giữ nguyên type của nguồn.
  const sourceTemporalish = sdIsApiContractTemporalDataType(sourceType) || sourceType === 'string';
  const targetTemporalish = sdIsApiContractTemporalDataType(targetType) || targetType === 'string';
  return sourceTemporalish && targetTemporalish;
}

function readSchema(holder: unknown): SdApiContractStructuralNode | null {
  if (!isRecord(holder) || !isRecord(holder['schema'])) return null;
  return holder['schema'] as unknown as SdApiContractStructuralNode;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFilledString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasOwn(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}
