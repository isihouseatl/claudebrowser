export async function getCalendarElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="calendar"],[id*="calendar"],[class*="datepicker"],[class*="date-picker"],[class*="flatpickr"],[class*="pikaday"],[class*="react-calendar"],[data-calendar]';return Array.from(document.querySelectorAll(sel)).slice(0,10).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getDatePickerInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('input[type="date"],input[type="datetime-local"],input[type="month"],input[type="week"]')).slice(0,20).map(el=>({id:el.id||null,name:el.name||null,type:el.type,value:el.value||null,min:el.min||null,max:el.max||null,class_preview:(el.className||'').slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getCalendarNavigation(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const all=Array.from(document.querySelectorAll('button,[role="button"],a'));return all.filter(el=>{const c=(el.className||'').toString().toLowerCase();const t=(el.textContent||'').toLowerCase().trim();const a=(el.getAttribute('aria-label')||'').toLowerCase();return c.includes('prev-month')||c.includes('next-month')||c.includes('calendar-prev')||c.includes('calendar-next')||a.includes('previous month')||a.includes('next month')}).slice(0,10).map(el=>{const c=(el.className||'').toString().toLowerCase();const a=(el.getAttribute('aria-label')||'').toLowerCase();const dir=c.includes('prev')||a.includes('prev')?'prev':'next';return{tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,20),direction:dir}}) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getCalendarDays(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const days=document.querySelectorAll('[class*="calendar-day"],[class*="day-cell"],[class*="flatpickr-day"],[class*="pikaday__day"]');return{totalDays:days.length,selectedDays:Array.from(days).filter(d=>d.classList.contains('selected')||d.getAttribute('aria-selected')==='true').length,todayCell:!!document.querySelector('[class*="today"],[aria-current="date"]'),disabledDays:Array.from(days).filter(d=>d.classList.contains('disabled')||d.getAttribute('aria-disabled')==='true').length} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getSelectedDates(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('input[type="date"],input[type="datetime-local"],input[type="month"]')).filter(el=>el.value).slice(0,10).map(el=>({inputId:el.id||null,value:el.value,type:el.type})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getEventCalendars(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return{hasFullCalendar:typeof window.FullCalendar!=='undefined'||document.querySelectorAll('[class*="fc-"],[class*="fullcalendar"]').length>0,hasEventCalendar:document.querySelectorAll('[class*="event-calendar"],[class*="events-calendar"]').length>0,containerCount:document.querySelectorAll('[class*="calendar-container"],[class*="cal-container"]').length} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getTimePickerInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('input[type="time"]')).slice(0,20).map(el=>({id:el.id||null,name:el.name||null,value:el.value||null,min:el.min||null,max:el.max||null})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getDateRangePickers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="date-range"],[class*="daterange"],[class*="range-picker"],[data-rangepicker]';return Array.from(document.querySelectorAll(sel)).slice(0,10).map(el=>{const inputs=el.querySelectorAll('input[type="date"],input[type="text"]');return{tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),startValue:inputs[0]?inputs[0].value||null:null,endValue:inputs[1]?inputs[1].value||null:null}}) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
