export async function getMapElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="map"],[id*="map"],[class*="leaflet"],[class*="mapbox"],[class*="google-map"],[data-map]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getGoogleMapsIframes(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('iframe')).filter(f=>f.src&&f.src.includes('google.com/maps')).slice(0,10).map(f=>({src_preview:f.src.slice(0,100),width:f.width,height:f.height,title_preview:(f.title||'').slice(0,60)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getLeafletMaps(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return{hasLeaflet:typeof window.L!=='undefined',leafletVersion:window.L?window.L.version||null:null,count:document.querySelectorAll('[class*="leaflet-container"]').length} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getMapboxMaps(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return{hasMapbox:typeof window.mapboxgl!=='undefined',count:document.querySelectorAll('.mapboxgl-map,.maplibre-map,[class*="mapbox"]').length} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getMapMarkers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="marker"],[class*="pin"],[class*="map-pin"],[class*="leaflet-marker"],[class*="mapboxgl-marker"],[data-marker]';return Array.from(document.querySelectorAll(sel)).slice(0,30).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),ariaLabel_preview:(el.getAttribute('aria-label')||'').slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getMapControls(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="zoom"],[class*="leaflet-control"],[class*="mapboxgl-ctrl"],[class*="map-control"],[class*="map-toolbar"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getCoordinateData(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[data-lat],[data-lng],[data-latitude],[data-longitude],[data-coords]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,lat:el.getAttribute('data-lat')||el.getAttribute('data-latitude'),lng:el.getAttribute('data-lng')||el.getAttribute('data-longitude'),class_preview:(el.className||'').toString().slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getGeoJsonData(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const scripts=Array.from(document.querySelectorAll('script'));const geo=scripts.filter(s=>s.type==='application/geo+json'||s.textContent.includes('"FeatureCollection"')||s.textContent.includes('"Feature"'));return{count:geo.length,hasGeoJson:geo.length>0} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
