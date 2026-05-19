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

// --- New functions: CSS and Web Animations API detection ---

// 1. getAnimations3 — running Web Animations (document.getAnimations())
// Suffix 3: getAnimations (animation.ts/animations.ts) and getAnimations2 (css2.ts) are taken.
export async function getAnimations3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      if (typeof document.getAnimations !== 'function') {
        return { supported: false, animations: [] };
      }
      const anims = document.getAnimations();
      const items = anims.slice(0, 20).map(function(a, i) {
        var target = null;
        try {
          if (a.effect && a.effect.target) {
            var t = a.effect.target;
            target = t.tagName.toLowerCase()
              + (t.id ? '#' + t.id : '')
              + (t.className && typeof t.className === 'string'
                  ? '.' + t.className.trim().split(/\s+/)[0] : '');
          }
        } catch (e) {}
        var animName = null;
        try { animName = a.animationName || null; } catch (e) {}
        return {
          index: i,
          playState: a.playState,
          currentTime: typeof a.currentTime === 'number' ? Math.round(a.currentTime) : a.currentTime,
          target: target,
          animationName: animName
        };
      });
      return { supported: true, total: anims.length, animations: items };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 2. getCssAnimations5 — elements with CSS animation-name property set
// Suffix 5: getCssAnimations (animation2.ts), getCssAnimations2 (css3.ts),
//           getCssAnimations3 (css3.ts), getCssAnimations4 (animation3.ts) are taken.
export async function getCssAnimations5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var results = [];
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var style = getComputedStyle(el);
        var name = style.animationName;
        if (name && name !== 'none') {
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: typeof el.className === 'string'
              ? el.className.trim().split(/\s+/).slice(0, 3).join(' ') : null,
            animationName: name,
            duration: style.animationDuration,
            playState: style.animationPlayState,
            iterationCount: style.animationIterationCount
          });
          if (results.length >= 20) break;
        }
      }
      return { count: results.length, elements: results };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 3. getCssTransitions5 — elements with CSS transition property set
// Suffix 5: getCssTransitions (animation2.ts), getCssTransitions2 (css3.ts),
//           getCssTransitions3 (css3.ts), getCssTransitions4 (animation3.ts) are taken.
export async function getCssTransitions5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var results = [];
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var style = getComputedStyle(el);
        var prop = style.transitionProperty;
        var dur = style.transitionDuration;
        if (prop && prop !== 'none' && dur && dur !== '0s') {
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: typeof el.className === 'string'
              ? el.className.trim().split(/\s+/).slice(0, 3).join(' ') : null,
            transitionProperty: prop,
            duration: dur,
            timingFunction: style.transitionTimingFunction,
            delay: style.transitionDelay
          });
          if (results.length >= 20) break;
        }
      }
      return { count: results.length, elements: results };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 4. getAnimatedElements2 — elements currently being animated (CSS or WAPI)
// Suffix 2: getAnimatedElements (animation3.ts) is taken.
export async function getAnimatedElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var animated = [];
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var style = getComputedStyle(el);
        var hasAnim = style.animationName && style.animationName !== 'none'
          && style.animationPlayState === 'running';
        var hasTrans = style.transitionProperty && style.transitionProperty !== 'none'
          && style.transitionDuration && style.transitionDuration !== '0s';
        var hasWapi = false;
        try {
          if (typeof el.getAnimations === 'function') {
            hasWapi = el.getAnimations().some(function(a) { return a.playState === 'running'; });
          }
        } catch (e) {}
        if (hasAnim || hasTrans || hasWapi) {
          animated.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: typeof el.className === 'string'
              ? el.className.trim().split(/\s+/).slice(0, 2).join(' ') : null,
            source: hasWapi ? 'wapi' : (hasAnim ? 'css-animation' : 'css-transition')
          });
          if (animated.length >= 20) break;
        }
      }
      return { count: animated.length, elements: animated };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 5. getAnimationState — summary: {hasAnimations, animationCount, transitionCount, hasWebAnimations}
// No existing function with this name — no suffix needed.
export async function getAnimationState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var animationCount = 0;
      var transitionCount = 0;
      for (var i = 0; i < all.length; i++) {
        var style = getComputedStyle(all[i]);
        if (style.animationName && style.animationName !== 'none') animationCount++;
        if (style.transitionProperty && style.transitionProperty !== 'none'
            && style.transitionDuration && style.transitionDuration !== '0s') transitionCount++;
      }
      var wapiCount = 0;
      var hasWebAnimations = false;
      try {
        if (typeof document.getAnimations === 'function') {
          hasWebAnimations = true;
          wapiCount = document.getAnimations().length;
        }
      } catch (e) {}
      return {
        hasAnimations: animationCount > 0 || transitionCount > 0 || wapiCount > 0,
        animationCount: animationCount,
        transitionCount: transitionCount,
        hasWebAnimations: hasWebAnimations,
        wapiCount: wapiCount
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 6. getKeyframeAnimations2 — @keyframes rules detected in stylesheets
// Suffix 2: getKeyframeAnimations (css3.ts) is taken.
export async function getKeyframeAnimations2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var results = [];
      try {
        var sheets = Array.from(document.styleSheets);
        for (var s = 0; s < sheets.length; s++) {
          var rules;
          try { rules = Array.from(sheets[s].cssRules || []); } catch (e) { continue; }
          for (var r = 0; r < rules.length; r++) {
            var rule = rules[r];
            if (rule.type === CSSRule.KEYFRAMES_RULE) {
              var frames = [];
              try {
                var kfRules = Array.from(rule.cssRules || []);
                frames = kfRules.map(function(kf) {
                  return { keyText: kf.keyText };
                }).slice(0, 10);
              } catch (e) {}
              results.push({
                name: rule.name,
                frameCount: rule.cssRules ? rule.cssRules.length : 0,
                frames: frames
              });
              if (results.length >= 20) break;
            }
          }
          if (results.length >= 20) break;
        }
      } catch (e) {
        return { error: String(e) };
      }
      return { count: results.length, keyframes: results };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 7. getWebAnimations — elements using the Web Animations API (.animate())
// No existing function with this name — no suffix needed.
export async function getWebAnimations(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      if (typeof document.getAnimations !== 'function') {
        return { supported: false, elements: [] };
      }
      var anims = document.getAnimations();
      var seen = new Set();
      var elements = [];
      for (var i = 0; i < anims.length; i++) {
        var a = anims[i];
        var isWapi = !(a.animationName !== undefined && a.animationName !== null
                       && typeof a.animationName === 'string' && a.animationName.length > 0
                       && a.constructor.name !== 'CSSAnimation');
        if (!isWapi) continue;
        try {
          if (a.effect && a.effect.target) {
            var t = a.effect.target;
            var key = t.tagName + (t.id || '') + (typeof t.className === 'string' ? t.className : '');
            if (!seen.has(key)) {
              seen.add(key);
              var timing = null;
              try {
                var et = a.effect.getTiming ? a.effect.getTiming() : null;
                if (et) timing = { duration: et.duration, iterations: et.iterations, fill: et.fill };
              } catch (e) {}
              elements.push({
                tag: t.tagName.toLowerCase(),
                id: t.id || null,
                className: typeof t.className === 'string'
                  ? t.className.trim().split(/\s+/).slice(0, 2).join(' ') : null,
                playState: a.playState,
                timing: timing
              });
              if (elements.length >= 20) break;
            }
          }
        } catch (e) {}
      }
      var totalWapi = anims.filter(function(a) {
        return a.constructor && a.constructor.name !== 'CSSAnimation'
          && a.constructor.name !== 'CSSTransition';
      }).length;
      return { supported: true, totalWapiAnimations: totalWapi, elements: elements };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 8. getAnimationApiUsage — detected animation libraries
// No existing function with this name — no suffix needed.
export async function getAnimationApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var hasGsap = typeof window.gsap !== 'undefined'
        || typeof window.TweenMax !== 'undefined'
        || typeof window.TweenLite !== 'undefined'
        || typeof window.TimelineMax !== 'undefined';
      var hasAnimeJs = typeof window.anime !== 'undefined';
      var hasMotion = typeof window.motion !== 'undefined'
        || typeof window.animate !== 'undefined' && window.animate && window.animate.toString
          && window.animate.toString().indexOf('motion') !== -1;
      var hasFramerMotion = typeof window.FramerMotion !== 'undefined'
        || (typeof window.__framer_importedPackages !== 'undefined')
        || document.querySelector('[data-framer-component-type]') !== null
        || document.querySelector('[data-framer-name]') !== null;
      var hasLottie = typeof window.lottie !== 'undefined'
        || typeof window.Lottie !== 'undefined'
        || document.querySelector('lottie-player') !== null
        || document.querySelector('[data-lottie]') !== null;
      var hasAos = typeof window.AOS !== 'undefined';
      var hasVelocity = typeof window.Velocity !== 'undefined' || typeof window.$.Velocity !== 'undefined';
      var scriptSrcs = Array.from(document.querySelectorAll('script[src]')).map(function(s) {
        return s.getAttribute('src') || '';
      });
      var srcText = scriptSrcs.join(' ').toLowerCase();
      if (!hasGsap && srcText.indexOf('gsap') !== -1) hasGsap = true;
      if (!hasAnimeJs && srcText.indexOf('anime') !== -1) hasAnimeJs = true;
      if (!hasLottie && srcText.indexOf('lottie') !== -1) hasLottie = true;
      return {
        hasGsap: hasGsap,
        hasAnimeJs: hasAnimeJs,
        hasMotion: hasMotion,
        hasFramerMotion: hasFramerMotion,
        hasLottie: hasLottie,
        hasAos: hasAos,
        hasVelocity: hasVelocity,
        detectedLibraries: [
          hasGsap ? 'gsap' : null,
          hasAnimeJs ? 'anime.js' : null,
          hasMotion ? 'motion' : null,
          hasFramerMotion ? 'framer-motion' : null,
          hasLottie ? 'lottie' : null,
          hasAos ? 'aos' : null,
          hasVelocity ? 'velocity' : null
        ].filter(Boolean)
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}
