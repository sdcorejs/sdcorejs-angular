import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdFormGenericGroup } from '../../../../../models';
import { AttributeExpression } from '../../attribute-expression/attribute-expression.component';
import { AttributeSwitch } from '../../attribute-switch/attribute-switch.component';
import { GroupAttribute } from './group-attribute.component';

describe('GroupAttribute', () => {
  let fixture: ComponentFixture<GroupAttribute>;
  let group: SdFormGenericGroup;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [GroupAttribute, NoopAnimationsModule] });
    group = {
      id: 'group',
      type: 'group',
      label: 'Details',
      layout: { columns: '12' },
      components: [],
      properties: { icon: 'category', color: 'primary' },
    };
    fixture = TestBed.createComponent(GroupAttribute);
    fixture.componentRef.setInput('group', group);
    fixture.detectChanges();
  });

  it('offers visibility expressions without a disabled-when option', () => {
    const i18n = TestBed.inject(I18nService);
    const labels = fixture.debugElement
      .queryAll(By.directive(AttributeExpression))
      .map(element => (element.componentInstance as AttributeExpression).label);
    expect(labels).toEqual([i18n.t('core.component.form-builder.visible-when'), i18n.t('core.component.form-builder.hidden-when')]);
    expect('disabledWhenExpression' in group.properties).toBeFalse();
  });

  it('defaults collapsible to false and saves both choices in group properties', () => {
    const optionElement = fixture.debugElement.query(By.directive(AttributeSwitch));
    expect(optionElement).not.toBeNull();
    if (!optionElement) return;
    const option = optionElement.componentInstance as AttributeSwitch;
    expect(option.model).toBeFalse();

    option.modelChange.emit(true);
    fixture.detectChanges();
    expect((JSON.parse(JSON.stringify(group)) as SdFormGenericGroup).properties.collapsible).toBeTrue();

    option.modelChange.emit(false);
    fixture.detectChanges();
    expect(group.properties.collapsible).toBeFalse();
  });

  it('restores the collapsible choice from a loaded schema', () => {
    fixture.componentRef.setInput('group', { ...group, properties: { ...group.properties, collapsible: true } });
    fixture.detectChanges();
    const optionElement = fixture.debugElement.query(By.directive(AttributeSwitch));
    expect(optionElement).not.toBeNull();
    if (optionElement) expect((optionElement.componentInstance as AttributeSwitch).model).toBeTrue();
  });
});
