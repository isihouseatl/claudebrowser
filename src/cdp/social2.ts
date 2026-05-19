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

// --- social2.ts additions ---

export async function getSocialLinks3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const targets={twitter:['twitter.com','x.com'],instagram:['instagram.com'],facebook:['facebook.com','fb.com'],tiktok:['tiktok.com'],linkedin:['linkedin.com']};const links=Array.from(document.querySelectorAll('a[href]'));const out=[];for(const[platform,domains]of Object.entries(targets)){const matches=links.filter(a=>domains.some(d=>a.href.includes(d))).slice(0,5);for(const a of matches)out.push({platform,href:a.href.slice(0,120),text:(a.textContent||'').trim().slice(0,40),ariaLabel:(a.getAttribute('aria-label')||'').slice(0,40)})}return out.slice(0,20) })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getFollowButtons2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const platforms=['twitter','instagram','facebook','tiktok','linkedin','youtube'];const all=Array.from(document.querySelectorAll('a,button,[role="button"]'));return all.filter(el=>{const t=(el.textContent||'').toLowerCase();const c=(el.className||'').toString().toLowerCase();const h=(el.getAttribute('href')||'').toLowerCase();return(t.includes('follow')||t.includes('subscribe'))&&platforms.some(p=>c.includes(p)||h.includes(p+'.com'))}).slice(0,20).map(el=>{const h=(el.getAttribute('href')||'').toLowerCase();const p=platforms.find(p=>h.includes(p+'.com'))||'unknown';return{tag:el.tagName.toLowerCase(),platform:p,text:(el.textContent||'').trim().slice(0,60),href:(el.getAttribute('href')||'').slice(0,100),class_preview:(el.className||'').toString().slice(0,40)}}) })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getShareButtons3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sharePatterns=[{p:'twitter',d:['twitter.com/intent/tweet','x.com/intent/tweet']},{p:'facebook',d:['facebook.com/sharer','facebook.com/share']},{p:'linkedin',d:['linkedin.com/sharing','linkedin.com/shareArticle']},{p:'whatsapp',d:['wa.me/','api.whatsapp.com/send','whatsapp://send']},{p:'pinterest',d:['pinterest.com/pin/create']},{p:'reddit',d:['reddit.com/submit']},{p:'email',d:['mailto:']}];const els=Array.from(document.querySelectorAll('a[href],button,[role="button"]'));const out=[];for(const el of els){const h=(el.getAttribute('href')||'').toLowerCase();const t=(el.textContent||'').toLowerCase();const c=(el.className||'').toString().toLowerCase();const match=sharePatterns.find(({d})=>d.some(pat=>h.includes(pat)||c.includes('share')));if(match)out.push({platform:match.p,tag:el.tagName.toLowerCase(),href:(el.getAttribute('href')||'').slice(0,120),text:(el.textContent||'').trim().slice(0,40),class_preview:c.slice(0,40)})}return out.slice(0,20) })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getSocialProfiles(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const domains={twitter:['twitter.com','x.com'],instagram:['instagram.com'],facebook:['facebook.com'],tiktok:['tiktok.com'],linkedin:['linkedin.com'],youtube:['youtube.com'],github:['github.com'],snapchat:['snapchat.com'],pinterest:['pinterest.com']};const links=Array.from(document.querySelectorAll('a[href]'));const profiles={};for(const[platform,doms]of Object.entries(domains)){const found=links.find(a=>doms.some(d=>a.href.includes(d)&&!a.href.includes('/share')&&!a.href.includes('/intent')));if(found){const h=found.href;const handle=h.split('/').filter(Boolean).pop()||null;profiles[platform]={url:h.slice(0,120),handle:handle?handle.split('?')[0].slice(0,40):null}}}const og=document.querySelector('meta[property="og:url"]');const canonical=document.querySelector('link[rel="canonical"]');return{profiles,pageUrl:og?og.getAttribute('content'):'',canonicalUrl:canonical?canonical.getAttribute('href'):''} })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getSocialState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const socialDomains=['twitter.com','x.com','instagram.com','facebook.com','tiktok.com','linkedin.com','youtube.com','github.com','pinterest.com','snapchat.com'];const links=Array.from(document.querySelectorAll('a[href]'));const socialLinks=links.filter(a=>socialDomains.some(d=>a.href.includes(d)));const networksFound=new Set(socialLinks.map(a=>{const d=socialDomains.find(d=>a.href.includes(d));return d?d.split('.')[0]:'other'}));const hasSocialMeta=!!(document.querySelector('meta[property^="og:"]')||document.querySelector('meta[name^="twitter:"]'));const hasOG=!!document.querySelector('meta[property="og:title"]');return{hasSocialLinks:socialLinks.length>0,socialLinkCount:socialLinks.length,hasSocialMeta,hasOpenGraph:hasOG,socialNetworkCount:networksFound.size,networksDetected:Array.from(networksFound)} })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getOpenGraphMeta2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const metas=Array.from(document.querySelectorAll('meta[property^="og:"],meta[name^="og:"]'));const out={};for(const m of metas){const key=m.getAttribute('property')||m.getAttribute('name')||'';const val=(m.getAttribute('content')||'').slice(0,200);if(key)out[key]=val}return out })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getTwitterCardMeta2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const metas=Array.from(document.querySelectorAll('meta[name^="twitter:"]'));const out={};for(const m of metas){const key=m.getAttribute('name')||'';const val=(m.getAttribute('content')||'').slice(0,200);if(key)out[key]=val}return out })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getSocialApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const scripts=Array.from(document.querySelectorAll('script[src],script')).map(s=>((s.src||s.textContent||'').toLowerCase()));const hasTwitterWidget=scripts.some(s=>s.includes('platform.twitter.com')||s.includes('widgets.js')||typeof window.twttr!=='undefined');const hasFacebookSdk=scripts.some(s=>s.includes('connect.facebook.net')||s.includes('fbevents.js'))||typeof window.FB!=='undefined';const hasLinkedInInsight=scripts.some(s=>s.includes('snap.licdn.com')||s.includes('linkedin/insight'));const hasInstagramEmbed=scripts.some(s=>s.includes('instagram.com/embed'))||document.querySelector('blockquote[class*="instagram-media"]')!==null;const hasTikTokPixel=scripts.some(s=>s.includes('analytics.tiktok.com')||s.includes('tiktok-pixel'))||typeof window.ttq!=='undefined';const hasPinterestTag=scripts.some(s=>s.includes('pintrk')||s.includes('ct.pinterest.com'))||typeof window.pintrk!=='undefined';const hasSnapchatPixel=scripts.some(s=>s.includes('tr.snapchat.com')||s.includes('snap-pixel'));return{hasTwitterWidget,hasFacebookSdk,hasLinkedInInsight,hasInstagramEmbed,hasTikTokPixel,hasPinterestTag,hasSnapchatPixel} })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}
