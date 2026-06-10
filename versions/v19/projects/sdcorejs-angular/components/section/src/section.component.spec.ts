import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { SdSection } from './section.component';
import { SdSectionItem } from './section-item/section-item.component';

// ---------------------------------------------------------------------------
// Host helpers — SdSection
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdSection, SdSectionItem],
  template: `
    <sd-section
      [title]="title"
      [subTitle]="subTitle"
      [icon]="icon"
      [collapsible]="collapsible"
      [(collapsed)]="collapsed"
      [hideHeader]="hideHeader"
      [noPaddingBody]="noPaddingBody">
      <sd-section-item label="Name">John Doe</sd-section-item>
      <span class="extra-content">extra</span>
    </sd-section>
  `,
})
class HostComponent {
  title: string | null | undefined = 'Section Title';
  subTitle: string | null | undefined = undefined;
  icon: string | null | undefined = undefined;
  collapsible = false;
  collapsed = false;
  hideHeader = false;
  noPaddingBody = false;
}

@Component({
  standalone: true,
  imports: [SdSection],
  template: `
    <sd-section [collapsible]="true" [(collapsed)]="collapsed">
      <button sdHeaderRight>Action</button>
      <p class="body-content">Body text</p>
    </sd-section>
  `,
})
class HostWithSlotsComponent {
  collapsed = false;
}

@Component({
  standalone: true,
  imports: [SdSection],
  template: `
    <sd-section [collapsable]="true" [(collapsed)]="collapsed">
      <p class="body-content">Body text</p>
    </sd-section>
  `,
})
class HostWithDeprecatedCollapsableComponent {
  collapsed = false;
}

// ---------------------------------------------------------------------------
// Host helper — SdSectionItem
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdSectionItem],
  template: `
    <sd-section-item [label]="label" [labelWidth]="labelWidth">
      <span class="value-content">{{ value }}</span>
    </sd-section-item>
  `,
})
class ItemHostComponent {
  label = 'Email';
  labelWidth: string | null | undefined = '150px';
  value = 'user@example.com';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSdSection(fixture: ComponentFixture<any>): SdSection {
  const de: DebugElement = fixture.debugElement.query(By.directive(SdSection));
  if (!de) throw new Error('SdSection not found in fixture');
  return de.componentInstance as SdSection;
}

function getSectionEl(fixture: ComponentFixture<any>): HTMLElement {
  return fixture.debugElement.query(By.directive(SdSection)).nativeElement as HTMLElement;
}

function getSdSectionItem(fixture: ComponentFixture<any>): SdSectionItem {
  const de: DebugElement = fixture.debugElement.query(By.directive(SdSectionItem));
  if (!de) throw new Error('SdSectionItem not found in fixture');
  return de.componentInstance as SdSectionItem;
}

// ---------------------------------------------------------------------------
// Suite: SdSection
// ---------------------------------------------------------------------------

describe('SdSection', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: SdSection;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = getSdSection(fixture);
  });

  // -------------------------------------------------------------------------
  // Creation & rendering
  // -------------------------------------------------------------------------

  describe('creation & rendering', () => {
    it('creates the SdSection component', () => {
      expect(component).toBeTruthy();
    });

    it('renders the host element sd-section in the DOM', () => {
      const el = fixture.nativeElement.querySelector('sd-section');
      expect(el).not.toBeNull();
    });

    it('renders a child SdSectionItem inside the body', () => {
      const itemEl = getSectionEl(fixture).querySelector('sd-section-item');
      expect(itemEl).not.toBeNull();
    });

    it('projects default slot content into the body', () => {
      const el = getSectionEl(fixture);
      expect(el.textContent).toContain('extra');
    });
  });

  // -------------------------------------------------------------------------
  // Input: title
  // -------------------------------------------------------------------------

  describe('input: title', () => {
    it('renders title text in T16M div when title is set', () => {
      const el = getSectionEl(fixture);
      const titleDiv = el.querySelector('div.T16M') as HTMLElement;
      expect(titleDiv).not.toBeNull();
      expect(titleDiv.textContent?.trim()).toBe('Section Title');
    });

    it('does NOT render T16M div when title is null', () => {
      host.title = null;
      fixture.detectChanges();
      const el = getSectionEl(fixture);
      expect(el.querySelector('div.T16M')).toBeNull();
    });

    it('does NOT render T16M div when title is undefined', () => {
      host.title = undefined;
      fixture.detectChanges();
      const el = getSectionEl(fixture);
      expect(el.querySelector('div.T16M')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Input: subTitle
  // -------------------------------------------------------------------------

  describe('input: subTitle', () => {
    it('renders subTitle in T12R div when set', () => {
      host.subTitle = 'Some subtitle';
      fixture.detectChanges();
      const el = getSectionEl(fixture);
      const subDiv = el.querySelector('div.T12R') as HTMLElement;
      expect(subDiv).not.toBeNull();
      expect(subDiv.textContent?.trim()).toBe('Some subtitle');
    });

    it('does NOT render T12R div when subTitle is not set', () => {
      host.subTitle = undefined;
      fixture.detectChanges();
      const el = getSectionEl(fixture);
      expect(el.querySelector('div.T12R')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Input: collapsible + collapse behavior
  // -------------------------------------------------------------------------

  describe('input: collapsible + collapse behavior', () => {
    it('defaults collapsed to false', () => {
      expect(component.collapsed()).toBeFalse();
    });

    it('does NOT show chevron icon when collapsible is false', () => {
      const el = getSectionEl(fixture);
      const chevron = el.querySelector('mat-icon');
      expect(chevron).toBeNull();
    });

    it('shows chevron mat-icon when collapsible is true', () => {
      host.collapsible = true;
      fixture.detectChanges();
      const el = getSectionEl(fixture);
      const chevron = el.querySelector('mat-icon');
      expect(chevron).not.toBeNull();
    });

    it('toggleCollapse() sets collapsed to true when collapsible is true', () => {
      host.collapsible = true;
      fixture.detectChanges();
      component.toggleCollapse();
      fixture.detectChanges();
      expect(component.collapsed()).toBeTrue();
    });

    it('toggleCollapse() sets collapsed back to false on second call', () => {
      host.collapsible = true;
      fixture.detectChanges();
      component.toggleCollapse();
      fixture.detectChanges();
      component.toggleCollapse();
      fixture.detectChanges();
      expect(component.collapsed()).toBeFalse();
    });

    it('hides body content when collapsed is true', () => {
      host.collapsible = true;
      host.collapsed = true;
      fixture.detectChanges();
      const el = getSectionEl(fixture);
      // Body div is conditionally rendered — it should not contain projected content
      expect(el.querySelector('.extra-content')).toBeNull();
    });

    it('toggleCollapse() forces collapsed to false when collapsible is false but collapsed is true', () => {
      host.collapsed = true;
      fixture.detectChanges();
      component.toggleCollapse();
      fixture.detectChanges();
      expect(component.collapsed()).toBeFalse();
    });

    it('still accepts deprecated collapsable input', async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HostWithDeprecatedCollapsableComponent, NoopAnimationsModule],
      }).compileComponents();

      const deprecatedFixture = TestBed.createComponent(HostWithDeprecatedCollapsableComponent);
      deprecatedFixture.detectChanges();
      const deprecatedComponent = getSdSection(deprecatedFixture);

      expect(deprecatedComponent.collapsable()).toBeTrue();
      expect(deprecatedComponent.isCollapsible()).toBeTrue();
      expect(getSectionEl(deprecatedFixture).querySelector('mat-icon')).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Input: hideHeader
  // -------------------------------------------------------------------------

  describe('input: hideHeader', () => {
    it('renders header by default (hideHeader=false)', () => {
      const el = getSectionEl(fixture);
      // header div has cursor-pointer class
      const header = el.querySelector('.cursor-pointer') as HTMLElement;
      expect(header).not.toBeNull();
    });

    it('hides the header row when hideHeader is true', () => {
      host.hideHeader = true;
      fixture.detectChanges();
      const el = getSectionEl(fixture);
      const header = el.querySelector('.cursor-pointer') as HTMLElement;
      expect(header).toBeNull();
    });

    it('still renders body when hideHeader is true (regardless of collapsed)', () => {
      host.hideHeader = true;
      host.collapsed = true;
      fixture.detectChanges();
      const el = getSectionEl(fixture);
      expect(el.textContent).toContain('extra');
    });
  });

  // -------------------------------------------------------------------------
  // Input: noPaddingBody
  // -------------------------------------------------------------------------

  describe('input: noPaddingBody', () => {
    it('applies p-16 class to body by default', () => {
      const el = getSectionEl(fixture);
      const body = el.querySelector('.p-16') as HTMLElement;
      expect(body).not.toBeNull();
    });

    it('applies c-no-padding-body class when noPaddingBody is true', () => {
      host.noPaddingBody = true;
      fixture.detectChanges();
      const el = getSectionEl(fixture);
      expect(el.querySelector('.c-no-padding-body')).not.toBeNull();
    });

    it('removes p-16 class when noPaddingBody is true', () => {
      host.noPaddingBody = true;
      fixture.detectChanges();
      const el = getSectionEl(fixture);
      expect(el.querySelector('.p-16')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Content projection: sdHeaderRight slot
  // -------------------------------------------------------------------------

  describe('content projection: [sdHeaderRight]', () => {
    let slotsFixture: ComponentFixture<HostWithSlotsComponent>;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HostWithSlotsComponent, NoopAnimationsModule],
      }).compileComponents();

      slotsFixture = TestBed.createComponent(HostWithSlotsComponent);
      slotsFixture.detectChanges();
    });

    it('projects [sdHeaderRight] slot content into the header right area', () => {
      const el = slotsFixture.debugElement.query(By.directive(SdSection)).nativeElement as HTMLElement;
      expect(el.textContent).toContain('Action');
    });

    it('projects default slot (body) content', () => {
      const el = slotsFixture.debugElement.query(By.directive(SdSection)).nativeElement as HTMLElement;
      expect(el.querySelector('p.body-content')).not.toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Suite: SdSectionItem
// ---------------------------------------------------------------------------

describe('SdSectionItem', () => {
  let fixture: ComponentFixture<ItemHostComponent>;
  let host: ItemHostComponent;
  let component: SdSectionItem;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemHostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = getSdSectionItem(fixture);
  });

  // -------------------------------------------------------------------------
  // Creation & rendering
  // -------------------------------------------------------------------------

  describe('creation & rendering', () => {
    it('creates the SdSectionItem component', () => {
      expect(component).toBeTruthy();
    });

    it('renders the c-item wrapper div', () => {
      const el = fixture.debugElement.query(By.directive(SdSectionItem)).nativeElement as HTMLElement;
      expect(el.querySelector('div.c-item')).not.toBeNull();
    });

    it('projects default slot content (value) into the right column', () => {
      const el = fixture.debugElement.query(By.directive(SdSectionItem)).nativeElement as HTMLElement;
      expect(el.querySelector('span.value-content')).not.toBeNull();
      expect(el.textContent).toContain('user@example.com');
    });
  });

  // -------------------------------------------------------------------------
  // Input: label
  // -------------------------------------------------------------------------

  describe('input: label', () => {
    it('renders the label text in T14R div', () => {
      const el = fixture.debugElement.query(By.directive(SdSectionItem)).nativeElement as HTMLElement;
      const labelDiv = el.querySelector('div.T14R') as HTMLElement;
      expect(labelDiv).not.toBeNull();
      expect(labelDiv.textContent?.trim()).toBe('Email');
    });

    it('updates label text when input changes', () => {
      host.label = 'Phone';
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.directive(SdSectionItem)).nativeElement as HTMLElement;
      expect(el.querySelector('div.T14R')!.textContent?.trim()).toBe('Phone');
    });
  });

  // -------------------------------------------------------------------------
  // Input: labelWidth
  // -------------------------------------------------------------------------

  describe('input: labelWidth', () => {
    it('defaults labelWidth to 150px', () => {
      expect(component.labelWidth()).toBe('150px');
    });

    it('applies labelWidth as inline style on the label div', () => {
      host.labelWidth = '200px';
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.directive(SdSectionItem)).nativeElement as HTMLElement;
      const labelDiv = el.querySelector('div.T14R') as HTMLElement;
      expect(labelDiv.style.width).toBe('200px');
    });

    it('coerces null labelWidth back to 150px', () => {
      host.labelWidth = null;
      fixture.detectChanges();
      expect(component.labelWidth()).toBe('150px');
    });

    it('coerces undefined labelWidth back to 150px', () => {
      host.labelWidth = undefined;
      fixture.detectChanges();
      expect(component.labelWidth()).toBe('150px');
    });
  });
});
