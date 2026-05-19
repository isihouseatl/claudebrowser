/**
 * speech2.ts — Web Speech API introspection: recognition state, synthesis voices,
 * TTS state, speech inputs, voice search elements, microphone permission,
 * TTS trigger buttons, and speech API usage patterns.
 */

// ─── 1. getSpeechRecognitionState ──────────────────────────────────────────

/**
 * getSpeechRecognitionState — Web Speech API availability: {available, hasRecognition, hasSynthesis}
 */
export async function getSpeechRecognitionState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const hasRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      const hasSynthesis = !!(window.speechSynthesis);
      return {
        available: hasRecognition || hasSynthesis,
        hasRecognition,
        hasSynthesis,
      };
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 2. getSpeechSynthesisVoices ───────────────────────────────────────────

/**
 * getSpeechSynthesisVoices — available TTS voices: [{name, lang, localService, default}] (max 20)
 */
export async function getSpeechSynthesisVoices(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(async () => {
      if (!window.speechSynthesis) return [];
      let voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) {
        await new Promise(resolve => {
          const handler = () => { resolve(undefined); };
          window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true });
          setTimeout(resolve, 1000);
        });
        voices = window.speechSynthesis.getVoices();
      }
      return voices.slice(0, 20).map(v => ({
        name: v.name,
        lang: v.lang,
        localService: v.localService,
        default: v.default,
      }));
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 3. getSpeechSynthesisState ────────────────────────────────────────────

/**
 * getSpeechSynthesisState — TTS state: {speaking, pending, paused, voiceCount}
 */
export async function getSpeechSynthesisState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      if (!window.speechSynthesis) {
        return { speaking: false, pending: false, paused: false, voiceCount: 0 };
      }
      const ss = window.speechSynthesis;
      return {
        speaking: ss.speaking,
        pending: ss.pending,
        paused: ss.paused,
        voiceCount: ss.getVoices().length,
      };
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 4. getSpeechInputs ────────────────────────────────────────────────────

/**
 * getSpeechInputs — inputs with speech/voice type: [{id, type, class_preview, hasVoiceButton}] (max 20)
 */
export async function getSpeechInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const inputs = Array.from(document.querySelectorAll(
        'input[type="search"], input[x-webkit-speech], input[speech], input[voice]'
      ));
      const allInputs = Array.from(document.querySelectorAll('input, textarea'));
      const speechInputs = allInputs.filter(el => {
        const cls = (el.className || '').toLowerCase();
        const id = (el.id || '').toLowerCase();
        const name = (el.getAttribute('name') || '').toLowerCase();
        return cls.includes('voice') || cls.includes('speech') ||
               id.includes('voice') || id.includes('speech') ||
               name.includes('voice') || name.includes('speech') ||
               el.hasAttribute('x-webkit-speech') || el.hasAttribute('speech');
      });
      const combined = [...new Set([...inputs, ...speechInputs])].slice(0, 20);
      return combined.map(el => {
        const parent = el.parentElement;
        const hasVoiceButton = !!(parent && parent.querySelector('[aria-label*="voice" i], [aria-label*="speech" i], [title*="voice" i], [title*="speech" i]'));
        return {
          id: el.id || '',
          type: el.getAttribute('type') || el.tagName.toLowerCase(),
          class_preview: (el.className || '').slice(0, 80),
          hasVoiceButton,
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 5. getVoiceSearchElements ─────────────────────────────────────────────

/**
 * getVoiceSearchElements — voice search buttons/icons: [{tag, id, class_preview, text_preview}] (max 20)
 */
export async function getVoiceSearchElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const selectors = [
        '[aria-label*="voice" i]',
        '[aria-label*="speech" i]',
        '[aria-label*="microphone" i]',
        '[title*="voice search" i]',
        '[title*="speech" i]',
        '[title*="microphone" i]',
        '[class*="voice-search" i]',
        '[class*="voicesearch" i]',
        '[class*="mic" i]',
        '[class*="microphone" i]',
        '[data-action="voice"]',
        '[data-type="voice"]',
      ];
      const found = new Set();
      selectors.forEach(sel => {
        try {
          document.querySelectorAll(sel).forEach(el => found.add(el));
        } catch (e) {}
      });
      return Array.from(found).slice(0, 20).map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        class_preview: (el.className || '').toString().slice(0, 80),
        text_preview: (el.textContent || '').trim().slice(0, 60),
      }));
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 6. getSpeechPermission ────────────────────────────────────────────────

/**
 * getSpeechPermission — microphone permission state: {state, isGranted, isDenied, isPrompt}
 */
export async function getSpeechPermission(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(async () => {
      const out = { state: 'unknown', isGranted: false, isDenied: false, isPrompt: false };
      try {
        const perm = await navigator.permissions.query({ name: 'microphone' });
        out.state = perm.state;
        out.isGranted = perm.state === 'granted';
        out.isDenied = perm.state === 'denied';
        out.isPrompt = perm.state === 'prompt';
      } catch (e) {
        out.state = 'error:' + e.message;
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 7. getTtsButtons ──────────────────────────────────────────────────────

/**
 * getTtsButtons — text-to-speech trigger buttons: [{tag, id, text_preview, class_preview}] (max 20)
 */
export async function getTtsButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const selectors = [
        '[aria-label*="listen" i]',
        '[aria-label*="read aloud" i]',
        '[aria-label*="text to speech" i]',
        '[aria-label*="speak" i]',
        '[title*="listen" i]',
        '[title*="read aloud" i]',
        '[title*="text to speech" i]',
        '[title*="speak" i]',
        '[class*="tts" i]',
        '[class*="text-to-speech" i]',
        '[class*="read-aloud" i]',
        '[class*="listen" i]',
        '[data-action="tts"]',
        '[data-action="speak"]',
        '[data-action="read"]',
      ];
      const found = new Set();
      selectors.forEach(sel => {
        try {
          document.querySelectorAll(sel).forEach(el => found.add(el));
        } catch (e) {}
      });
      return Array.from(found).slice(0, 20).map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        text_preview: (el.textContent || '').trim().slice(0, 60),
        class_preview: (el.className || '').toString().slice(0, 80),
      }));
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 8. getSpeechApiUsage ──────────────────────────────────────────────────

/**
 * getSpeechApiUsage — detected speech library patterns: {hasWebSpeechApi, hasSpeechRecognition, hasSpeechSynthesis, hasVoiceSearch}
 */
export async function getSpeechApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      const hasSpeechSynthesis = !!(window.speechSynthesis);
      const hasWebSpeechApi = hasSpeechRecognition || hasSpeechSynthesis;
      const hasVoiceSearch = !!(
        document.querySelector('[aria-label*="voice" i], [aria-label*="microphone" i], [class*="voice-search" i], [class*="voicesearch" i]')
      );
      return {
        hasWebSpeechApi,
        hasSpeechRecognition,
        hasSpeechSynthesis,
        hasVoiceSearch,
      };
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
