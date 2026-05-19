// src/cdp/aria2.ts
import type { CdpClient } from './client';

function ok(data: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string) { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

/** All elements with explicit role attribute: tag, id, role, text_preview (max 30) */
export async function getAriaRoles2(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = document.querySelectorAll('[role]');
        var result = [];
        for (var i = 0; i < els.length && result.length < 30; i++) {
          var el = els[i];
          var text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30);
          result.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            role: el.getAttribute('role'),
            text_preview: text || null
          });
        }
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/** Elements with aria-label or aria-labelledby: tag, id, ariaLabel (max 30) */
export async function getAriaLabels2(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = document.querySelectorAll('[aria-label], [aria-labelledby]');
        var result = [];
        for (var i = 0; i < els.length && result.length < 30; i++) {
          var el = els[i];
          var ariaLabel = el.getAttribute('aria-label');
          var labelledby = el.getAttribute('aria-labelledby');
          var resolvedLabel = ariaLabel;
          if (!resolvedLabel && labelledby) {
            var labelEl = document.getElementById(labelledby);
            resolvedLabel = labelEl ? (labelEl.textContent || '').trim().slice(0, 50) : null;
          }
          result.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            ariaLabel: resolvedLabel ? resolvedLabel.slice(0, 50) : null,
            ariaLabelledby: labelledby || null
          });
        }
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/** Elements with aria-describedby: tag, id, ariaDescribedby (max 20) */
export async function getAriaDescriptions2(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = document.querySelectorAll('[aria-describedby]');
        var result = [];
        for (var i = 0; i < els.length && result.length < 20; i++) {
          var el = els[i];
          var describedby = el.getAttribute('aria-describedby');
          var resolvedDesc = null;
          if (describedby) {
            var descEl = document.getElementById(describedby);
            resolvedDesc = descEl ? (descEl.textContent || '').trim().slice(0, 80) : null;
          }
          result.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            ariaDescribedby: describedby,
            resolvedDescription: resolvedDesc
          });
        }
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/** Elements with aria-live (polite/assertive): tag, id, ariaLive, text_preview (max 20) */
export async function getAriaLive(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = document.querySelectorAll('[aria-live]');
        var result = [];
        for (var i = 0; i < els.length && result.length < 20; i++) {
          var el = els[i];
          var liveVal = el.getAttribute('aria-live');
          var text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30);
          result.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            ariaLive: liveVal,
            text_preview: text || null
          });
        }
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/** Form fields with aria-invalid=true: tag, id, name (max 20) */
export async function getAriaInvalid(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = document.querySelectorAll('[aria-invalid="true"]');
        var result = [];
        for (var i = 0; i < els.length && result.length < 20; i++) {
          var el = els[i];
          result.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            name: el.getAttribute('name') || null,
            type: el.getAttribute('type') || null,
            ariaInvalid: el.getAttribute('aria-invalid')
          });
        }
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/** Form fields with aria-required=true or required attribute: tag, id, name (max 20) */
export async function getAriaRequired(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = document.querySelectorAll('[aria-required="true"], [required]');
        var result = [];
        for (var i = 0; i < els.length && result.length < 20; i++) {
          var el = els[i];
          result.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            name: el.getAttribute('name') || null,
            type: el.getAttribute('type') || null,
            ariaRequired: el.getAttribute('aria-required') || null,
            requiredAttr: el.hasAttribute('required')
          });
        }
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/** Elements with landmark roles (main, nav, header, footer, aside, form, search): role, tag, id (max 20) */
export async function getLandmarks3(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var landmarkRoles = ['main', 'navigation', 'banner', 'contentinfo', 'complementary', 'form', 'search', 'region', 'application'];
        var landmarkTags = ['main', 'nav', 'header', 'footer', 'aside', 'form', 'section'];
        var seen = new Set();
        var result = [];

        // Explicit role attributes
        var roleEls = document.querySelectorAll('[role]');
        for (var i = 0; i < roleEls.length && result.length < 20; i++) {
          var el = roleEls[i];
          var role = el.getAttribute('role');
          if (landmarkRoles.indexOf(role) !== -1) {
            seen.add(el);
            result.push({
              role: role,
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              source: 'explicit'
            });
          }
        }

        // Implicit landmark tags
        for (var j = 0; j < landmarkTags.length && result.length < 20; j++) {
          var tagEls = document.getElementsByTagName(landmarkTags[j]);
          for (var k = 0; k < tagEls.length && result.length < 20; k++) {
            var tagEl = tagEls[k];
            if (!seen.has(tagEl)) {
              seen.add(tagEl);
              result.push({
                role: landmarkTags[j],
                tag: tagEl.tagName.toLowerCase(),
                id: tagEl.id || null,
                source: 'implicit'
              });
            }
          }
        }

        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/** Elements with aria-expanded: tag, id, text, expanded (max 20) */
export async function getAriaExpanded2(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = document.querySelectorAll('[aria-expanded]');
        var result = [];
        for (var i = 0; i < els.length && result.length < 20; i++) {
          var el = els[i];
          var text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30);
          result.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            text: text || null,
            expanded: el.getAttribute('aria-expanded')
          });
        }
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
