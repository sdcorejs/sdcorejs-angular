import type {
  SdCreateInputMaskOptions,
  SdDateRangeValue,
  SdEntityPickerDataProvider,
  SdEntityPickerModel,
  SdEntityPickerPage,
  SdEntityPickerRequest,
  SdEntityPickerRowTemplateContext,
  SdEntityPickerSelectedTemplateContext,
  SdInputMask,
  SdInputMaskAdapter,
  SdInputMaskInputMode,
  SdInputMaskPreset,
  SdInputMaskResult,
  SdInputMaskStatus,
  SdInputMaskToken,
  SdTimeConstraints,
  SdTimeModelValue,
  SdTimeParts,
  SdTimePickerAdapter,
  SdTimeRangeConstraints,
  SdTimeRangeModelValue,
  SdTimeRangeValidationError,
  SdTimeRangeValue,
  SdTimeValidationError,
  SdTreeSelectModel,
  SdTreeSelectTemplateContext,
  ɵSdFormControlConnector,
  ɵSdFormControlConnectorOptions,
  ɵSdFormControlConnectorState,
  ɵSdFormControlParent,
} from '../forms';
import type {
  PdfErrorEvent,
  PdfErrorReason,
  PdfLoadEvent,
  PdfMeta,
  PdfOutlineItem,
  PdfScrollMode,
  PdfSearchResult,
  PdfSearchState,
  PdfSidebarMode,
  PdfSource,
  PdfStage,
  PdfZoomMode,
  SdAuditDiffArrayKey,
  SdAuditDiffField,
  SdAuditDiffFormatContext,
  SdAuditDiffKind,
  SdAuditDiffMode,
  SdAuditDiffOptions,
  SdAuditDiffRow,
  SdAuditDiffSide,
  SdAuditDiffValueTemplateContext,
  SdBreadcrumbItem,
  SdBreadcrumbItemTemplateContext,
  SdBreadcrumbLabel,
  SdBreadcrumbResolvedItem,
  SdBreadcrumbRouteConfig,
  SdDataStateKind,
  SdDataStateTemplateContext,
  SdJobProgressMode,
  SdPdfBrowserAdapter,
  SdPdfDestination,
  SdPdfDocumentProxy,
  SdPdfDocumentSpec,
  SdPdfIntersectionEntry,
  SdPdfJsLib,
  SdPdfLoadingTask,
  SdPdfPageProxy,
  SdPdfPrintAdapter,
  SdPdfPrintJob,
  SdPdfRawOutlineItem,
  SdPdfReference,
  SdPdfRenderTask,
  SdPdfTextContent,
  SdPdfTextItem,
  SdPdfViewport,
} from '../components';
import type {
  ISdApiConfiguration,
  ISdCacheConfiguration,
  ISdStorageConfiguration,
  SdApiHandler,
  SdApiHttpOption,
  SdApiOption,
  SdApiRequestUpdate,
  SdApiResponseType,
  SdApiRetryOption,
  SdCache,
  SdCacheGetCallback,
  SdCacheOption,
  SdCacheRemoveCallback,
  SdCacheSetCallback,
  SdCacheSnapshot,
  SdCacheStoredValue,
  SdCacheWithDefault,
  SdDeleteOption,
  SdGetOption,
  SdGraphArrayNode,
  SdGraphDateNode,
  SdGraphEnvelope,
  SdGraphMapNode,
  SdGraphNode,
  SdGraphObjectNode,
  SdGraphSerializerLimits,
  SdGraphSetNode,
  SdGraphSpecialNumber,
  SdGraphValue,
  SdLegacyCacheCallbacks,
  SdLoadingRef,
  SdPatchOption,
  SdPersistenceEnvelope,
  SdPersistenceEnvelopeLimits,
  SdPersistenceErrorCode,
  SdPersistenceIdentityCanonicalizer,
  SdPersistenceKeyField,
  SdPersistenceSerializer,
  SdPersistenceStorageAdapter,
  SdPersistenceStorageArea,
  SdPersistenceStorageRead,
  SdPersistenceTombstoneEnvelope,
  SdPersistenceValueEnvelope,
  SdPostOption,
  SdPutOption,
  SdStorage,
  SdStorageOption,
  SdStorageWithDefault,
  SdTaskActionContext,
  SdTaskCancelHandler,
  SdTaskCancelResult,
  SdTaskConnectionState,
  SdTaskEventSource,
  SdTaskEventSourceFactory,
  SdTaskLoadContext,
  SdTaskManualSource,
  SdTaskMaybeAsync,
  SdTaskPollingSource,
  SdTaskRetryPolicy,
  SdTaskSource,
  SdTaskSseSource,
  SdTaskState,
  SdTaskStatus,
  SdTaskSubscription,
  SdTaskView,
  SdTaskWatchOptions,
  SdUnsavedChangesConfirmationAdapter,
  SdUnsavedChangesConfirmOptions,
  SdUnsavedChangesDecision,
  SdUnsavedChangesDirtySource,
  SdUnsavedChangesFormOptions,
  SdUnsavedChangesMaybeAsync,
  SdUnsavedChangesPromptContext,
  SdUnsavedChangesReason,
  SdUnsavedChangesRegistration,
  SdUnsavedChangesWatcher,
  SdUnsavedChangesWindow,
  SdViewport,
  SdViewportBreakpoint,
  SdViewportBreakpoints,
} from '../services';
import type { SdModalBeforeClose } from '../components/modal';
import type { SdSideDrawerBeforeClose } from '../components/side-drawer';
import type { SdTabBeforeClose } from '../components/tab';

type Release14PublicTypes = readonly [
  ɵSdFormControlParent,
  ɵSdFormControlConnectorOptions<unknown, unknown>,
  ɵSdFormControlConnectorState<unknown>,
  ɵSdFormControlConnector<unknown>,
  SdInputMaskStatus,
  SdInputMaskInputMode,
  SdInputMaskResult,
  SdInputMaskAdapter,
  SdInputMaskToken,
  SdCreateInputMaskOptions,
  SdInputMaskPreset,
  SdInputMask,
  SdTimeParts,
  SdTimeConstraints,
  SdTimeValidationError,
  SdTimePickerAdapter<unknown>,
  SdTimeModelValue,
  SdTimeRangeValue,
  SdTimeRangeConstraints,
  SdTimeRangeValidationError,
  SdTimeRangeModelValue,
  SdEntityPickerModel<string>,
  SdEntityPickerPage<unknown>,
  SdEntityPickerRequest<unknown>,
  SdEntityPickerDataProvider<unknown, string>,
  SdEntityPickerSelectedTemplateContext<unknown, string>,
  SdEntityPickerRowTemplateContext<unknown>,
  SdTreeSelectModel<string>,
  SdTreeSelectTemplateContext<unknown>,
  SdApiResponseType,
  SdApiHttpOption,
  SdApiRetryOption,
  SdApiOption,
  SdGetOption,
  SdPostOption,
  SdPutOption,
  SdPatchOption,
  SdDeleteOption,
  SdApiRequestUpdate,
  SdApiHandler,
  ISdApiConfiguration,
  SdLoadingRef,
  SdPersistenceErrorCode,
  SdGraphSerializerLimits,
  SdPersistenceSerializer,
  SdPersistenceIdentityCanonicalizer,
  SdGraphSpecialNumber,
  SdGraphValue,
  SdGraphArrayNode,
  SdGraphObjectNode,
  SdGraphDateNode,
  SdGraphMapNode,
  SdGraphSetNode,
  SdGraphNode,
  SdGraphEnvelope,
  SdPersistenceStorageArea,
  SdPersistenceStorageRead,
  SdPersistenceStorageAdapter,
  SdPersistenceKeyField,
  SdPersistenceEnvelopeLimits,
  SdPersistenceValueEnvelope,
  SdPersistenceTombstoneEnvelope,
  SdPersistenceEnvelope,
  SdCacheOption,
  SdCache<unknown>,
  SdCacheSnapshot<unknown>,
  SdCacheWithDefault<unknown>,
  SdCacheStoredValue,
  SdCacheSetCallback,
  SdCacheGetCallback,
  SdCacheRemoveCallback,
  ISdCacheConfiguration,
  SdLegacyCacheCallbacks<unknown>,
  SdStorageOption,
  SdStorage<unknown>,
  SdStorageWithDefault<unknown>,
  ISdStorageConfiguration,
  SdViewportBreakpoints,
  SdViewportBreakpoint,
  SdViewport,
  SdUnsavedChangesMaybeAsync<unknown>,
  SdUnsavedChangesDirtySource,
  SdUnsavedChangesDecision,
  SdUnsavedChangesReason,
  SdUnsavedChangesWatcher,
  SdUnsavedChangesPromptContext,
  SdUnsavedChangesConfirmationAdapter,
  SdUnsavedChangesRegistration,
  SdUnsavedChangesConfirmOptions,
  SdUnsavedChangesFormOptions<Record<string, unknown>>,
  SdUnsavedChangesWindow,
  SdTaskMaybeAsync<unknown>,
  SdTaskStatus,
  SdTaskConnectionState,
  SdTaskState,
  SdTaskRetryPolicy,
  SdTaskLoadContext,
  SdTaskActionContext,
  SdTaskCancelResult,
  SdTaskCancelHandler,
  SdTaskManualSource,
  SdTaskPollingSource,
  SdTaskSseSource,
  SdTaskSource,
  SdTaskWatchOptions,
  SdTaskView,
  SdTaskSubscription,
  SdTaskEventSource,
  SdTaskEventSourceFactory,
  PdfSource,
  PdfZoomMode,
  PdfSidebarMode,
  PdfScrollMode,
  PdfOutlineItem,
  PdfMeta,
  PdfStage,
  PdfErrorReason,
  PdfLoadEvent,
  PdfErrorEvent,
  PdfSearchResult,
  PdfSearchState,
  SdPdfPrintJob,
  SdPdfPrintAdapter,
  SdPdfIntersectionEntry,
  SdPdfBrowserAdapter,
  SdPdfRenderTask,
  SdPdfViewport,
  SdPdfTextItem,
  SdPdfTextContent,
  SdPdfPageProxy,
  SdPdfReference,
  SdPdfDestination,
  SdPdfRawOutlineItem,
  SdPdfDocumentProxy,
  SdPdfLoadingTask,
  SdPdfDocumentSpec,
  SdPdfJsLib,
  SdBreadcrumbLabel,
  SdBreadcrumbItem,
  SdBreadcrumbRouteConfig,
  SdBreadcrumbResolvedItem,
  SdBreadcrumbItemTemplateContext,
  SdDataStateKind,
  SdDataStateTemplateContext,
  SdJobProgressMode,
  SdAuditDiffKind,
  SdAuditDiffSide,
  SdAuditDiffArrayKey,
  SdAuditDiffFormatContext,
  SdAuditDiffField,
  SdAuditDiffOptions,
  SdAuditDiffRow,
  SdAuditDiffMode,
  SdAuditDiffValueTemplateContext,
];

describe('sd-angular public API', () => {
  it('loads the library entrypoint', async () => {
    await import('./public-api');

    expect(true).toBeTrue();
  });

  it('keeps every 1.4 public type reachable from its category barrel', () => {
    const compileTimeOnly = null as Release14PublicTypes | null;

    expect(compileTimeOnly).toBeNull();
  });

  it('keeps every 1.4 runtime API, token, helper and guard reachable from category barrels', async () => {
    const forms = await import('../forms');
    const services = await import('../services');
    const components = await import('../components');
    const runtimeExports = [
      forms.ɵsdCoerceFormGroup,
      forms.ɵsdFormControlConnector,
      forms.sdCreateInputMask,
      forms.sdResolveInputMask,
      forms.SD_INPUT_MASKS,
      forms.sdParseTime,
      forms.sdNormalizeTime,
      forms.sdTimeToMinutes,
      forms.sdValidateTime,
      forms.SdDateTimePickerAdapter,
      forms.SdTime,
      forms.sdNormalizeTimeRange,
      forms.sdValidateTimeRange,
      forms.SdTimeRange,
      forms.SdEntityPicker,
      forms.SdEntityPickerSelectedTemplateDirective,
      forms.SdEntityPickerRowTemplateDirective,
      forms.SdEntityPickerDetailTemplateDirective,
      forms.normalizePickerKeys,
      forms.SdTreeSelect,
      forms.SdTreeSelectNodeTemplateDirective,
      forms.normalizeTreeSelectKeys,
      services.SD_API_CONFIG,
      services.SD_API_CONFIGURATION,
      services.SdApiService,
      services.SdLoadingService,
      services.SD_GRAPH_FORMAT,
      services.SD_GRAPH_VERSION,
      services.SD_GRAPH_HARD_LIMITS,
      services.SdPersistenceError,
      services.SdGraphSerializer,
      services.SdGraphIdentityCanonicalizer,
      services.SdBrowserStorageAdapter,
      services.SD_PERSISTENCE_STORAGE_ADAPTER,
      services.buildSdPersistenceKey,
      services.canonicalizeSdPersistenceValue,
      services.digestSdPersistenceKey,
      services.stringifySdPersistenceValueEnvelope,
      services.stringifySdPersistenceTombstoneEnvelope,
      services.parseSdPersistenceEnvelope,
      services.readSdPersistenceStorageItem,
      services.SD_CACHE_CONFIG,
      services.adaptLegacySdCacheCallbacks,
      services.SdCacheService,
      services.SD_STORAGE_CONFIG,
      services.SdStorageService,
      services.SD_VIEWPORT_DEFAULT_BREAKPOINTS,
      services.SD_VIEWPORT,
      services.SD_VIEWPORT_BREAKPOINTS,
      services.sdNormalizeViewportBreakpoints,
      services.SdViewportService,
      services.SD_UNSAVED_CHANGES_WINDOW,
      services.SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER,
      services.SdUnsavedChangesService,
      services.registerSdUnsavedChangesForm,
      services.createSdUnsavedChangesCloseGuard,
      services.sdUnsavedChangesGuard,
      services.SD_TASK_EVENT_SOURCE_FACTORY,
      services.SD_TASK_RANDOM,
      services.SdTaskService,
      services.isSdTaskTerminal,
      components.SdPreviewPdf,
      components.SD_PDF_BROWSER_ADAPTER,
      components.SD_PDF_PRINT_ADAPTER,
      components.SD_PDFJS_LIB,
      components.SdBreadcrumb,
      components.SdDataState,
      components.SdDataStateTemplateDirective,
      components.SdJobProgress,
      components.sdBuildAuditDiff,
      components.SdAuditDiff,
      components.SdAuditDiffValueTemplateDirective,
    ];

    expect(runtimeExports.every(value => value !== undefined)).toBeTrue();
  });

  it('exposes input-color and inline-text from the root forms entrypoint', async () => {
    const forms = await import('../forms');

    expect(forms.SdInputColor).toBeDefined();
    expect(forms.SdInlineText).toBeDefined();
  });

  it('exposes SdDateRangeValue as a consumer type from the root forms entrypoint', () => {
    const value: SdDateRangeValue = { from: '2026/01/01', to: '2026/01/31' };

    expect(value).toEqual({ from: '2026/01/01', to: '2026/01/31' });
  });

  it('exposes time controls and input-mask APIs from the root forms entrypoint', async () => {
    const forms = await import('../forms');
    const range: SdTimeRangeValue = { from: '08:30', to: '17:30' };
    const adapter: SdInputMaskAdapter = forms.sdCreateInputMask('#### ### ###');

    expect(forms.SdTime).toBeDefined();
    expect(forms.SdTimeRange).toBeDefined();
    expect(forms.SD_INPUT_MASKS.VN_PHONE).toBeDefined();
    expect(adapter.format('0901234567').display).toBe('0901 234 567');
    expect(range).toEqual({ from: '08:30', to: '17:30' });
  });

  it('exposes the PDF viewer adapters and recursive outline type', async () => {
    const preview = await import('../components/preview');
    const outline: PdfOutlineItem = {
      id: 'chapter-1',
      title: 'Chapter 1',
      page: 1,
      children: [],
    };

    expect(preview.SdPreviewPdf).toBeDefined();
    expect(preview.SD_PDF_BROWSER_ADAPTER).toBeDefined();
    expect(preview.SD_PDF_PRINT_ADAPTER).toBeDefined();
    expect(preview.SD_PDFJS_LIB).toBeDefined();
    expect(outline.page).toBe(1);
  });

  it('exposes the viewport foundation from the root services entrypoint', async () => {
    const services = await import('../services');
    const breakpoints: SdViewportBreakpoints = { mobile: 0, tablet: 768, desktop: 1024 };

    expect(services.SdViewportService).toBeDefined();
    expect(services.SD_VIEWPORT).toBeDefined();
    expect(services.SD_VIEWPORT_BREAKPOINTS).toBeDefined();
    expect(breakpoints.desktop).toBe(1024);
  });

  it('exposes breadcrumb and UI data-state from separate component entrypoints', async () => {
    const components = await import('../components');
    const breadcrumb: SdBreadcrumbItem = { label: 'Orders', url: '/orders' };
    const state: SdDataStateKind = 'empty';

    expect(components.SdBreadcrumb).toBeDefined();
    expect(components.SdDataState).toBeDefined();
    expect(components.SdDataStateTemplateDirective).toBeDefined();
    expect(breadcrumb.label).toBe('Orders');
    expect(state).toBe('empty');
  });

  it('exposes entity-picker and tree-select form entrypoints with generic key models', async () => {
    const forms = await import('../forms');
    const provider: SdEntityPickerDataProvider<{ id: number }, number> = {
      load: () => ({ items: [{ id: 1 }], total: 1 }),
    };
    const entityValue: SdEntityPickerModel<number> = [1, 2];
    const treeValue: SdTreeSelectModel<string> = 'finance';

    expect(forms.SdEntityPicker).toBeDefined();
    expect(forms.SdTreeSelect).toBeDefined();
    expect(provider.load).toBeDefined();
    expect(entityValue).toEqual([1, 2]);
    expect(treeValue).toBe('finance');
  });

  it('exposes unsaved-changes registry, adapters, tokens, guards and additive close hook types', async () => {
    const services = await import('../services');
    const adapter: SdUnsavedChangesConfirmationAdapter = { confirm: () => 'cancel' };
    const decision: SdUnsavedChangesDecision = 'discard';
    const watcher: SdUnsavedChangesWatcher = { id: 'editor', isDirty: true };
    const formOptions: SdUnsavedChangesFormOptions<{ name: string }> = { id: 'profile' };
    const closeHooks: [SdModalBeforeClose, SdSideDrawerBeforeClose, SdTabBeforeClose] = [
      () => true,
      () => Promise.resolve(true),
      () => false,
    ];
    const registration = null as SdUnsavedChangesRegistration | null;

    expect(services.SdUnsavedChangesService).toBeDefined();
    expect(services.SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER).toBeDefined();
    expect(services.SD_UNSAVED_CHANGES_WINDOW).toBeDefined();
    expect(services.sdUnsavedChangesGuard).toBeDefined();
    expect(services.createSdUnsavedChangesCloseGuard).toBeDefined();
    expect(services.registerSdUnsavedChangesForm).toBeDefined();
    expect(adapter.confirm).toBeDefined();
    expect(decision).toBe('discard');
    expect(watcher.id).toBe('editor');
    expect(formOptions.id).toBe('profile');
    expect(closeHooks).toHaveSize(3);
    expect(registration).toBeNull();
  });

  it('exposes task registry, transport tokens and job-progress APIs', async () => {
    const services = await import('../services');
    const components = await import('../components');
    const state: SdTaskState<{ rows: number }> = {
      id: 'export-1',
      status: 'running',
      progress: 40,
      result: { rows: 12 },
    };
    const retry: SdTaskRetryPolicy = { maxAttempts: 3, initialDelayMs: 250, jitter: 0.1 };
    const options: SdTaskWatchOptions = { id: 'export-1', source: { mode: 'manual' }, initialState: state };
    const mode: SdJobProgressMode = 'details';

    expect(services.SdTaskService).toBeDefined();
    expect(services.SD_TASK_EVENT_SOURCE_FACTORY).toBeDefined();
    expect(services.SD_TASK_RANDOM).toBeDefined();
    expect(services.isSdTaskTerminal('succeeded')).toBeTrue();
    expect(components.SdJobProgress).toBeDefined();
    expect(options.source.mode).toBe('manual');
    expect(retry.maxAttempts).toBe(3);
    expect(mode).toBe('details');
  });

  it('exposes the audit-diff engine, component, template directive and consumer types', async () => {
    const components = await import('../components');
    const options: SdAuditDiffOptions = { fields: [{ path: 'status', label: 'Status' }] };
    const rows: readonly SdAuditDiffRow[] = components.sdBuildAuditDiff({ status: 'draft' }, { status: 'approved' }, options);
    const mode: SdAuditDiffMode = 'detail-list';

    expect(components.SdAuditDiff).toBeDefined();
    expect(components.SdAuditDiffValueTemplateDirective).toBeDefined();
    expect(rows[0]?.kind).toBe('changed');
    expect(mode).toBe('detail-list');
  });
});
