export async function getSocialShareButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const platforms=['twitter','facebook','linkedin','whatsapp','instagram','pinterest','reddit','tiktok'];const all=Array.from(document.querySelectorAll('a,button,[role="button"]'));return all.filter(el=>{const t=(el.textContent||'').toLowerCase();const c=(el.className||'').toString().toLowerCase();const h=(el.href||'').toLowerCase();return platforms.some(p=>t.includes(p)||c.includes(p+'share')||c.includes('share-'+p)||h.includes(p+'.com/share'))}).slice(0,20).map(el=>{const t=(el.textContent||'').toLowerCase();const c=(el.className||'').toString().toLowerCase();const h=(el.href||'').toLowerCase();const p=platforms.find(p=>t.includes(p)||c.includes(p)||h.includes(p))||'unknown';return{tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,40),platform:p}}) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getOpenGraphTags3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('meta[property^="og:"]')).slice(0,20).map(m=>({property:m.getAttribute('property'),content_preview:(m.getAttribute('content')||'').slice(0,100)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getTwitterCardTags3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('meta[name^="twitter:"]')).slice(0,15).map(m=>({name:m.getAttribute('name'),content_preview:(m.getAttribute('content')||'').slice(0,100)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getFacebookMetaTags(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('meta[property^="fb:"]')).slice(0,10).map(m=>({property:m.getAttribute('property'),content_preview:(m.getAttribute('content')||'').slice(0,100)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getSocialEmbeds(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const embeds=Array.from(document.querySelectorAll('iframe,blockquote'));return embeds.filter(el=>{const s=(el.src||el.getAttribute('data-instgrm-permalink')||el.className||'').toString().toLowerCase();return['twitter','instagram','facebook','tiktok','youtube','linkedin','reddit'].some(p=>s.includes(p))}).slice(0,20).map(el=>{const s=(el.src||el.getAttribute('data-instgrm-permalink')||'').toString();const p=['twitter','instagram','facebook','tiktok','youtube','linkedin','reddit'].find(p=>s.toLowerCase().includes(p))||'unknown';return{platform:p,tag:el.tagName.toLowerCase(),src_preview:s.slice(0,80),width:el.width||null,height:el.height||null}}) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getSocialLinks2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const platforms={twitter:'twitter.com',facebook:'facebook.com',instagram:'instagram.com',linkedin:'linkedin.com',tiktok:'tiktok.com',youtube:'youtube.com',github:'github.com',discord:'discord.com',reddit:'reddit.com'};return Array.from(document.querySelectorAll('a[href]')).filter(a=>Object.values(platforms).some(d=>a.href.includes(d))).slice(0,20).map(a=>{const p=Object.entries(platforms).find(([k,v])=>a.href.includes(v));return{platform:p?p[0]:'unknown',href_preview:a.href.slice(-80),text_preview:(a.textContent||'').trim().slice(0,40)}}) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getSocialProofElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="follower"],[class*="subscriber"],[class*="testimonial"],[class*="review-count"],[class*="social-proof"],[class*="trust-badge"],[data-followers],[data-subscribers]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,60)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getFollowButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const all=Array.from(document.querySelectorAll('a,button,[role="button"]'));return all.filter(el=>{const t=(el.textContent||'').toLowerCase().trim();return t==='follow'||t.startsWith('follow ')||t==='subscribe'||t.startsWith('subscribe ')||t.includes('follow us')||t.includes('follow on')}).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,60)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
