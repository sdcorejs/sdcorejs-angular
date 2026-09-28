import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { SdBodyScrollLockService } from './body-scroll-lock.service';

/**
 * Document giả: độ rộng scrollbar = `innerWidth - clientWidth`, và padding tính toán của body lấy từ
 * `computedPaddingRight`. Trình duyệt headless có thể dùng overlay scrollbar (rộng 0), nên không dựa vào
 * document thật để đo.
 */
function makeDocument(options: { innerWidth: number; clientWidth: number; computedPaddingRight?: string }) {
  const body = document.createElement('div');
  const fakeDocument = {
    body,
    documentElement: { clientWidth: options.clientWidth },
    defaultView: {
      innerWidth: options.innerWidth,
      getComputedStyle: () => ({ paddingRight: options.computedPaddingRight ?? '0px' }),
    },
  };
  return { fakeDocument, body };
}

function serviceFor(fakeDocument: unknown): SdBodyScrollLockService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: fakeDocument }] });
  return TestBed.inject(SdBodyScrollLockService);
}

describe('SdBodyScrollLockService', () => {
  it('adds the scrollbar width to padding-right once and restores it on the last release', () => {
    const { fakeDocument, body } = makeDocument({ innerWidth: 1000, clientWidth: 985, computedPaddingRight: '10px' });
    const service = serviceFor(fakeDocument);

    service.lock();
    expect(body.style.overflow).toBe('hidden');
    expect(body.style.paddingRight).toBe('25px');

    // Khoá chồng: không cộng thêm lần nữa.
    service.lock();
    expect(body.style.paddingRight).toBe('25px');

    service.release();
    expect(body.style.paddingRight).toBe('25px');
    expect(body.style.overflow).toBe('hidden');

    service.release();
    expect(body.style.paddingRight).toBe('');
    expect(body.style.overflow).toBe('');
  });

  it('restores an inline padding-right the app had set before the lock', () => {
    const { fakeDocument, body } = makeDocument({ innerWidth: 1200, clientWidth: 1183, computedPaddingRight: '4px' });
    body.style.paddingRight = '4px';
    const service = serviceFor(fakeDocument);

    service.lock();
    expect(body.style.paddingRight).toBe('21px');

    service.release();
    expect(body.style.paddingRight).toBe('4px');
  });

  it('leaves padding-right alone when there is no scrollbar', () => {
    const { fakeDocument, body } = makeDocument({ innerWidth: 1000, clientWidth: 1000, computedPaddingRight: '8px' });
    body.style.paddingRight = '8px';
    const service = serviceFor(fakeDocument);

    service.lock();
    expect(body.style.overflow).toBe('hidden');
    expect(body.style.paddingRight).toBe('8px');

    service.release();
    expect(body.style.paddingRight).toBe('8px');
  });

  it('does not touch padding-right when the window cannot be measured', () => {
    const body = document.createElement('div');
    const service = serviceFor({ body, documentElement: { clientWidth: 0 }, defaultView: null });

    service.lock();
    expect(body.style.overflow).toBe('hidden');
    expect(body.style.paddingRight).toBe('');
    service.release();
    expect(body.style.overflow).toBe('');
  });

  it('ignores extra releases and keeps the counter at zero', () => {
    const { fakeDocument, body } = makeDocument({ innerWidth: 1000, clientWidth: 985 });
    const service = serviceFor(fakeDocument);

    service.release();
    expect(service.count).toBe(0);

    service.lock();
    expect(body.style.paddingRight).toBe('15px');
    service.release();
    service.release();
    expect(service.count).toBe(0);
    expect(body.style.paddingRight).toBe('');

    // Lần khoá kế tiếp vẫn ghi DOM như lần đầu.
    service.lock();
    expect(body.style.paddingRight).toBe('15px');
    service.release();
  });

  it('shares one counter per document across service instances', () => {
    const { fakeDocument, body } = makeDocument({ innerWidth: 1000, clientWidth: 985 });
    const first = serviceFor(fakeDocument);
    first.lock();
    const second = serviceFor(fakeDocument);
    second.lock();

    first.release();
    expect(body.style.paddingRight).toBe('15px');
    second.release();
    expect(body.style.paddingRight).toBe('');
  });
});
