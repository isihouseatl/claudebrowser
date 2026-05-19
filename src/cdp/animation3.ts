import type CRI from 'chrome-remote-interface';

export async function getCssAnimations4(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const all = Array.from(document.querySelectorAll('*'));
    const results = [];
    for (const el of all) {
      const style = getComputedStyle(el);
      const animationName = style.animationName;
      if (animationName && animationName !== 'none') {
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).slice(0, 3).join(' ') : null,
          animationName: animationName,
          duration: style.animationDuration
        });
        if (results.length >= 20) break;
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getCssTransitions4(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const all = Array.from(document.querySelectorAll('*'));
    const results = [];
    for (const el of all) {
      const style = getComputedStyle(el);
      const transitionProperty = style.transitionProperty;
      const transitionDuration = style.transitionDuration;
      if (transitionProperty && transitionProperty !== 'none' && transitionProperty !== 'all 0s ease 0s' && transitionDuration && transitionDuration !== '0s') {
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).slice(0, 3).join(' ') : null,
          transitionProperty: transitionProperty,
          duration: transitionDuration
        });
        if (results.length >= 20) break;
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getAnimatedElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const all = Array.from(document.querySelectorAll('*'));
    let animationOnly = 0;
    let transitionOnly = 0;
    let both = 0;
    for (const el of all) {
      const style = getComputedStyle(el);
      const hasAnim = style.animationName && style.animationName !== 'none';
      const hasTrans = style.transitionProperty && style.transitionProperty !== 'none' && style.transitionDuration && style.transitionDuration !== '0s';
      if (hasAnim && hasTrans) both++;
      else if (hasAnim) animationOnly++;
      else if (hasTrans) transitionOnly++;
    }
    return { total: animationOnly + transitionOnly + both, animationOnly, transitionOnly, both };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getKeyframeRules(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const results = [];
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try { rules = Array.from(sheet.cssRules || []); } catch (e) { continue; }
        for (const rule of rules) {
          if (rule.type === CSSRule.KEYFRAMES_RULE) {
            const kfRule = rule;
            const name = kfRule.name;
            const ruleCount = kfRule.cssRules ? kfRule.cssRules.length : 0;
            results.push({ name, ruleCount });
            if (results.length >= 20) break;
          }
        }
        if (results.length >= 20) break;
      }
    } catch (e) {
      return { error: String(e) };
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getTransitionProperties(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const all = Array.from(document.querySelectorAll('*'));
    const counts = {};
    for (const el of all) {
      const style = getComputedStyle(el);
      const prop = style.transitionProperty;
      if (prop && prop !== 'none' && style.transitionDuration && style.transitionDuration !== '0s') {
        const parts = prop.split(',').map(s => s.trim());
        for (const p of parts) {
          counts[p] = (counts[p] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .map(([property, count]) => ({ property, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getRunningAnimations(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    if (typeof document.getAnimations !== 'function') {
      return { error: 'Web Animations API not supported' };
    }
    const anims = document.getAnimations();
    return anims.slice(0, 20).map((a, i) => {
      let effect_preview = null;
      try {
        if (a.effect && a.effect.target) {
          const t = a.effect.target;
          effect_preview = t.tagName.toLowerCase() + (t.id ? '#' + t.id : '') + (t.className && typeof t.className === 'string' ? '.' + t.className.trim().split(/\s+/)[0] : '');
        }
      } catch (e) {}
      return {
        id: i,
        playState: a.playState,
        currentTime: a.currentTime,
        effect_preview
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getAnimationTiming(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    if (typeof document.getAnimations !== 'function') {
      return { error: 'Web Animations API not supported' };
    }
    const anims = document.getAnimations();
    const summary = { total: anims.length, running: 0, paused: 0, finished: 0, idle: 0 };
    for (const a of anims) {
      if (a.playState === 'running') summary.running++;
      else if (a.playState === 'paused') summary.paused++;
      else if (a.playState === 'finished') summary.finished++;
      else summary.idle++;
    }
    return summary;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getWapiAnimations(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const hasWebAnimationsApi = typeof document.getAnimations === 'function';
    if (!hasWebAnimationsApi) {
      return { count: 0, hasWebAnimationsApi: false, animationsRunning: 0 };
    }
    const anims = document.getAnimations();
    const running = anims.filter(a => a.playState === 'running').length;
    return { count: anims.length, hasWebAnimationsApi: true, animationsRunning: running };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
