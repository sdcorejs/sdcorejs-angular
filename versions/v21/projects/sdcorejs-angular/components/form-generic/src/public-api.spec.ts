import * as api from '../index';

describe('form-generic public API', () => {
  it('exports exactly the runtime surface of the schema v1 contract', () => {
    expect(Object.keys(api).sort()).toEqual(
      ['SD_FORM_GENERIC_BREAKPOINTS', 'SdFormBuilder', 'SdFormRender', 'SdFormRenderService', 'provideSdFormGeneric'].sort()
    );
  });

  it('no longer exports the expression / legacy configuration surface', () => {
    // why: exactly the runtime names of the CHANGELOG entry "Form generic: removed exports"; the docs
    // contract check of plan r3 reads this list and requires CHANGELOG [Unreleased] to name each one.
    const removed = [
      'SdFeelExpression',
      'sdEvaluateExpression',
      'sdExpressionToJavascriptExpression',
      'sdTemplateToCondition',
      'sdGetAttributes',
      'sdGetComponentAttributes',
      'sdGetVariableAttributes',
      'sdGetDatetimeValue',
      'sdGenerateId',
      'sdGenerateKey',
      'sdFormatComponent',
      'SD_FORM_BUILDER_COMPONENTS',
      'SD_COMPONENT_ICONS',
      'SD_TABLE_COLUMN_TYPES',
      'SD_ATTRIBUTE_OPERATORS',
      'SD_DAY_INFO_TYPES',
      'SD_DAY_INFO_PREVIOUSES',
      'SdFormGenericOperators',
      'ValidationAlerts',
      'SD_FORM_GENERIC_CONFIGURATION',
    ];
    expect(Object.keys(api).filter(key => removed.includes(key) || key.startsWith('SD_DAY_INFO_'))).toEqual([]);
  });

  it('keeps the default breakpoints frozen at tablet 600 / desktop 1024', () => {
    expect(api.SD_FORM_GENERIC_BREAKPOINTS).toEqual({ tablet: 600, desktop: 1024 });
    expect(Object.isFrozen(api.SD_FORM_GENERIC_BREAKPOINTS)).toBeTrue();
  });
});
