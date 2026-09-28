import { sdSanitizeEditorHtml } from './editor-html-sanitizer';

describe('sdSanitizeEditorHtml', () => {
  describe('clean editor output', () => {
    // why: đây là dạng CKEditor phát ra; hàm phải trả NGUYÊN chuỗi để giá trị form không bị đổi và
    // không bị đánh dấu dirty oan.
    const CLEAN = [
      '<p>Hello <strong>world</strong> <i>and</i> <u>more</u></p>',
      '<p style="text-align:center;"><span style="color:#ff0000;font-size:14px;">Colored</span></p>',
      '<ol type="a" start="3"><li>One</li><li>Two</li></ol><ul><li>Bullet</li></ul>',
      '<figure class="table"><table><tbody><tr><th colspan="2">Head</th></tr><tr><td>a</td><td rowspan="1">b</td></tr></tbody></table></figure>',
      '<figure class="image" style="width:50%;"><img style="width:100%;" src="https://cdn.example.com/a.png" alt="a" loading="lazy" id="img-1"></figure>',
      '<p><a href="https://example.com/x?y=1" target="_blank" rel="noopener noreferrer">link</a></p>',
      '<p><a href="mailto:hi@example.com">mail</a> <a href="tel:+84123456">call</a> <a href="/docs/a">rel</a> <a href="#part-2">frag</a></p>',
      '<p><span class="ck-custom-mention" data-id="42" data-marker="@" contenteditable="false">@An</span></p>',
      '<p><img src="data:image/png;base64,iVBORw0KGgo=" alt=""><img src="blob:https://app.example.com/9f7c" alt="pending"></p>',
      '<p aria-label="note" data-note="x">Note&nbsp;text</p>',
      '<blockquote cite="https://example.com/src"><p>Quote</p></blockquote>',
    ];

    for (const html of CLEAN) {
      it(`returns the input unchanged: ${html.slice(0, 60)}`, () => {
        expect(sdSanitizeEditorHtml(html)).toBe(html);
      });
    }

    it('returns an empty string for empty, null and undefined input', () => {
      expect(sdSanitizeEditorHtml('')).toBe('');
      expect(sdSanitizeEditorHtml(null)).toBe('');
      expect(sdSanitizeEditorHtml(undefined)).toBe('');
    });
  });

  describe('link URLs (href, cite)', () => {
    it('drops javascript:, vbscript: and data: links, including obfuscated forms', () => {
      expect(sdSanitizeEditorHtml('<p><a href="javascript:alert(1)">x</a></p>')).toBe('<p><a>x</a></p>');
      expect(sdSanitizeEditorHtml('<p><a href="JaVaScRiPt:alert(1)">x</a></p>')).toBe('<p><a>x</a></p>');
      expect(sdSanitizeEditorHtml('<p><a href="java&#9;script:alert(1)">x</a></p>')).toBe('<p><a>x</a></p>');
      expect(sdSanitizeEditorHtml('<p><a href="&#106;avascript:alert(1)">x</a></p>')).toBe('<p><a>x</a></p>');
      expect(sdSanitizeEditorHtml('<p><a href=" javascript:alert(1)">x</a></p>')).toBe('<p><a>x</a></p>');
      expect(sdSanitizeEditorHtml('<p><a href="vbscript:msgbox(1)">x</a></p>')).toBe('<p><a>x</a></p>');
      expect(sdSanitizeEditorHtml('<p><a href="data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;">x</a></p>')).toBe('<p><a>x</a></p>');
      expect(sdSanitizeEditorHtml('<p><a href="data:image/png;base64,AAAA">x</a></p>')).toBe('<p><a>x</a></p>');
      expect(sdSanitizeEditorHtml('<p><a href="file:///etc/passwd">x</a></p>')).toBe('<p><a>x</a></p>');
    });

    it('applies the link policy to cite', () => {
      expect(sdSanitizeEditorHtml('<blockquote cite="javascript:alert(1)"><p>q</p></blockquote>')).toBe(
        '<blockquote><p>q</p></blockquote>'
      );
    });
  });

  describe('image URLs (src, srcset)', () => {
    it('drops unsafe image sources', () => {
      expect(sdSanitizeEditorHtml('<p><img src="javascript:alert(1)" alt="a"></p>')).toBe('<p><img alt="a"></p>');
      expect(sdSanitizeEditorHtml('<p><img src="data:text/html;base64,PHNjcmlwdD4=" alt="a"></p>')).toBe('<p><img alt="a"></p>');
      expect(sdSanitizeEditorHtml('<p><img src="vbscript:x" alt="a"></p>')).toBe('<p><img alt="a"></p>');
    });

    it('keeps srcset only when every candidate is safe', () => {
      const safe =
        '<p><img src="/a.png" srcset="/a-1x.png 1x, data:image/png;base64,AAAA 2x, https://cdn.example.com/a.png 800w" sizes="100vw"></p>';
      expect(sdSanitizeEditorHtml(safe)).toBe(safe);
      expect(sdSanitizeEditorHtml('<p><img src="/a.png" srcset="/a.png 1x, javascript:alert(1) 2x"></p>')).toBe(
        '<p><img src="/a.png"></p>'
      );
    });
  });

  describe('attributes', () => {
    it('drops every event handler attribute', () => {
      expect(sdSanitizeEditorHtml('<p onclick="alert(1)">x</p>')).toBe('<p>x</p>');
      expect(sdSanitizeEditorHtml('<p><img src="https://x.example.com/a.png" onerror="alert(1)"></p>')).toBe(
        '<p><img src="https://x.example.com/a.png"></p>'
      );
      expect(sdSanitizeEditorHtml('<p ONMOUSEOVER="alert(1)" style="color:red;">x</p>')).toBe('<p style="color:red;">x</p>');
    });

    it('drops attributes outside the allowlist', () => {
      expect(sdSanitizeEditorHtml('<p><img src="/a.png" name="config" background="/b.png" poster="/c.png"></p>')).toBe(
        '<p><img src="/a.png"></p>'
      );
      expect(sdSanitizeEditorHtml('<div srcdoc="&lt;script&gt;" formaction="/x">x</div>')).toBe('<div>x</div>');
    });

    it('keeps type only on ol', () => {
      expect(sdSanitizeEditorHtml('<ul type="disc"><li>x</li></ul>')).toBe('<ul><li>x</li></ul>');
    });

    it('keeps contenteditable only when it is false', () => {
      expect(sdSanitizeEditorHtml('<p><span contenteditable="true">x</span></p>')).toBe('<p><span>x</span></p>');
    });
  });

  describe('elements', () => {
    it('removes dangerous elements together with their content', () => {
      expect(sdSanitizeEditorHtml('<p>a</p><script>alert(1)</script><p>b</p>')).toBe('<p>a</p><p>b</p>');
      expect(sdSanitizeEditorHtml('<p>a<iframe src="https://evil.example.com"></iframe></p>')).toBe('<p>a</p>');
      expect(sdSanitizeEditorHtml('<p>a<object data="/x.swf"><embed src="/x.swf"></object></p>')).toBe('<p>a</p>');
      expect(sdSanitizeEditorHtml('<form action="/steal"><input value="x"><button>Go</button></form><p>b</p>')).toBe('<p>b</p>');
      expect(sdSanitizeEditorHtml('<p>a<template><img src=x onerror=alert(1)></template></p>')).toBe('<p>a</p>');
    });

    it('drops content the parser moves into head, and attributes merged into body', () => {
      expect(sdSanitizeEditorHtml('<style>p{color:red}</style><p>x</p>')).toBe('<p>x</p>');
      expect(sdSanitizeEditorHtml('<meta http-equiv="refresh" content="0;url=https://evil.example.com"><p>x</p>')).toBe('<p>x</p>');
      expect(sdSanitizeEditorHtml('<body onload="alert(1)"><p>x</p></body>')).toBe('<p>x</p>');
    });

    it('unwraps unknown elements but keeps their text', () => {
      expect(sdSanitizeEditorHtml('<p><x-widget>hi</x-widget> <font color="red">there</font></p>')).toBe('<p>hi there</p>');
    });

    it('removes comments', () => {
      expect(sdSanitizeEditorHtml('<p>a<!-- hidden --></p>')).toBe('<p>a</p>');
    });

    it('never keeps SVG or MathML elements', () => {
      expect(sdSanitizeEditorHtml('<p><svg><a href="javascript:alert(1)"><text>x</text></a></svg></p>')).toBe('<p>x</p>');
      expect(sdSanitizeEditorHtml('<p>a<svg><use href="data:image/svg+xml,x"></use><animate onbegin="alert(1)"></animate></svg></p>')).toBe(
        '<p>a</p>'
      );
    });

    it('neutralises known mutation-XSS payloads', () => {
      const payloads = [
        '<math><mtext><table><mglyph><style><!--</style><img title="--&gt;&lt;/mglyph&gt;&lt;img&Tab;src=1&Tab;onerror=alert(1)&gt;">',
        '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>',
        '<svg></p><style><a id="</style><img src=1 onerror=alert(1)>">',
        '<form><math><mtext></form><form><mglyph><style></math><img src onerror=alert(1)>',
      ];
      for (const payload of payloads) {
        const output = sdSanitizeEditorHtml(payload);
        // Parse lại như consumer render bằng innerHTML, nhưng trong <template> (trơ: không tải ảnh,
        // không chạy script): không được còn phần tử hay thuộc tính nguy hiểm nào.
        const host = document.createElement('template');
        host.innerHTML = output;
        expect(host.content.querySelector('script, style, svg, math, form, noscript')).withContext(payload).toBeNull();
        const handlers = Array.from(host.content.querySelectorAll('*')).flatMap(el =>
          Array.from(el.attributes).filter(attr => attr.name.startsWith('on'))
        );
        expect(handlers.length).withContext(payload).toBe(0);
      }
    });
  });

  describe('stability', () => {
    it('is idempotent', () => {
      const inputs = [
        '<p onclick="x">a<script>b</script><x-y>c</x-y></p>',
        '<p><math><mi><div>x</div></mi></math></p>',
        '<table><tr><td>a</td></tr></table><!-- c --><img src="javascript:x">',
        '<P CLASS="x">Upper</P><br/>',
      ];
      for (const input of inputs) {
        const once = sdSanitizeEditorHtml(input);
        expect(sdSanitizeEditorHtml(once)).withContext(input).toBe(once);
      }
    });

    it('re-serialises markup the parser would have dropped, instead of returning it', () => {
      // why: `<tr>` ngoài `<table>` bị parser bỏ trong ngữ cảnh body nên không đi qua bộ lọc, nhưng sẽ
      // thành thật nếu consumer render chuỗi gốc vào `<tbody>`.
      expect(sdSanitizeEditorHtml('<tr onclick="alert(1)"><td>x</td></tr>')).toBe('x');
    });
  });

  describe('without DOMParser', () => {
    it('fails closed by returning escaped text', () => {
      const globalRef = globalThis as { DOMParser?: typeof DOMParser };
      const original = globalRef.DOMParser;
      globalRef.DOMParser = undefined;
      try {
        expect(sdSanitizeEditorHtml('<p onclick="x">a & b</p>')).toBe('&lt;p onclick=&quot;x&quot;&gt;a &amp; b&lt;/p&gt;');
      } finally {
        globalRef.DOMParser = original;
      }
    });
  });
});
