// src/cdp/snapshot.ts
import { CdpClient } from './client';

export interface ElementRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InteractiveElement {
  tag: string;
  type: string | null;
  selector: string;
  text: string | null;
  value: string | null;
  placeholder: string | null;
  rect: ElementRect;
  visible: boolean;
  enabled: boolean;
}

export interface Heading {
  level: number;
  text: string;
  rect: ElementRect;
}

export interface ScrollState {
  x: number;
  y: number;
  maxX: number;
  maxY: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface PageSnapshot {
  url: string;
  title: string;
  scroll: ScrollState;
  viewport: Viewport;
  interactive: InteractiveElement[];
  headings: Heading[];
  alerts: string[];
}

const SNAPSHOT_EXPRESSION = `(function () {
  try {
    function safeRect(el) {
      try {
        var r = el.getBoundingClientRect();
        return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
      } catch (_) { return { x: 0, y: 0, w: 0, h: 0 }; }
    }

    function isVisible(el) {
      try {
        var r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return false;
        var style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      } catch (_) { return false; }
    }

    function selectorOf(el) {
      try {
        var tag = el.tagName.toLowerCase();
        var id = el.id ? '#' + el.id : '';
        var name = el.name ? '[name="' + el.name + '"]' : '';
        var cls = el.className && typeof el.className === 'string' && el.className.trim()
          ? '.' + el.className.trim().split(/\\s+/)[0]
          : '';
        return tag + id + name + (id ? '' : cls);
      } catch (_) { return ''; }
    }

    function textOf(el) {
      try {
        var t = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
        return t.length > 200 ? t.slice(0, 200) : (t || null);
      } catch (_) { return null; }
    }

    function valueOf(el) {
      try {
        var v = el.value;
        if (v === undefined || v === null) return null;
        var s = String(v).slice(0, 200);
        return s || null;
      } catch (_) { return null; }
    }

    // -- Page-level info --
    var url = location.href;
    var title = document.title;

    var scroll = {
      x: Math.round(window.scrollX),
      y: Math.round(window.scrollY),
      maxX: Math.round(document.documentElement.scrollWidth - window.innerWidth),
      maxY: Math.round(document.documentElement.scrollHeight - window.innerHeight)
    };

    var viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // -- Interactive elements --
    var interactiveSel = 'button, input, select, textarea, a[href], [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="combobox"], [role="menuitem"], [role="tab"], [tabindex]:not([tabindex="-1"])';
    var interactiveEls = Array.prototype.slice.call(document.querySelectorAll(interactiveSel), 0, 200);

    var interactive = [];
    for (var i = 0; i < interactiveEls.length && interactive.length < 100; i++) {
      try {
        var el = interactiveEls[i];
        var rect = safeRect(el);
        if (rect.w === 0 && rect.h === 0) continue;
        interactive.push({
          tag: el.tagName.toLowerCase(),
          type: el.type || null,
          selector: selectorOf(el),
          text: textOf(el),
          value: valueOf(el),
          placeholder: el.placeholder || null,
          rect: rect,
          visible: isVisible(el),
          enabled: !el.disabled
        });
      } catch (_) {}
    }

    // -- Headings --
    var headingEls = Array.prototype.slice.call(document.querySelectorAll('h1,h2,h3,h4,h5,h6'), 0, 100);
    var headings = [];
    for (var j = 0; j < headingEls.length && headings.length < 50; j++) {
      try {
        var hel = headingEls[j];
        var hlevel = parseInt(hel.tagName.charAt(1), 10);
        var htext = (hel.innerText || hel.textContent || '').replace(/\\s+/g, ' ').trim();
        headings.push({
          level: hlevel,
          text: htext.slice(0, 200),
          rect: safeRect(hel)
        });
      } catch (_) {}
    }

    // -- Alerts --
    var alertEls = Array.prototype.slice.call(document.querySelectorAll('[role="alert"]'), 0, 20);
    var alerts = [];
    for (var k = 0; k < alertEls.length; k++) {
      try {
        var atext = (alertEls[k].innerText || alertEls[k].textContent || '').replace(/\\s+/g, ' ').trim();
        if (atext) alerts.push(atext.slice(0, 300));
      } catch (_) {}
    }

    return JSON.stringify({ url: url, title: title, scroll: scroll, viewport: viewport, interactive: interactive, headings: headings, alerts: alerts });
  } catch (outerErr) {
    return JSON.stringify({ error: String(outerErr) });
  }
})()`;

export async function getPageSnapshot(client: CdpClient): Promise<PageSnapshot> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: SNAPSHOT_EXPRESSION,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    throw new Error(
      `Snapshot JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }

  const raw = JSON.parse(result.value as string) as Record<string, unknown>;

  if ('error' in raw) {
    throw new Error(`Snapshot collection failed: ${raw.error}`);
  }

  return raw as unknown as PageSnapshot;
}
