// datepicker2.ts — Date/time picker UI component inspection

export async function getDateInputs2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var inputs = Array.from(document.querySelectorAll('input[type="date"], input[type="datetime-local"], input[type="month"], input[type="week"]'));
      return inputs.slice(0, 20).map(function(el) {
        return {
          type: el.type,
          id: el.id || null,
          name: el.name || null,
          value: el.value || null,
          min: el.min || null,
          max: el.max || null,
          disabled: el.disabled,
          readOnly: el.readOnly,
          required: el.required,
          placeholder: el.placeholder || null,
          visible: el.offsetParent !== null
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getDatePickerElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var selectors = [
        '[class*="datepicker"]',
        '[class*="date-picker"]',
        '[class*="DatePicker"]',
        '[data-datepicker]',
        '[role="dialog"][aria-label*="date" i]',
        '[role="dialog"][aria-label*="calendar" i]',
        '[class*="react-datepicker"]',
        '[class*="flatpickr"]',
        '[class*="pikaday"]',
        '[class*="mui-datepicker"]',
        '[class*="ant-picker"]',
        '[class*="dp__"]'
      ];
      var seen = new Set();
      var results = [];
      for (var s = 0; s < selectors.length && results.length < 20; s++) {
        var els = Array.from(document.querySelectorAll(selectors[s]));
        for (var i = 0; i < els.length && results.length < 20; i++) {
          if (!seen.has(els[i])) {
            seen.add(els[i]);
            var el = els[i];
            results.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className ? el.className.toString().slice(0, 80) : null,
              role: el.getAttribute('role') || null,
              ariaLabel: el.getAttribute('aria-label') || null,
              visible: el.offsetParent !== null,
              matchedSelector: selectors[s]
            });
          }
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getCalendarElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var selectors = [
        '[role="grid"]',
        '[class*="calendar"]',
        '[class*="Calendar"]',
        'table[class*="cal"]',
        '[class*="month-view"]',
        '[class*="monthview"]',
        '[class*="cal-grid"]',
        '[class*="date-grid"]',
        '[aria-label*="calendar" i]',
        '[class*="flatpickr-calendar"]',
        '[class*="pika-table"]',
        '[class*="react-calendar"]'
      ];
      var seen = new Set();
      var results = [];
      for (var s = 0; s < selectors.length && results.length < 20; s++) {
        var els = Array.from(document.querySelectorAll(selectors[s]));
        for (var i = 0; i < els.length && results.length < 20; i++) {
          if (!seen.has(els[i])) {
            seen.add(els[i]);
            var el = els[i];
            var cells = el.querySelectorAll('td, [role="gridcell"], [class*="day"]');
            results.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className ? el.className.toString().slice(0, 80) : null,
              role: el.getAttribute('role') || null,
              ariaLabel: el.getAttribute('aria-label') || null,
              cellCount: cells.length,
              visible: el.offsetParent !== null,
              matchedSelector: selectors[s]
            });
          }
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getTimeInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var nativeInputs = Array.from(document.querySelectorAll('input[type="time"]'));
      var widgetSelectors = [
        '[class*="timepicker"]',
        '[class*="time-picker"]',
        '[class*="TimePicker"]',
        '[class*="flatpickr-time"]',
        '[aria-label*="time" i][role]',
        '[class*="clock"]',
        '[class*="hour"]',
        '[class*="minute"]'
      ];
      var results = nativeInputs.slice(0, 10).map(function(el) {
        return {
          source: 'native',
          type: el.type,
          id: el.id || null,
          name: el.name || null,
          value: el.value || null,
          min: el.min || null,
          max: el.max || null,
          step: el.step || null,
          disabled: el.disabled,
          visible: el.offsetParent !== null
        };
      });
      var seen = new Set(nativeInputs);
      for (var s = 0; s < widgetSelectors.length && results.length < 20; s++) {
        var els = Array.from(document.querySelectorAll(widgetSelectors[s]));
        for (var i = 0; i < els.length && results.length < 20; i++) {
          if (!seen.has(els[i])) {
            seen.add(els[i]);
            var el = els[i];
            results.push({
              source: 'widget',
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className ? el.className.toString().slice(0, 80) : null,
              ariaLabel: el.getAttribute('aria-label') || null,
              visible: el.offsetParent !== null,
              matchedSelector: widgetSelectors[s]
            });
          }
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getDateRangeInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var selectors = [
        '[class*="daterange"]',
        '[class*="date-range"]',
        '[class*="DateRange"]',
        '[class*="range-picker"]',
        '[class*="RangePicker"]',
        '[class*="ant-picker-range"]',
        '[class*="flatpickr"][class*="range"]',
        '[data-mode="range"]',
        '[aria-label*="date range" i]',
        '[aria-label*="start date" i]',
        '[aria-label*="end date" i]',
        '[class*="dp__range"]'
      ];
      var seen = new Set();
      var results = [];
      for (var s = 0; s < selectors.length && results.length < 20; s++) {
        var els = Array.from(document.querySelectorAll(selectors[s]));
        for (var i = 0; i < els.length && results.length < 20; i++) {
          if (!seen.has(els[i])) {
            seen.add(els[i]);
            var el = els[i];
            var inputs = el.querySelectorAll('input');
            results.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className ? el.className.toString().slice(0, 80) : null,
              ariaLabel: el.getAttribute('aria-label') || null,
              inputCount: inputs.length,
              inputValues: Array.from(inputs).slice(0, 4).map(function(inp) { return inp.value || null; }),
              visible: el.offsetParent !== null,
              matchedSelector: selectors[s]
            });
          }
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getDatePickerState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var hasNativeDateInput = document.querySelectorAll('input[type="date"], input[type="datetime-local"], input[type="month"], input[type="week"]').length > 0;
      var customPickerSelectors = '[class*="datepicker"],[class*="date-picker"],[class*="DatePicker"],[class*="react-datepicker"],[class*="flatpickr"],[class*="pikaday"],[class*="ant-picker"],[class*="dp__"]';
      var hasCustomPicker = document.querySelectorAll(customPickerSelectors).length > 0;
      var calendarSelectors = '[role="grid"],[class*="calendar"],[class*="Calendar"],[class*="flatpickr-calendar"],[class*="pika-table"],[class*="react-calendar"]';
      var hasCalendar = document.querySelectorAll(calendarSelectors).length > 0;
      var timeSelectors = 'input[type="time"],[class*="timepicker"],[class*="time-picker"],[class*="TimePicker"],[class*="flatpickr-time"]';
      var hasTimeInput = document.querySelectorAll(timeSelectors).length > 0;
      var rangeSelectors = '[class*="daterange"],[class*="date-range"],[class*="DateRange"],[class*="range-picker"],[class*="RangePicker"],[class*="ant-picker-range"],[data-mode="range"],[class*="dp__range"]';
      var hasDateRange = document.querySelectorAll(rangeSelectors).length > 0;
      return {
        hasNativeDateInput: hasNativeDateInput,
        hasCustomPicker: hasCustomPicker,
        hasCalendar: hasCalendar,
        hasTimeInput: hasTimeInput,
        hasDateRange: hasDateRange
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getDatePickerTriggers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var selectors = [
        '[aria-label*="date" i][role="button"]',
        '[aria-label*="calendar" i][role="button"]',
        '[aria-label*="pick" i][role="button"]',
        'button[class*="datepicker"]',
        'button[class*="date-picker"]',
        'button[class*="calendar"]',
        '[class*="date-toggle"]',
        '[class*="picker-toggle"]',
        '[class*="flatpickr-input"]',
        'input[class*="datepicker"]',
        'input[class*="date-picker"]',
        'svg[class*="calendar"]',
        'svg[aria-label*="calendar" i]',
        'i[class*="calendar"]',
        'i[class*="date"]'
      ];
      var seen = new Set();
      var results = [];
      for (var s = 0; s < selectors.length && results.length < 20; s++) {
        var els = Array.from(document.querySelectorAll(selectors[s]));
        for (var i = 0; i < els.length && results.length < 20; i++) {
          if (!seen.has(els[i])) {
            seen.add(els[i]);
            var el = els[i];
            var rect = el.getBoundingClientRect();
            results.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className ? el.className.toString().slice(0, 80) : null,
              role: el.getAttribute('role') || null,
              ariaLabel: el.getAttribute('aria-label') || null,
              ariaExpanded: el.getAttribute('aria-expanded') || null,
              ariaHasPopup: el.getAttribute('aria-haspopup') || null,
              textContent: el.textContent ? el.textContent.trim().slice(0, 40) : null,
              disabled: el.disabled || false,
              visible: el.offsetParent !== null,
              boundingBox: rect.width > 0 ? { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } : null,
              matchedSelector: selectors[s]
            });
          }
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getDatePickerApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var hasFlatpickr = typeof window.flatpickr !== 'undefined'
        || document.querySelectorAll('[class*="flatpickr"]').length > 0
        || !!document.querySelector('link[href*="flatpickr"], script[src*="flatpickr"]');
      var hasDatepickerJs = typeof window.datepicker !== 'undefined'
        || !!document.querySelector('script[src*="datepicker.js"], script[src*="datepicker.min.js"]')
        || document.querySelectorAll('[class*="qs-datepicker"]').length > 0;
      var hasPikaday = typeof window.Pikaday !== 'undefined'
        || document.querySelectorAll('[class*="pika-"]').length > 0
        || !!document.querySelector('script[src*="pikaday"]');
      var hasReactDatepicker = document.querySelectorAll('[class*="react-datepicker"]').length > 0
        || !!document.querySelector('link[href*="react-datepicker"], script[src*="react-datepicker"]');
      var hasMuiDatepicker = document.querySelectorAll('[class*="MuiDatePicker"], [class*="MuiPickersDay"], [class*="MuiCalendarPicker"]').length > 0
        || !!document.querySelector('script[src*="@mui/x-date-pickers"]');
      return {
        hasFlatpickr: hasFlatpickr,
        hasDatepickerJs: hasDatepickerJs,
        hasPikaday: hasPikaday,
        hasReactDatepicker: hasReactDatepicker,
        hasMuiDatepicker: hasMuiDatepicker
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}
