// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CdpClient } from './cdp/client';
import { listTabs, listSessionTabs, newTab, closeTab, activateTab } from './cdp/tabs';
import { generateSessionId, registerSession, unregisterSession, pruneDeadSessions, getAllSessions } from './session';
import { navigate, reload, goBack, goForward, scroll, waitForSelector, waitForNetworkIdle, waitForUrl, scrollToElement, setViewport, printToPDF, waitForNewTab, getPageMetrics, getUrl, getTitle, waitForElementRemoved, waitForText, getScrollPosition, scrollToCoords, scrollToTop, scrollToBottom, waitForAttribute, waitForElementCount, getPageSource, getHistoryLength, goToHistoryIndex, scrollIntoView, getMetaTags, getLinkTags, getReadyState, waitForDOMContentLoaded } from './cdp/page';
import { clickAt, clickSelector, typeText, pressKey, keyChord, setValue, hoverAt, hoverSelector, handleDialog, uploadFile, doubleClickAt, clearInput, rightClickAt, dragAndDrop, focusElement, blurActiveElement, getFormValues, setRangeValue, setDateValue, setColorValue, setSelectionRange, tapAt, swipeAt, pinchZoom } from './cdp/input';
import { takeScreenshot, getAccessibilityTree, getDom } from './cdp/capture';
import { evaluate, getNetworkRequests, startNetworkMonitor, resetNetworkMonitor, startConsoleMonitor, resetConsoleMonitor, getConsoleMessages, clearNetworkLog, clearConsoleLog, evaluateOnElement, getWindowGlobals } from './cdp/evaluate';
import { checkAllAuth, waitForAuth, AUTH_PRESETS } from './cdp/auth';
import { getText, getAttribute, isVisible, findText, getAllText, getAllAttributes } from './cdp/query';
import { startFrameMonitor, getFrames, evaluateInFrame, switchToFrame, switchToMainFrame } from './cdp/frame';
import { applyStealthPatches, applySocialStealth } from './cdp/stealth';
import { getCookies, setCookie, deleteCookies, clearAllCookies, getLocalStorage, setLocalStorage, removeLocalStorage, getAllLocalStorage, clearLocalStorage, getSessionStorage, setSessionStorage, removeSessionStorage, getAllSessionStorage, clearSessionStorage } from './cdp/storage';
import { waitForResponse, interceptRequest, clearInterceptions, getResponseBody, setExtraHeaders, clearExtraHeaders, blockUrls, clearBlockedUrls, enableCorsOverride, startHeaderCapture, stopHeaderCapture, getResponseHeaders, waitForNetworkQuiet, blockNextRequest } from './cdp/network';
import { isEnabled, isChecked, getBoundingBox, countElements, getComputedStyle as getElementComputedStyle, selectOption as elementSelectOption, getSelectOptions } from './cdp/element';
import { startConsoleMonitor as startCdpConsole, getConsoleMessages as getCdpConsoleMessages, clearConsoleMessages as clearCdpConsoleMessages, getJsErrors, clearJsErrors, stopConsoleMonitor as stopCdpConsole } from './cdp/console';
import { startNetworkLog, getNetworkLog, clearNetworkLog as clearNetLog, stopNetworkLog } from './cdp/netlog';
import { setUserAgent, setDeviceMetrics, clearDeviceMetrics, setNetworkConditions, clearNetworkConditions, setGeolocation, clearGeolocation, grantPermission, resetPermissions, setMediaType, setColorScheme, setPrefersReducedMotion } from './cdp/emulation';
import { getSecurityInfo, hasMixedContent, getCSPInfo, getThirdPartyDomains, isSecureContext } from './cdp/security';
import { listCacheNames, getCacheEntries, deleteCache, deleteCacheEntry, clearAllCaches, getStorageQuota, getStorageBreakdown } from './cdp/cache';
import { getZIndex, getElementsAtPoint, getPixelColor, getColors, highlightElement, removeHighlight, doElementsOverlap, getFontInfo } from './cdp/visual';
import { getInnerHtml, getTableData, screenshotElement } from './cdp/extract';
import { queryShadow, getShadowHtml, evaluateInShadow, getShadowHosts, getShadowRoot as getShadowRootInfo, queryShadowRoot as queryShadowRoot2, getShadowChildren as getShadowChildren2, isShadowHost, getShadowSlots as getShadowSlots2, getShadowCssVars, getShadowDepth } from './cdp/shadow';
import { setAttribute, removeAttribute, addClass, removeClass, injectCss, removeInjectedCss, submitForm, resetForm } from './cdp/dom';
import { writeClipboardText, getClipboardText as getClipboardTextV2, copyElementText, getSelectedText as getSelectedTextV2, selectAllText, clearSelection as clearPageSelection, isClipboardSupported } from './cdp/clipboard';
import { listIndexedDatabases, getAllIndexedDb, getIndexedDb, clearIndexedDb } from './cdp/indexeddb';
import { getPaintTiming, getNavigationTiming, getResourceTimings, clearPerformanceBuffer } from './cdp/performance';
import { startWebSocketLog, getWebSocketMessages, getWebSocketConnections, clearWebSocketLog, stopWebSocketLog } from './cdp/websocket';
import { startCssCoverage, stopCssCoverage, startJsCoverage, takeJsCoverage, stopJsCoverage } from './cdp/coverage';
import { listServiceWorkers, unregisterServiceWorker, updateServiceWorker, isControlledByServiceWorker } from './cdp/serviceworker';
import { getPageSnapshot } from './cdp/snapshot';
import { startMutationObserver, getMutations, clearMutations, stopMutationObserver, stopAllMutationObservers, waitForMutation } from './cdp/mutation';
import { getMediaElements, playMedia, pauseMedia, seekMedia, setMediaVolume, setMediaMuted, setPlaybackRate, waitForMediaReady } from './cdp/media';
import { dispatchEvent as dispatchDomEvent, triggerReactChange, waitForEvent, getPerformanceMarks, setPerformanceMark, measurePerformance } from './cdp/events';
import { getAllTabSnapshots, findTabsByUrl, duplicateTab, getTabInfo, waitForTabLoad } from './cdp/tabstate';
import { startDownloadMonitor, getDownloads, clearDownloads, stopDownloadMonitor, waitForDownload } from './cdp/download';
import { getAxSubtree, getFocusedElement, getInteractiveAxNodes, getLiveRegions } from './cdp/accessibility';
import { waitForDialog, isDialogOpen, dismissPrintDialog } from './cdp/dialog';
import { listIframes, evaluateInIframe, getIframeContent, clickInIframe, typeInIframe, waitForIframe, getIframes, getIframeCount, isIframeSandboxed, getIframeSrc, setIframeSrc, scrollIframeIntoView, getIframePosition, isIframeVisible } from './cdp/iframe';
import { fillForm, detectFormFields, submitForm as autofillSubmitForm, clearForm, getFormState } from './cdp/autofill';
import { waitForAny, waitForAll, waitForCondition, waitForStable, waitForValueChange, waitForCountChange, retryUntilSuccess } from './cdp/waiters';
import { mousePath, smoothDrag, dragSelector, hoverSequence, multiClick, contextClickAt, middleClickAt, getMousePosition, getPointerEvents, simulatePointerDown, simulatePointerUp, simulatePointerMove, simulatePointerCancel, simulatePointerEnter, getPointerCapture, getTouchActionStyle } from './cdp/pointer';
import { startRecording, stopRecording, getRecordedActions, clearRecording, isRecording } from './cdp/recorder';
import { findByLabel, findByPlaceholder, findButton, findByRole, findByText, findNearLabel, getElementSelector } from './cdp/finder';
import { scrollUntilVisible, scrollUntilText, scrollContainer, scrollContainerToEnd, getContainerScrollState, infiniteScrollUntil, smoothScrollTo } from './cdp/scroll2';
import { waitForToast, getToasts, waitForToastContaining, dismissToast, interceptBrowserNotification, getCapturedNotifications, clearCapturedNotifications, waitForBannerChange, getNotificationPermission, isNotificationSupported, getPageVisibility, isPageVisible, getDocumentReadyState, getPageCharset, getDocumentMode, getLastModified } from './cdp/notify';
import { clickTableHeader, getTableRowCount, getTableColumnValues, findTableRow, clickTableCell, getTableColumn, getTableHeaders, filterTableRows } from './cdp/table2';
import { findFileInputs, setFilesOnInput, waitForUploadComplete, getUploadProgress, simulateDragDropFile, clickAndUpload } from './cdp/upload2';
import { getViewportElements, isInViewport, getElementCenter, getRelativePosition, getElementsInRegion, getPageDimensions, getLayoutShift, getAbsolutePosition } from './cdp/layout';
import { getElementObstruction, getClickableState, getEventListeners, getPageDiagnostic, findStaleElements, getComputedProperties, checkVisibility } from './cdp/debug';
import { getAnimations, getElementAnimations, pauseAllAnimations, resumeAllAnimations, setAnimationSpeed, finishAllAnimations, cancelElementAnimations, waitForAnimationsFinished } from './cdp/animations';
import { getCanvasElements, canvasToDataUrl, getCanvasDimensions, getCanvasPixelColor, clearCanvas, drawTextOnCanvas, drawRectOnCanvas, canvasEquals } from './cdp/canvas';
import { findTextMatches, countTextOccurrences, getSelectedText, selectAllTextInElement, highlightAllText, clearHighlights, replaceTextInElement, scrollToText } from './cdp/search';
import { setGeolocationCoords, setGeolocationCity, clearGeolocationOverride, getCurrentGeolocation, setTimezone, getTimezone, setLocale, getLocale } from './cdp/geolocation2';
import { setDevicePreset, setCustomViewport, getViewportSize, resetViewport, checkMediaQuery, getActiveBreakpoints, responsiveScreenshots, findHorizontalOverflow } from './cdp/responsive';
import { hashString, hashElementContent, generateUuid, randomBytes, randomInt, base64Encode, base64Decode, hmacSha256 } from './cdp/crypto2';
import { getWebVitals, getNavigationTiming2, getSlowResources, getTimeToInteractive, getRenderBlockingResources, getMemoryUsage, getDomNodeCount, getLoadTimeline } from './cdp/pageload';
import { getWorkerList, evaluateInWorker, getWorkerCount, terminateWorker, getDedicatedWorkers, getWorkerByUrl, waitForWorker, postMessageToWorker } from './cdp/workers';
import { countRecords, getRecord, putRecord, deleteRecord, getAllKeys, queryRecords, getObjectStoreNames, clearObjectStore } from './cdp/indexeddb2';
import { getPageFonts, getElementFont, findElementsByFont, getFontStack, checkFontLoaded, getLoadedFonts, waitForFontsReady, getFontMetrics } from './cdp/fonts';
import { denyPermission, checkPermission, grantGeolocation, grantNotifications, grantClipboardAccess, getPermissionState } from './cdp/permissions';
import { getCssVariables, setCssVariable, getStylesheets, getMatchingRules, getInlineStyle, setInlineStyle, removeInlineStyle, getUsedCssProperties } from './cdp/css';
import { getSelectionRange, selectText, clearSelection, getCaretPosition, setCaretInElement, copySelectionToClipboard } from './cdp/selection';
import { touchTap, touchDoubleTap, touchLongPress, touchSwipe, touchPinch, touchScroll, touchDrag, getTouchSupport } from './cdp/touch';
import { setDarkMode, setLightMode, clearColorScheme, getColorScheme, setContrastPreference, getThemeColors, takeThemeScreenshots } from './cdp/darkmode';
import { printToPdfBuffer, getPageCount, getPrintableArea, setPageTitle, injectPrintStyle, removePrintStyles, getPrintCssRules, printPageToHtml } from './cdp/printing';
import { getFullPageDimensions, getVisibleRect, isElementFullyVisible, getElementVisibilityRatio, getOffScreenElements, getScrollableElements, getElementScrollPosition, getScrollPosition as getScrollPosition2, getViewportSize as getViewportSize2, getDocumentSize, scrollTo as scrollToWindow, scrollBy as scrollByWindow, scrollToElement as scrollToElement2, isElementInViewport } from './cdp/viewport2';
import { sleep, measureDuration, waitUntilIdle, waitForExpressionTrue, debounceEvaluate, retryEvaluate, getHighResolutionTime, measureExpressionTime } from './cdp/timing';
import { xpathFirst, xpathAll, xpathCount, xpathText, xpathExists, xpathClick, xpathGetAttribute, xpathWaitFor } from './cdp/xpathquery';
import { getClipboardText, setClipboardText, getClipboardHtml, clearClipboard, copyTextToClipboard, pasteTextAtCursor, getClipboardItemTypes, copyElementHtml } from './cdp/clipboard2';
import { highlightElements, removeHighlights, highlightWithLabel, flashElement, getBoundingBoxes, drawOverlay, removeOverlay, clearAllOverlays } from './cdp/highlight2';
import { typeWithDelay, clearAndType, pressKeyCombo, fillInputByLabel, checkCheckbox, uncheckCheckbox, selectRadio, typeIntoContentEditable } from './cdp/input3';
import { getPageLanguage, getCharset, getCanonicalUrl, getOpenGraphTags, getTwitterCardTags, getStructuredData, getPageWordCount, getExternalLinks } from './cdp/pageinfo';
import { getNetworkTimings, getLargestRequests, getFailedRequests, getRequestCount, getServiceWorkerInfo, getPageProtocol, getDnsLookupTime, getCachedRequests, getResourceTimings as getResourceTimings2, getResourcesByType, getLargestResources, getCachedResources, getTotalTransferSize, getFailedResources as getFailedResources2, clearResourceTimings, getNavigationTimingBasic } from './cdp/network2';
import { getLocalStorageSize, searchLocalStorage, getSessionStorageSize, dumpAllStorage, getCookieCount, getCookieDomains, getStorageEstimate, clearOriginStorage } from './cdp/storage2';
import { createElement, removeElement, wrapElement, unwrapElement, cloneElement, moveElement, setElementText, getElementCount } from './cdp/dom2';
import { isModalOpen, getModalContent, closeModal, waitForModal, getModalButtons, clickModalButton, isOverlayBlocking, dismissOverlay, detectModals, getOverlayElements, hasBackdrop, closeModalByEscape, clickModalCloseButton, getPopoverElements, countZIndexLayers } from './cdp/modal';
import { getUrlParts, getQueryParams, setQueryParam, removeQueryParam, getHashFragment, setHashFragment, navigateToHash, getNavigationHistory } from './cdp/url2';
import { getFullTableData, getTableRowData, getTableCellText, sortTableByColumn, getTablePageInfo, exportTableAsCsv, getSelectedTableRows, highlightTableRow } from './cdp/table3';
import { setGeolocationAccuracy, simulateMovement, setHighAccuracyMode, setLowAccuracyMode, setBatteryLevel, clearBatteryOverride, setScreenOrientation, clearScreenOrientation } from './cdp/geolocation3';
import { takeFullPageScreenshot, takeViewportScreenshot, takeRegionScreenshot, takeJpegScreenshot, compareScreenshots, getFullPageDimensions2, takeScreenshotAfterDelay, screenshotSelector } from './cdp/capture2';
import { getScrollDepth, isScrolledToBottom, isScrolledToTop, getScrollableParent, scrollByAmount, scrollElementBy, getScrollbarWidth, scrollToPercent } from './cdp/scroll3';
import { getFocusedSelector, tabToNext, tabToPrev, getFocusableElements, trapFocusInElement, isFocusTrapped, releaseFocusTrap, focusNthElement } from './cdp/focus';
import { findElementsByText, getPageTextBlocks, findByRegex, getHeadings, getParagraphs, getListItems, countWords, extractEmails } from './cdp/search2';
import { getBrowserInfo, getScreenInfo, isMobileDevice, isTouchDevice, getMediaCapabilities, getFeatureSupport, getNetworkType, getTimeInfo } from './cdp/device';
import { startWatchdog, stopWatchdog } from './chrome';
import { getFormFields, getFormValidationErrors, isFormValid, getRequiredFields, getEmptyRequiredFields, listSelectOptions, setMultipleSelectValues, getCheckedCheckboxes } from './cdp/form2';
import { getVideoState, muteMedia, unmuteMedia, getAllMediaElements, playMedia as playMedia2, pauseMedia as pauseMedia2, setMediaVolume as setMediaVolume2, seekMedia as seekMedia2, getMediaState } from './cdp/media2';
import { pauseAnimations, playAnimations, getTransitions, getAnimationCount, setAnimationPlaybackRate, getPageAnimationCount, cancelAnimations } from './cdp/animation';
import { getAriaAttributes, getRole, getTabIndex, checkImageAlts, getHeadingStructure, getLandmarks, getAriaLabelledBy } from './cdp/accessibility2';
import { checkEventHandlers, dispatchCustomEvent, triggerMouseEvent, triggerKeyEvent, triggerInputEvent, triggerFocusEvent, waitForDomMutation, getFormSubmitUrl } from './cdp/events2';
import { getPerformanceEntries, getNavigationTiming as getNavigationTiming3, getResourceTimings as getResourceTimings3, getLongTasks, getMemoryInfo, getCLS, getFCP, getLCP } from './cdp/performance2';
import { hasShadowRoot, getShadowChildren, queryShadowRoot, getShadowRootMode, getShadowHostContent, countShadowRoots, getShadowHostElements, getShadowSlots } from './cdp/shadow-dom';
import { getComputedColor, getCssVariables as getCssVariables2, setCssVariable as setCssVariable2, getElementClasses, toggleClass, getComputedProperty, setInlineStyle as setInlineStyle2, getStylesheetCount } from './cdp/css2';
import { waitForElementAdded, waitForElementRemoved as waitForElementRemoved2, waitForTextChange, waitForClassChange, getIntersectionRatio, waitForValueChange as waitForValueChange2, getResizeInfo, waitForAttributeChange } from './cdp/observer';
import { getDraggableElements, getDropZones, simulateDragStart, simulateDragEnd, simulateDragEnter, simulateDragOver, simulateDrop, isDraggable } from './cdp/drag2';
import { getDialogElements, getOpenDialogs, openDialog, closeDialog, getDialogReturnValue, isDialogOpen as isDialogOpenEl, getActiveModals, clickDialogButton } from './cdp/dialog2';
import { getCanvasElements as getCanvasElements2, getCanvasSize, clearCanvas as clearCanvas2, getCanvasDataUrl, drawRectOnCanvas as drawRectOnCanvas2, getCanvasPixelColor as getCanvasPixelColor2, isWebGLCanvas, getCanvasCount } from './cdp/canvas2';
import { getDomContentLoadedTime, getLoadEventTime, getTimeToFirstByte, getPageTimingSummary, getFirstPaint, getFirstContentfulPaint, getResourceCount, getSlowResources as getSlowResources2 } from './cdp/timing2';
import { setGeolocation as setGeolocationNew, clearGeolocation as clearGeolocationNew, getGeolocationPermission, isGeolocationSupported, setDeviceOrientation, getTimezone as getTimezoneInfo, setTimezoneOverride, getLocale as getLocaleInfo } from './cdp/geolocation';
import { isWorkerSupported, isSharedWorkerSupported, getWorkerCount as getWorkerCountStatus, injectWorkerRegistry, postMessageToSharedWorker, isBroadcastChannelSupported, getWorkerRegistryEntries, clearWorkerRegistry } from './cdp/worker';
import { getAriaRoles, getAriaLabels, getAriaDescriptions, getLandmarkElements, getTabOrder, getFocusableElements as getFocusableElements2, getAriaExpanded, getAriaHidden } from './cdp/a11y2';
import { getHistoryLength as getHistoryLength2, goBack as goBackNav, goForward as goForwardNav, goTo, getCurrentUrl, getPageTitle, pushHistoryState, replaceHistoryState } from './cdp/history';
import { dispatchCustomEvent as dispatchCustomEvent2, dispatchWindowEvent, getEventListenerCount, triggerInputEvent as triggerInputEvent2, triggerChangeEvent, triggerFocusEvent as triggerFocusEvent2, triggerBlurEvent, triggerSubmitEvent } from './cdp/event2';
import { getTableCount, getTableHeaders as getTableHeaders3, getTableRowCount as getTableRowCount2, getTableCellCount, getTableRow, getTableCell, getTableData as getTableData2, getTableSummary } from './cdp/table';
import { getAllLinks, getExternalLinks as getExternalLinks2, getInternalLinks, getLinkCount, getLinksWithRel, getMailtoLinks, getTelLinks, getAnchorLinks } from './cdp/link';
import { getAllImages, getBrokenImages, getImageCount, getLazyImages, getImagesWithoutAlt, getSvgElements, getPictureElements, getImageDimensions } from './cdp/image2';
import { getAllInputs, getRequiredInputs, getDisabledInputs, getInputValues, setInputValue, clearInputValue, getCheckboxState, setCheckboxState } from './cdp/input2';
import { getMetaDescription, getMetaKeywords, getMetaRobots, getMetaViewport, getCanonicalUrl as getCanonicalUrl2, getHreflangTags, getJsonLdSchemas, getHeadingStructure as getHeadingStructure2 } from './cdp/meta2';
import { getComputedFont, getLoadedFonts as getLoadedFonts2, getFontFaces, getElementFontSize, getElementFontFamily, getTextStyles, countDistinctFonts, isFontLoaded } from './cdp/font';
import { getCdpMetrics, getJsHeapSize, getDomNodeCount as getDomNodeCount2, getEventListenerTotal, markPerformance as markPerformance2, measurePerformance as measurePerformance2, clearPerformanceMarks, getPerformanceMarks as getPerformanceMarks2 } from './cdp/perf2';
import { getLocalStorageKeys, getSessionStorageKeys, getLocalStorageSizeInfo, wipeLocalStorage, wipeSessionStorage, getIndexedDBDatabases, getCookieCountInfo, getStorageQuota as getStorageQuotaInfo } from './cdp/storage2';
import { getConnectionType, isOnline, getPageLocation, getOpenWebSockets, getServiceWorkerRegistrations, getBeaconSupport, getPageReferrer } from './cdp/network3';
import { withTimeout, TimeoutError, DEFAULT_TOOL_TIMEOUT_MS } from './timeout';
import { retry } from './retry';
import { readConfig } from './config';

function ok(content: unknown) {
  return { content: [{ type: 'text' as const, text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}

function okImage(base64: string) {
  return { content: [{ type: 'image' as const, data: base64, mimeType: 'image/png' as const }] };
}

function fail(message: string, code: string, suggestion?: string) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: message, code, suggestion }) }],
    isError: true,
  };
}

const TOOLS = [
  // ── Navigation ──────────────────────────────────────────────────────────────
  { name: 'browser_navigate', description: 'Navigate to a URL', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
  { name: 'browser_back', description: 'Go back in history', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_reload', description: 'Reload the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for', description: 'Wait for a CSS selector to appear', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_wait_for_network_idle', description: 'Wait until no network requests are in flight (essential after SPA navigation)', inputSchema: { type: 'object', properties: { idle_ms: { type: 'number' }, timeout_ms: { type: 'number' } } } },
  { name: 'browser_wait_for_url', description: 'Wait until page URL contains a substring (SPA route changes)', inputSchema: { type: 'object', properties: { pattern: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['pattern'] } },
  { name: 'browser_wait_for_response', description: 'Wait for a network response whose URL contains the given pattern', inputSchema: { type: 'object', properties: { url_pattern: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['url_pattern'] } },
  { name: 'browser_wait_for_new_tab', description: 'Wait for a new browser tab to open (e.g. after clicking a link that opens in a new window)', inputSchema: { type: 'object', properties: { timeout_ms: { type: 'number' } } } },
  { name: 'browser_get_url', description: 'Get the current page URL', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_title', description: 'Get the current page title', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_forward', description: 'Go forward in browser history', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_removed', description: 'Wait until an element is removed from the DOM (e.g. loading spinner disappears)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_wait_for_text', description: 'Wait until an element exists and its text contains the given string', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector', 'text'] } },
  { name: 'browser_wait_for_attribute', description: 'Wait until an element has a specific attribute value', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' }, value: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector', 'attribute', 'value'] } },
  { name: 'browser_wait_for_count', description: 'Wait until exactly N elements match a CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, count: { type: 'number' }, timeout_ms: { type: 'number' } }, required: ['selector', 'count'] } },
  // ── Tabs & sessions ─────────────────────────────────────────────────────────
  { name: 'browser_tabs', description: 'List tabs owned by this session. Pass all:true for all Chrome tabs.', inputSchema: { type: 'object', properties: { all: { type: 'boolean' } } } },
  { name: 'browser_sessions', description: 'List all active claudebrowser sessions', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_new_tab', description: 'Open a new tab', inputSchema: { type: 'object', properties: { url: { type: 'string' } } } },
  { name: 'browser_close_tab', description: 'Close a tab by id', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'browser_switch_tab', description: 'Switch to a tab by id', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  // ── Capture ──────────────────────────────────────────────────────────────────
  { name: 'browser_screenshot', description: 'Take a screenshot', inputSchema: { type: 'object', properties: { full_page: { type: 'boolean' } } } },
  { name: 'browser_accessibility_tree', description: 'Get ARIA accessibility tree', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_dom', description: 'Get outer HTML of element or body', inputSchema: { type: 'object', properties: { selector: { type: 'string' } } } },
  { name: 'browser_network_requests', description: 'Get recent network requests', inputSchema: { type: 'object', properties: { filter: { type: 'string', description: 'URL substring filter' } } } },
  { name: 'browser_console_messages', description: 'Get browser console output (log, warn, error)', inputSchema: { type: 'object', properties: { type: { type: 'string', description: 'Filter by type: log, warn, error, info' } } } },
  { name: 'browser_clear_console', description: 'Clear the console message buffer', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_network_log', description: 'Clear the network request buffer', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_page_metrics', description: 'Get page performance metrics: DOM nodes, JS heap size, event listeners', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_print_to_pdf', description: 'Export the current page as a base64-encoded PDF', inputSchema: { type: 'object', properties: { landscape: { type: 'boolean' }, print_background: { type: 'boolean' }, scale: { type: 'number' } } } },
  // ── Viewport ─────────────────────────────────────────────────────────────────
  { name: 'browser_set_viewport', description: 'Resize the browser viewport (for responsive testing)', inputSchema: { type: 'object', properties: { width: { type: 'number' }, height: { type: 'number' }, device_scale_factor: { type: 'number' }, mobile: { type: 'boolean' } }, required: ['width', 'height'] } },
  // ── Click & mouse ─────────────────────────────────────────────────────────────
  { name: 'browser_click', description: 'Click at x,y coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_click_selector', description: 'Click element by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_wait_and_click', description: 'Wait for element to appear then click it', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_double_click', description: 'Double-click at x,y', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_right_click', description: 'Right-click at x,y (opens context menus)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_drag', description: 'Drag from one coordinate to another (drag and drop)', inputSchema: { type: 'object', properties: { start_x: { type: 'number' }, start_y: { type: 'number' }, end_x: { type: 'number' }, end_y: { type: 'number' }, steps: { type: 'number', description: 'Intermediate steps (default 10)' } }, required: ['start_x', 'start_y', 'end_x', 'end_y'] } },
  { name: 'browser_hover', description: 'Move mouse over x,y (reveals tooltips/dropdowns)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_hover_selector', description: 'Move mouse over element by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_scroll', description: 'Scroll the page by pixel amount', inputSchema: { type: 'object', properties: { direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] }, amount: { type: 'number' } }, required: ['direction', 'amount'] } },
  { name: 'browser_scroll_to', description: 'Scroll an element into view by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_page_source', description: 'Get the full HTML source of the page (document.documentElement.outerHTML)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_history_length', description: 'Get the number of entries in the browser history for this tab', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_go_to_history_index', description: 'Navigate to a history entry by offset (e.g. -2 = two pages back, 1 = one page forward)', inputSchema: { type: 'object', properties: { n: { type: 'number' } }, required: ['n'] } },
  { name: 'browser_scroll_into_view', description: 'Scroll so that coordinates (x,y) are centered in the viewport', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_scroll_to_top', description: 'Scroll to the top of the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_scroll_to_bottom', description: 'Scroll to the bottom of the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_scroll_to_coords', description: 'Scroll to absolute coordinates (x, y)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_get_scroll_position', description: 'Get the current scroll position: {x, y}', inputSchema: { type: 'object', properties: {} } },
  // ── Keyboard & input ─────────────────────────────────────────────────────────
  { name: 'browser_type', description: 'Type text at current focus', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_press_key', description: 'Press a key with optional modifiers (Enter, Tab, Escape, etc.)', inputSchema: { type: 'object', properties: { key: { type: 'string' }, modifiers: { type: 'array', items: { type: 'string' }, description: 'e.g. ["ctrl", "shift"]' } }, required: ['key'] } },
  { name: 'browser_key_chord', description: 'Keyboard shortcut: Ctrl+A, Cmd+Z, Shift+Tab, etc.', inputSchema: { type: 'object', properties: { modifiers: { type: 'array', items: { type: 'string' } }, key: { type: 'string' } }, required: ['modifiers', 'key'] } },
  { name: 'browser_clear_input', description: 'Clear an input field (select all + backspace)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_focus', description: 'Focus an element without clicking it', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_blur', description: 'Remove focus from the currently focused element', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_select_option', description: 'Select a <select> option by value', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'browser_set_value', description: 'Set input value (React/Vue safe via native setter)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'browser_get_form_values', description: 'Read all field values from a form element as a key-value object', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the <form> element' } }, required: ['selector'] } },
  { name: 'browser_handle_dialog', description: 'Accept or dismiss an alert/confirm/prompt dialog', inputSchema: { type: 'object', properties: { accept: { type: 'boolean' }, prompt_text: { type: 'string' } }, required: ['accept'] } },
  { name: 'browser_file_upload', description: 'Set files on an <input type="file"> element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, file_paths: { type: 'array', items: { type: 'string' } } }, required: ['selector', 'file_paths'] } },
  // ── Evaluate & query ──────────────────────────────────────────────────────────
  { name: 'browser_evaluate', description: 'Execute JavaScript and return result', inputSchema: { type: 'object', properties: { script: { type: 'string' } }, required: ['script'] } },
  { name: 'browser_get_text', description: 'Get innerText of an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_all_text', description: 'Get innerText of ALL elements matching a selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_attribute', description: 'Get an attribute value from an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' } }, required: ['selector', 'attribute'] } },
  { name: 'browser_get_all_attributes', description: 'Get an attribute value from ALL elements matching a selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' } }, required: ['selector', 'attribute'] } },
  { name: 'browser_is_visible', description: 'Check if an element is visible', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_find_text', description: 'Find elements containing text, returns positions (x,y)', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  // ── DOM manipulation ──────────────────────────────────────────────────────────
  { name: 'browser_set_attribute', description: 'Set an attribute on an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'attribute', 'value'] } },
  { name: 'browser_remove_attribute', description: 'Remove an attribute from an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' } }, required: ['selector', 'attribute'] } },
  { name: 'browser_add_class', description: 'Add a CSS class to an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, class_name: { type: 'string' } }, required: ['selector', 'class_name'] } },
  { name: 'browser_remove_class', description: 'Remove a CSS class from an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, class_name: { type: 'string' } }, required: ['selector', 'class_name'] } },
  { name: 'browser_inject_css', description: 'Inject a <style> tag into the page. Returns a styleId for removal.', inputSchema: { type: 'object', properties: { css: { type: 'string' } }, required: ['css'] } },
  { name: 'browser_remove_css', description: 'Remove a previously injected style by its styleId', inputSchema: { type: 'object', properties: { style_id: { type: 'string' } }, required: ['style_id'] } },
  { name: 'browser_submit_form', description: 'Submit a form element programmatically', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_reset_form', description: 'Reset a form to its default values', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Clipboard ─────────────────────────────────────────────────────────────────
  { name: 'browser_set_clipboard', description: 'Write text to the clipboard', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_get_clipboard', description: 'Read text from the clipboard (requires clipboard-read permission — use browser_grant_permission first)', inputSchema: { type: 'object', properties: {} } },
  // ── IndexedDB ─────────────────────────────────────────────────────────────────
  { name: 'browser_list_indexed_databases', description: 'List all IndexedDB database names for the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_all_indexed_db', description: 'Get all records from an IndexedDB object store', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' } }, required: ['db_name', 'store_name'] } },
  { name: 'browser_get_indexed_db', description: 'Get a single record from IndexedDB by key', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' }, key: {} }, required: ['db_name', 'store_name', 'key'] } },
  { name: 'browser_clear_indexed_db', description: 'Clear all records from an IndexedDB object store', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' } }, required: ['db_name', 'store_name'] } },
  // ── Performance ───────────────────────────────────────────────────────────────
  { name: 'browser_get_paint_timing', description: 'Get First Paint and First Contentful Paint timings in ms', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_navigation_timing', description: 'Get navigation timing breakdown: TTFB, DOMContentLoaded, load, DNS, TCP', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_resource_timings', description: 'Get all resource timings (scripts, images, XHR, etc.) with duration and size', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_performance_buffer', description: 'Clear the performance resource timing buffer', inputSchema: { type: 'object', properties: {} } },
  // ── Media & CSS emulation ─────────────────────────────────────────────────────
  { name: 'browser_set_media_type', description: "Emulate CSS media type ('print', 'screen', or '' to reset)", inputSchema: { type: 'object', properties: { media: { type: 'string' } }, required: ['media'] } },
  { name: 'browser_set_color_scheme', description: "Emulate prefers-color-scheme ('light', 'dark', or '' to reset)", inputSchema: { type: 'object', properties: { scheme: { type: 'string' } }, required: ['scheme'] } },
  { name: 'browser_set_prefers_reduced_motion', description: "Emulate prefers-reduced-motion ('reduce' or '' to reset)", inputSchema: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] } },
  // ── Extra HTTP headers ────────────────────────────────────────────────────────
  { name: 'browser_set_extra_headers', description: 'Add extra HTTP headers to all subsequent requests (e.g. Authorization tokens)', inputSchema: { type: 'object', properties: { headers: { type: 'object', additionalProperties: { type: 'string' } } }, required: ['headers'] } },
  { name: 'browser_clear_extra_headers', description: 'Remove all extra HTTP header overrides', inputSchema: { type: 'object', properties: {} } },
  // ── Extraction ────────────────────────────────────────────────────────────────
  { name: 'browser_get_inner_html', description: 'Get the innerHTML of an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_table', description: 'Extract a table as an array of row objects (headers as keys)', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the <table> element' } }, required: ['selector'] } },
  { name: 'browser_screenshot_element', description: 'Take a screenshot clipped to a single element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Shadow DOM ────────────────────────────────────────────────────────────────
  { name: 'browser_query_shadow', description: 'querySelector inside a shadow root. Returns outerHTML of the found element or null.', inputSchema: { type: 'object', properties: { host_selector: { type: 'string', description: 'CSS selector for the shadow host element' }, shadow_selector: { type: 'string', description: 'CSS selector to run inside the shadow root' } }, required: ['host_selector', 'shadow_selector'] } },
  { name: 'browser_get_shadow_html', description: 'Get the innerHTML of a shadow root', inputSchema: { type: 'object', properties: { host_selector: { type: 'string' } }, required: ['host_selector'] } },
  { name: 'browser_evaluate_in_shadow', description: 'Run a JS function inside a shadow root. Script receives (shadowRoot, host) as arguments.', inputSchema: { type: 'object', properties: { host_selector: { type: 'string' }, script: { type: 'string', description: 'JS function expression e.g. (shadowRoot) => shadowRoot.querySelector("input").value' } }, required: ['host_selector', 'script'] } },
  // ── Storage ───────────────────────────────────────────────────────────────────
  { name: 'browser_get_cookies', description: 'Get all cookies for the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_cookie', description: 'Set a cookie on the current page', inputSchema: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'string' }, domain: { type: 'string' }, path: { type: 'string' }, expires: { type: 'number' }, http_only: { type: 'boolean' }, secure: { type: 'boolean' } }, required: ['name', 'value'] } },
  { name: 'browser_delete_cookies', description: 'Delete cookies by name', inputSchema: { type: 'object', properties: { name: { type: 'string' }, domain: { type: 'string' } }, required: ['name'] } },
  { name: 'browser_clear_cookies', description: 'Clear all cookies for the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_local_storage', description: 'Read a localStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'browser_set_local_storage', description: 'Set a localStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'] } },
  { name: 'browser_remove_local_storage', description: 'Remove a localStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'browser_get_all_local_storage', description: 'Get all localStorage entries as a key-value object', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_local_storage', description: 'Clear all localStorage for the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_session_storage', description: 'Read a sessionStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'browser_set_session_storage', description: 'Set a sessionStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'] } },
  { name: 'browser_remove_session_storage', description: 'Remove a sessionStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'browser_get_all_session_storage', description: 'Get all sessionStorage entries as a key-value object', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_session_storage', description: 'Clear all sessionStorage for the current page', inputSchema: { type: 'object', properties: {} } },
  // ── Element state ─────────────────────────────────────────────────────────────
  { name: 'browser_is_enabled', description: 'Check if an element is enabled (not disabled)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_is_checked', description: 'Check if a checkbox or radio input is checked', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_bounding_box', description: 'Get the bounding box of an element: {x, y, width, height}', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_count_elements', description: 'Count how many elements match a CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_computed_style', description: 'Get a computed CSS property value for an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, property: { type: 'string', description: 'CSS property name e.g. "color", "display"' } }, required: ['selector', 'property'] } },
  { name: 'browser_get_select_options', description: 'List all options in a <select> element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── JS errors ─────────────────────────────────────────────────────────────────
  { name: 'browser_get_js_errors', description: 'Get JavaScript errors thrown on the page since monitoring started', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_js_errors', description: 'Clear the JavaScript error buffer', inputSchema: { type: 'object', properties: {} } },
  // ── Network capture (manual, full request log) ────────────────────────────────
  { name: 'browser_network_log_start', description: 'Start capturing all network requests and responses to a buffer', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_network_log_get', description: 'Get all captured network requests since log was started', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_network_log_clear', description: 'Clear the network capture buffer without stopping capture', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_network_log_stop', description: 'Stop network capture and return the final log', inputSchema: { type: 'object', properties: {} } },
  // ── Device & environment emulation ───────────────────────────────────────────
  { name: 'browser_set_user_agent', description: 'Override the browser User-Agent string', inputSchema: { type: 'object', properties: { user_agent: { type: 'string' } }, required: ['user_agent'] } },
  { name: 'browser_set_device_metrics', description: 'Emulate a device: set viewport size, scale factor, and mobile mode', inputSchema: { type: 'object', properties: { width: { type: 'number' }, height: { type: 'number' }, device_scale_factor: { type: 'number' }, mobile: { type: 'boolean' } }, required: ['width', 'height'] } },
  { name: 'browser_clear_device_metrics', description: 'Clear device metric overrides (restore actual screen)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_network_conditions', description: 'Simulate network throttling (e.g. slow 3G, offline)', inputSchema: { type: 'object', properties: { offline: { type: 'boolean' }, latency: { type: 'number', description: 'Latency in ms' }, download_throughput: { type: 'number', description: 'bytes/sec, -1 = no throttle' }, upload_throughput: { type: 'number', description: 'bytes/sec, -1 = no throttle' }, connection_type: { type: 'string', description: 'cellular2g|cellular3g|cellular4g|wifi|ethernet|none' } } } },
  { name: 'browser_clear_network_conditions', description: 'Remove network throttling (restore full speed)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_geolocation', description: 'Spoof GPS location (latitude, longitude)', inputSchema: { type: 'object', properties: { latitude: { type: 'number' }, longitude: { type: 'number' }, accuracy: { type: 'number', description: 'Accuracy in meters (default 100)' } }, required: ['latitude', 'longitude'] } },
  { name: 'browser_clear_geolocation', description: 'Remove geolocation override', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_grant_permission', description: 'Grant a browser permission (geolocation, notifications, camera, microphone, clipboard-read, clipboard-write)', inputSchema: { type: 'object', properties: { permission: { type: 'string' }, origin: { type: 'string', description: 'Origin to grant for (e.g. https://example.com). Omit for all origins.' } }, required: ['permission'] } },
  { name: 'browser_reset_permissions', description: 'Reset all browser permission overrides to default', inputSchema: { type: 'object', properties: {} } },
  // ── Network interception ──────────────────────────────────────────────────────
  { name: 'browser_intercept_request', description: 'Mock a network request — matching URLs get the given response body instead of hitting the server', inputSchema: { type: 'object', properties: { url_pattern: { type: 'string' }, status: { type: 'number' }, body: { type: 'string' }, content_type: { type: 'string' } }, required: ['url_pattern'] } },
  { name: 'browser_clear_interceptions', description: 'Remove all active request interceptions', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_response_body', description: 'Get the decoded response body for a captured network request by requestId', inputSchema: { type: 'object', properties: { request_id: { type: 'string' } }, required: ['request_id'] } },
  // ── Frames (iframes) ──────────────────────────────────────────────────────────
  { name: 'browser_get_frames', description: 'List all frames (iframes) on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_evaluate_in_frame', description: 'Execute JavaScript inside a specific iframe', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the <iframe> element' }, script: { type: 'string' } }, required: ['selector', 'script'] } },
  { name: 'browser_switch_frame', description: 'Switch all subsequent operations to run inside a specific iframe', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_switch_main_frame', description: 'Switch back to the main page frame', inputSchema: { type: 'object', properties: {} } },
  // ── Input type helpers ────────────────────────────────────────────────────────
  { name: 'browser_set_range', description: 'Set the value of an <input type="range"> slider', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'number' } }, required: ['selector', 'value'] } },
  { name: 'browser_set_date', description: 'Set the value of an <input type="date"> field (YYYY-MM-DD)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string', description: 'Date string in YYYY-MM-DD format' } }, required: ['selector', 'value'] } },
  { name: 'browser_set_color', description: 'Set the value of an <input type="color"> field (#rrggbb hex)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string', description: 'Hex color e.g. #ff0000' } }, required: ['selector', 'value'] } },
  { name: 'browser_set_selection_range', description: 'Set the text selection range inside an input or textarea', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, start: { type: 'number' }, end: { type: 'number' } }, required: ['selector', 'start', 'end'] } },
  // ── Touch ─────────────────────────────────────────────────────────────────────
  { name: 'browser_tap', description: 'Simulate a touch tap at (x, y)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_swipe', description: 'Simulate a touch swipe from (startX, startY) to (endX, endY)', inputSchema: { type: 'object', properties: { start_x: { type: 'number' }, start_y: { type: 'number' }, end_x: { type: 'number' }, end_y: { type: 'number' }, steps: { type: 'number', description: 'Number of intermediate touch points (default 10)' } }, required: ['start_x', 'start_y', 'end_x', 'end_y'] } },
  { name: 'browser_pinch_zoom', description: 'Simulate a two-finger pinch or zoom gesture at center (x, y)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, from_distance: { type: 'number', description: 'Initial finger spread in pixels' }, to_distance: { type: 'number', description: 'Final finger spread in pixels (larger = zoom in, smaller = zoom out)' }, steps: { type: 'number' } }, required: ['x', 'y', 'from_distance', 'to_distance'] } },
  // ── WebSocket monitor ─────────────────────────────────────────────────────────
  { name: 'browser_websocket_start', description: 'Start capturing WebSocket messages and connections', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_websocket_messages', description: 'Get all captured WebSocket messages (sent + received) since log started', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_websocket_connections', description: 'Get all WebSocket connections (open and closed) since log started', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_websocket_clear', description: 'Clear the WebSocket message/connection buffer without stopping capture', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_websocket_stop', description: 'Stop WebSocket capture and return the final message log', inputSchema: { type: 'object', properties: {} } },
  // ── CSS & JS Coverage ─────────────────────────────────────────────────────────
  { name: 'browser_start_css_coverage', description: 'Start CSS rule usage tracking (to find unused CSS)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_stop_css_coverage', description: 'Stop CSS coverage and return used/unused rules with offsets', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_start_js_coverage', description: 'Start JavaScript precise coverage tracking', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_take_js_coverage', description: 'Take a JS coverage snapshot without stopping (shows which code ranges ran)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_stop_js_coverage', description: 'Stop JS coverage and return the final coverage report', inputSchema: { type: 'object', properties: {} } },
  // ── Service Workers ───────────────────────────────────────────────────────────
  { name: 'browser_list_service_workers', description: 'List all registered service workers for the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_unregister_service_worker', description: 'Unregister a service worker by scope URL', inputSchema: { type: 'object', properties: { scope_url: { type: 'string' } }, required: ['scope_url'] } },
  { name: 'browser_update_service_worker', description: 'Force a service worker registration to update (re-fetch)', inputSchema: { type: 'object', properties: { scope_url: { type: 'string' } }, required: ['scope_url'] } },
  { name: 'browser_is_controlled_by_sw', description: 'Check whether the current page is controlled by a service worker', inputSchema: { type: 'object', properties: {} } },
  // ── Security inspection ───────────────────────────────────────────────────────
  { name: 'browser_get_security_info', description: 'Get TLS/security state for the current page (secure, insecure, mixed content, certificate info)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_has_mixed_content', description: 'Check if the page has any mixed content (HTTP resources on an HTTPS page)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_csp', description: 'Get Content Security Policy meta tags on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_third_party_domains', description: 'List all third-party domains the page has loaded resources from', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_secure_context', description: 'Check if the current page is in a secure context (HTTPS, localhost, etc.)', inputSchema: { type: 'object', properties: {} } },
  // ── Network utilities ─────────────────────────────────────────────────────────
  { name: 'browser_block_urls', description: 'Block requests to URLs matching glob patterns', inputSchema: { type: 'object', properties: { patterns: { type: 'array', items: { type: 'string' }, description: 'URL glob patterns to block (e.g. ["*google-analytics*", "*ads*"])' } }, required: ['patterns'] } },
  { name: 'browser_clear_blocked_urls', description: 'Remove all blocked URL patterns', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_enable_cors_override', description: 'Inject Access-Control-Allow-Origin: * into all responses (bypasses CORS for testing)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_start_header_capture', description: 'Start capturing response headers per requestId (required before browser_get_response_headers)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_stop_header_capture', description: 'Stop capturing response headers', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_response_headers', description: 'Get response headers for a captured request by requestId', inputSchema: { type: 'object', properties: { request_id: { type: 'string' } }, required: ['request_id'] } },
  { name: 'browser_wait_for_network_quiet', description: 'Wait until there are no in-flight network requests for a sustained period (stricter than wait_for_network_idle)', inputSchema: { type: 'object', properties: { idle_ms: { type: 'number', description: 'How long request count must stay at 0 (default 500ms)' }, timeout_ms: { type: 'number' } } } },
  { name: 'browser_block_next_request', description: 'Block the next network request whose URL contains a pattern, once', inputSchema: { type: 'object', properties: { url_pattern: { type: 'string' } }, required: ['url_pattern'] } },
  // ── Cache API ─────────────────────────────────────────────────────────────────
  { name: 'browser_list_caches', description: 'List all Cache API cache names for the current origin', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_cache_entries', description: 'Get all entries in a named Cache API cache', inputSchema: { type: 'object', properties: { cache_name: { type: 'string' } }, required: ['cache_name'] } },
  { name: 'browser_delete_cache', description: 'Delete a named Cache API cache entirely', inputSchema: { type: 'object', properties: { cache_name: { type: 'string' } }, required: ['cache_name'] } },
  { name: 'browser_delete_cache_entry', description: 'Delete a specific URL from a named cache', inputSchema: { type: 'object', properties: { cache_name: { type: 'string' }, url: { type: 'string' } }, required: ['cache_name', 'url'] } },
  { name: 'browser_clear_all_caches', description: 'Clear all Cache API caches for the current origin', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_storage_quota', description: 'Get storage quota: how much storage this origin is using and how much is available', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_storage_breakdown', description: 'Get storage usage breakdown by type: localStorage, sessionStorage, caches, indexedDB, serviceWorker', inputSchema: { type: 'object', properties: {} } },
  // ── Visual inspection ─────────────────────────────────────────────────────────
  { name: 'browser_get_z_index', description: 'Get the computed z-index of an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_elements_at_point', description: 'Find all elements stacked at a given (x, y) coordinate, back to front', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_get_pixel_color', description: 'Get the background color at a point (x, y) by reading the element at that position', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_get_colors', description: 'Get computed color, background-color, and border-color for all elements matching a selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_highlight_element', description: 'Visually highlight an element with a colored outline. Returns styleId for removal.', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, color: { type: 'string', description: 'CSS color (default #ff3b30)' } }, required: ['selector'] } },
  { name: 'browser_remove_highlight', description: 'Remove a highlight previously added by browser_highlight_element', inputSchema: { type: 'object', properties: { style_id: { type: 'string' } }, required: ['style_id'] } },
  { name: 'browser_do_elements_overlap', description: 'Check if two elements overlap visually (bounding boxes intersect)', inputSchema: { type: 'object', properties: { selector1: { type: 'string' }, selector2: { type: 'string' } }, required: ['selector1', 'selector2'] } },
  { name: 'browser_get_font_info', description: 'Get font information for an element: family, size, weight, line-height, letter-spacing', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── DOM mutation observer ─────────────────────────────────────────────────────
  { name: 'browser_mutation_start', description: 'Start observing DOM mutations on elements matching a selector. Use a unique observerId to manage multiple observers.', inputSchema: { type: 'object', properties: { observer_id: { type: 'string', description: 'Unique name for this observer (e.g. "nav-changes")' }, selector: { type: 'string', description: 'CSS selector to observe, or "document" for page-level' }, child_list: { type: 'boolean' }, attributes: { type: 'boolean' }, character_data: { type: 'boolean' }, subtree: { type: 'boolean', description: 'Observe descendants too (default true)' } }, required: ['observer_id', 'selector'] } },
  { name: 'browser_mutation_get', description: 'Get all captured DOM mutations for a given observerId', inputSchema: { type: 'object', properties: { observer_id: { type: 'string' } }, required: ['observer_id'] } },
  { name: 'browser_mutation_clear', description: 'Clear the mutation buffer for an observer', inputSchema: { type: 'object', properties: { observer_id: { type: 'string' } }, required: ['observer_id'] } },
  { name: 'browser_mutation_stop', description: 'Stop a DOM mutation observer and return final mutations', inputSchema: { type: 'object', properties: { observer_id: { type: 'string' } }, required: ['observer_id'] } },
  { name: 'browser_mutation_stop_all', description: 'Stop all active DOM mutation observers for this session', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_mutation', description: 'Wait for at least one DOM mutation to be captured by an observer', inputSchema: { type: 'object', properties: { observer_id: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['observer_id'] } },
  // ── Media ─────────────────────────────────────────────────────────────────────
  { name: 'browser_get_media', description: 'Get info for all <video> and <audio> elements: src, time, duration, paused, volume, etc.', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_play_media', description: 'Play a media element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_pause_media', description: 'Pause a media element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_seek_media', description: 'Seek a media element to a time in seconds', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, time: { type: 'number', description: 'Time in seconds' } }, required: ['selector', 'time'] } },
  { name: 'browser_set_media_volume', description: 'Set volume on a media element (0.0 to 1.0)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, volume: { type: 'number', description: '0.0 (silent) to 1.0 (full)' } }, required: ['selector', 'volume'] } },
  { name: 'browser_set_media_muted', description: 'Mute or unmute a media element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, muted: { type: 'boolean' } }, required: ['selector', 'muted'] } },
  { name: 'browser_set_playback_rate', description: 'Set playback rate on a media element (e.g. 0.5 = half speed, 2 = double speed)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, rate: { type: 'number' } }, required: ['selector', 'rate'] } },
  { name: 'browser_wait_for_media_ready', description: 'Wait for a media element to reach a readyState (default 4 = HAVE_ENOUGH_DATA)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, ready_state: { type: 'number', description: '1-4 (default 4)' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  // ── DOM events & performance marks ────────────────────────────────────────────
  { name: 'browser_dispatch_event', description: 'Dispatch a DOM event on an element (click, change, input, focus, blur, keydown, custom, etc.)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, event_type: { type: 'string' }, bubbles: { type: 'boolean' }, cancelable: { type: 'boolean' }, detail: { description: 'Custom event detail (any JSON value)' }, key: { type: 'string' }, ctrl_key: { type: 'boolean' }, shift_key: { type: 'boolean' }, alt_key: { type: 'boolean' }, meta_key: { type: 'boolean' }, button: { type: 'number' }, client_x: { type: 'number' }, client_y: { type: 'number' } }, required: ['selector', 'event_type'] } },
  { name: 'browser_trigger_react_change', description: 'Trigger a React synthetic change event on a controlled input (bypasses React synthetic event system)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'browser_wait_for_event', description: 'Wait for a custom DOM event to fire on document, window, or an element', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector, "document", or "window"' }, event_type: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector', 'event_type'] } },
  { name: 'browser_get_performance_marks', description: 'Get all performance.mark() entries set by the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_performance_mark', description: 'Set a performance mark in the page (performance.mark)', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'browser_measure_performance', description: 'Measure elapsed time between two performance marks', inputSchema: { type: 'object', properties: { name: { type: 'string' }, start_mark: { type: 'string' }, end_mark: { type: 'string' } }, required: ['name', 'start_mark', 'end_mark'] } },
  // ── Tab state ─────────────────────────────────────────────────────────────────
  { name: 'browser_get_all_tabs', description: 'Get a snapshot of all open Chrome tabs: id, url, title, loading state', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_find_tabs_by_url', description: 'Find tabs whose URL contains a given pattern', inputSchema: { type: 'object', properties: { url_pattern: { type: 'string' } }, required: ['url_pattern'] } },
  { name: 'browser_duplicate_tab', description: 'Open a duplicate of a tab by its id', inputSchema: { type: 'object', properties: { tab_id: { type: 'string' } }, required: ['tab_id'] } },
  { name: 'browser_get_tab_info', description: 'Get details for a specific tab by id', inputSchema: { type: 'object', properties: { tab_id: { type: 'string' } }, required: ['tab_id'] } },
  { name: 'browser_wait_for_tab_load', description: 'Wait for a tab to finish loading', inputSchema: { type: 'object', properties: { tab_id: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['tab_id'] } },
  // ── Page snapshot ─────────────────────────────────────────────────────────────
  { name: 'browser_page_snapshot', description: 'Get a structured text snapshot of the page: URL, title, scroll, interactive elements, headings, ARIA alerts — faster than a screenshot for understanding page state', inputSchema: { type: 'object', properties: {} } },
  // ── Page metadata ─────────────────────────────────────────────────────────────
  { name: 'browser_get_meta_tags', description: 'Get all <meta> tags as array of {name, property, content, httpEquiv}', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_link_tags', description: 'Get all <link rel="..."> tags (stylesheets, canonical, preloads, etc.)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_ready_state', description: 'Get the document readyState: "loading", "interactive", or "complete"', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_load', description: 'Wait for document readyState to become "complete"', inputSchema: { type: 'object', properties: { timeout_ms: { type: 'number' } } } },
  // ── Evaluate helpers ──────────────────────────────────────────────────────────
  { name: 'browser_evaluate_on_element', description: 'Run a JS expression with the matched element as argument (e.g. "(el) => el.value")', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, script: { type: 'string', description: 'JS expression — can be arrow fn like (el) => el.value or plain expression like el.value' } }, required: ['selector', 'script'] } },
  { name: 'browser_get_window_globals', description: 'Get all app-defined global variables on the window object (filters out standard browser builtins)', inputSchema: { type: 'object', properties: {} } },
  // ── Downloads ─────────────────────────────────────────────────────────────────
  { name: 'browser_download_start', description: 'Start monitoring file downloads. Files are saved to downloadPath (default /tmp).', inputSchema: { type: 'object', properties: { download_path: { type: 'string', description: 'Directory to save downloads (default /tmp)' } } } },
  { name: 'browser_download_get', description: 'Get all captured download events (in-progress and completed)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_download_clear', description: 'Clear the download buffer without stopping monitoring', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_download_stop', description: 'Stop download monitoring and return the final event list', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_download', description: 'Wait for a file download to complete. Optionally filter by URL pattern.', inputSchema: { type: 'object', properties: { url_pattern: { type: 'string', description: 'URL substring to match (optional)' }, timeout_ms: { type: 'number' } } } },
  // ── Accessibility (extended) ──────────────────────────────────────────────────
  { name: 'browser_get_ax_subtree', description: 'Get the accessibility tree subtree rooted at the element matching a CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_focused_element', description: 'Get the accessibility info for the currently focused element', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_interactive_ax_nodes', description: 'Get all interactive accessibility nodes (buttons, links, inputs, etc.) that are not disabled', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_live_regions', description: 'Get ARIA live region content: role="alert", role="status", role="log"', inputSchema: { type: 'object', properties: {} } },
  // ── Dialog ────────────────────────────────────────────────────────────────────
  { name: 'browser_wait_for_dialog', description: 'Wait for a browser dialog (alert/confirm/prompt) to appear, then handle it', inputSchema: { type: 'object', properties: { accept: { type: 'boolean', description: 'true = accept/OK, false = dismiss/Cancel (default true)' }, prompt_text: { type: 'string', description: 'Text for prompt dialogs' }, timeout_ms: { type: 'number' } } } },
  { name: 'browser_is_dialog_open', description: 'Check whether a browser dialog is currently open (non-blocking)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_dismiss_print_dialog', description: 'Dismiss an open print dialog if one exists', inputSchema: { type: 'object', properties: {} } },
  // ── Iframes (CDP-level) ───────────────────────────────────────────────────────
  { name: 'browser_list_iframes', description: 'List all iframes on the page with frameId, URL, and name', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_evaluate_in_iframe', description: 'Evaluate JavaScript inside an iframe by frameId or URL substring', inputSchema: { type: 'object', properties: { frame: { type: 'string', description: 'frameId or URL substring to match' }, expression: { type: 'string' } }, required: ['frame', 'expression'] } },
  { name: 'browser_get_iframe_content', description: 'Get the full HTML content of an iframe', inputSchema: { type: 'object', properties: { frame: { type: 'string', description: 'frameId or URL substring' } }, required: ['frame'] } },
  { name: 'browser_click_in_iframe', description: 'Click an element by CSS selector inside an iframe', inputSchema: { type: 'object', properties: { frame: { type: 'string' }, selector: { type: 'string' } }, required: ['frame', 'selector'] } },
  { name: 'browser_type_in_iframe', description: 'Focus and type into an input inside an iframe', inputSchema: { type: 'object', properties: { frame: { type: 'string' }, selector: { type: 'string' }, text: { type: 'string' } }, required: ['frame', 'selector', 'text'] } },
  { name: 'browser_wait_for_iframe', description: 'Wait until an iframe whose URL matches a pattern exists', inputSchema: { type: 'object', properties: { url_pattern: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['url_pattern'] } },
  // ── Smart form fill ───────────────────────────────────────────────────────────
  { name: 'browser_fill_form', description: 'Fill multiple form fields at once — handles text, select, checkbox, radio, date, range', inputSchema: { type: 'object', properties: { fields: { type: 'array', items: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' }, checked: { type: 'boolean' } }, required: ['selector', 'value'] } } }, required: ['fields'] } },
  { name: 'browser_detect_form_fields', description: 'Scan for all fillable fields in a form: selectors, types, labels, current values', inputSchema: { type: 'object', properties: { form_selector: { type: 'string', description: 'CSS selector for a specific form (optional)' } } } },
  { name: 'browser_smart_submit_form', description: 'Click the submit button or call form.submit() — smarter than browser_submit_form', inputSchema: { type: 'object', properties: { form_selector: { type: 'string' } } } },
  { name: 'browser_clear_form', description: 'Clear all text inputs and textareas in a form (React/Vue safe)', inputSchema: { type: 'object', properties: { form_selector: { type: 'string' } } } },
  { name: 'browser_get_form_state', description: 'Snapshot all field values in a form: selector, type, value, checked', inputSchema: { type: 'object', properties: { form_selector: { type: 'string' } } } },
  // ── Composite waiters ─────────────────────────────────────────────────────────
  { name: 'browser_wait_for_any', description: 'Wait until ANY of the given selectors appears in the DOM. Returns the first matching selector.', inputSchema: { type: 'object', properties: { selectors: { type: 'array', items: { type: 'string' } }, timeout_ms: { type: 'number' } }, required: ['selectors'] } },
  { name: 'browser_wait_for_all', description: 'Wait until ALL given selectors are present in the DOM simultaneously', inputSchema: { type: 'object', properties: { selectors: { type: 'array', items: { type: 'string' } }, timeout_ms: { type: 'number' } }, required: ['selectors'] } },
  { name: 'browser_wait_for_condition', description: 'Poll a JS expression every 200ms until it returns truthy', inputSchema: { type: 'object', properties: { expression: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['expression'] } },
  { name: 'browser_wait_for_stable', description: "Wait until an element's bounding box stops changing (layout stable)", inputSchema: { type: 'object', properties: { selector: { type: 'string' }, stable_ms: { type: 'number', description: 'How long box must be unchanged in ms (default 500)' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_wait_for_value_change', description: "Wait until an element's value or textContent changes from its current state", inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_wait_for_count_change', description: 'Wait until the count of elements matching a selector changes', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, direction: { type: 'string', enum: ['increase', 'decrease', 'any'] }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_retry_until_success', description: 'Retry a JS expression up to N times (default 5) until it returns truthy without throwing', inputSchema: { type: 'object', properties: { expression: { type: 'string' }, max_attempts: { type: 'number' }, delay_ms: { type: 'number' } }, required: ['expression'] } },
  // ── Advanced pointer ──────────────────────────────────────────────────────────
  { name: 'browser_mouse_path', description: 'Move the mouse through a series of (x,y) points with smooth interpolation', inputSchema: { type: 'object', properties: { points: { type: 'array', items: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } }, delay_ms: { type: 'number', description: 'Delay between points in ms (default 16)' } }, required: ['points'] } },
  { name: 'browser_smooth_drag', description: 'Drag smoothly from one coordinate to another in N interpolated steps with mousedown held', inputSchema: { type: 'object', properties: { from_x: { type: 'number' }, from_y: { type: 'number' }, to_x: { type: 'number' }, to_y: { type: 'number' }, steps: { type: 'number', description: 'Interpolation steps (default 20)' } }, required: ['from_x', 'from_y', 'to_x', 'to_y'] } },
  { name: 'browser_drag_selector', description: 'Drag from center of one element to center of another by CSS selector', inputSchema: { type: 'object', properties: { source_selector: { type: 'string' }, target_selector: { type: 'string' } }, required: ['source_selector', 'target_selector'] } },
  { name: 'browser_hover_sequence', description: 'Hover over multiple elements in sequence with a delay between each (for revealing dropdowns)', inputSchema: { type: 'object', properties: { selectors: { type: 'array', items: { type: 'string' } }, delay_ms: { type: 'number', description: 'Delay between hovers in ms (default 300)' } }, required: ['selectors'] } },
  { name: 'browser_multi_click', description: 'Click N times at a coordinate with a delay between clicks', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, count: { type: 'number' }, delay_ms: { type: 'number' } }, required: ['x', 'y', 'count'] } },
  { name: 'browser_context_click', description: 'Right-click at (x,y) to open a context menu', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_middle_click', description: 'Middle-click at (x,y) to open a link in a new tab', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_get_mouse_position', description: 'Get the last known mouse position {x, y}', inputSchema: { type: 'object', properties: {} } },
  // ── Action recorder ───────────────────────────────────────────────────────────
  { name: 'browser_record_start', description: 'Start recording user interactions (clicks, input, change, keydown) into a replayable action log', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_record_stop', description: 'Stop recording and return the full action log', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_record_get', description: 'Get all recorded actions so far without stopping', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_record_clear', description: 'Clear the recording buffer without stopping', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_recording', description: 'Check whether action recording is currently active', inputSchema: { type: 'object', properties: {} } },
  // ── Semantic element finder ───────────────────────────────────────────────────
  { name: 'browser_find_by_label', description: 'Find an input/select/textarea associated with a visible label containing the given text', inputSchema: { type: 'object', properties: { label_text: { type: 'string' } }, required: ['label_text'] } },
  { name: 'browser_find_by_placeholder', description: 'Find an input whose placeholder attribute contains the given text', inputSchema: { type: 'object', properties: { placeholder: { type: 'string' } }, required: ['placeholder'] } },
  { name: 'browser_find_button', description: 'Find a button or submit input whose visible text or value contains the given text', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_find_by_role', description: 'Find elements with a given ARIA role, optionally filtered by accessible name', inputSchema: { type: 'object', properties: { role: { type: 'string', description: 'ARIA role e.g. button, textbox, dialog, listbox' }, name: { type: 'string', description: 'Optional accessible name filter' } }, required: ['role'] } },
  { name: 'browser_find_by_text', description: 'Find elements whose visible text contains the given string', inputSchema: { type: 'object', properties: { text: { type: 'string' }, tag_name: { type: 'string', description: 'Optional tag filter e.g. span, h1, button' } }, required: ['text'] } },
  { name: 'browser_find_near_label', description: 'Find all interactive elements near a label with the given text (same container)', inputSchema: { type: 'object', properties: { label_text: { type: 'string' } }, required: ['label_text'] } },
  { name: 'browser_get_element_selector', description: 'Get the best CSS selector for the element at a given (x, y) coordinate', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  // ── Advanced scrolling ────────────────────────────────────────────────────────
  { name: 'browser_scroll_until_visible', description: 'Scroll down the page until an element comes into the viewport', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, max_scrolls: { type: 'number', description: 'Max scroll steps (default 20)' }, scroll_amount: { type: 'number', description: 'Pixels per step (default 300)' } }, required: ['selector'] } },
  { name: 'browser_scroll_until_text', description: 'Scroll down until any element on the page contains the given text', inputSchema: { type: 'object', properties: { text: { type: 'string' }, max_scrolls: { type: 'number', description: 'Max scroll steps (default 30)' } }, required: ['text'] } },
  { name: 'browser_scroll_container', description: 'Scroll an overflow container element (not the page) by a pixel amount', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] }, amount: { type: 'number' } }, required: ['selector', 'direction', 'amount'] } },
  { name: 'browser_scroll_container_to_end', description: 'Scroll an overflow container to an edge (top, bottom, left, right)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, direction: { type: 'string', enum: ['top', 'bottom', 'left', 'right'] } }, required: ['selector', 'direction'] } },
  { name: 'browser_get_container_scroll', description: 'Get scroll state of an overflow container: scrollTop, scrollLeft, atBottom, atTop, etc.', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_infinite_scroll', description: "Click a 'Load More' trigger repeatedly until a JS stop condition is true or maxClicks reached", inputSchema: { type: 'object', properties: { trigger_selector: { type: 'string', description: 'CSS selector for the Load More button' }, stop_condition: { type: 'string', description: 'JS expression that returns truthy to stop (e.g. "document.querySelectorAll(\'.item\').length >= 50")' }, max_clicks: { type: 'number', description: 'Max clicks (default 10)' } }, required: ['trigger_selector', 'stop_condition'] } },
  { name: 'browser_smooth_scroll_to', description: 'Smoothly scroll the page to absolute coordinates using scroll behavior: smooth', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, duration_ms: { type: 'number', description: 'Wait time for animation in ms (default 500)' } }, required: ['x', 'y'] } },
  // ── Toast & notification ──────────────────────────────────────────────────────
  { name: 'browser_wait_for_toast', description: 'Wait for a toast/snackbar/alert banner to appear. Returns its text and selector.', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'Custom selector override (optional)' }, timeout_ms: { type: 'number' } } } },
  { name: 'browser_get_toasts', description: 'Get all currently visible toast/snackbar/alert elements on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_toast_containing', description: 'Wait for a toast whose text contains the given string', inputSchema: { type: 'object', properties: { text: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['text'] } },
  { name: 'browser_dismiss_toast', description: 'Try to dismiss a visible toast by clicking its close button', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'Custom toast selector (optional)' } } } },
  { name: 'browser_intercept_notifications', description: 'Override the Notification API to capture browser notifications instead of showing them', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_notifications', description: 'Get all captured browser Notification API calls', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_notifications', description: 'Clear captured browser notification history', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_banner_change', description: "Wait until a status banner/element's text content changes", inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  // ── Table interaction ─────────────────────────────────────────────────────────
  { name: 'browser_table_headers', description: 'Get all column header texts from a table', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the <table>' } }, required: ['selector'] } },
  { name: 'browser_table_row_count', description: 'Count the number of data rows in a table', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_table_column_values', description: 'Get all cell values in a column by 0-based index', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, column_index: { type: 'number' } }, required: ['selector', 'column_index'] } },
  { name: 'browser_table_column_by_name', description: 'Get all cell values in a named column (finds index by header text)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, column_name: { type: 'string' } }, required: ['selector', 'column_name'] } },
  { name: 'browser_table_find_row', description: 'Find the first row containing text in any cell. Returns {rowIndex, cells[]}', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, search_text: { type: 'string' } }, required: ['selector', 'search_text'] } },
  { name: 'browser_table_filter_rows', description: 'Return all rows where a specific column contains matching text', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, column_index: { type: 'number' }, match_text: { type: 'string' } }, required: ['selector', 'column_index', 'match_text'] } },
  { name: 'browser_table_click_header', description: 'Click a column header to trigger sort (find by header text)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, column_name: { type: 'string' } }, required: ['selector', 'column_name'] } },
  { name: 'browser_table_click_cell', description: 'Click a table cell at given row and column index (both 0-based)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, row_index: { type: 'number' }, column_index: { type: 'number' } }, required: ['selector', 'row_index', 'column_index'] } },
  // ── File upload (advanced) ────────────────────────────────────────────────────
  { name: 'browser_find_file_inputs', description: 'Find all <input type="file"> elements and return their selectors and accept types', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_files_cdp', description: 'Set files on a file input using native CDP DOM.setFileInputFiles (more reliable than evaluate)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, file_paths: { type: 'array', items: { type: 'string' } } }, required: ['selector', 'file_paths'] } },
  { name: 'browser_wait_upload_complete', description: 'Wait for an upload progress indicator to reach 100% or disappear', inputSchema: { type: 'object', properties: { progress_selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['progress_selector'] } },
  { name: 'browser_get_upload_progress', description: 'Read current upload progress percentage from a progress element', inputSchema: { type: 'object', properties: { progress_selector: { type: 'string' } }, required: ['progress_selector'] } },
  { name: 'browser_simulate_file_drop', description: 'Simulate dropping a file onto a drag-and-drop upload zone', inputSchema: { type: 'object', properties: { drop_zone_selector: { type: 'string' }, file_name: { type: 'string' }, file_content: { type: 'string', description: 'Plain text file content' }, mime_type: { type: 'string', description: 'MIME type (default text/plain)' } }, required: ['drop_zone_selector', 'file_name', 'file_content'] } },
  { name: 'browser_click_and_upload', description: 'Click a button to trigger a file chooser then immediately set files without a dialog', inputSchema: { type: 'object', properties: { button_selector: { type: 'string' }, file_paths: { type: 'array', items: { type: 'string' } }, timeout_ms: { type: 'number' } }, required: ['button_selector', 'file_paths'] } },
  // ── Layout & positioning ──────────────────────────────────────────────────────
  { name: 'browser_get_viewport_elements', description: 'Get all elements currently visible in the viewport with their positions and text (max 50)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_in_viewport', description: 'Check if an element is fully within the visible viewport', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_element_center', description: 'Get the center (x, y) coordinates of an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_relative_position', description: 'Get the relative position of one element vs another: above/below/left/right/overlapping + distance in px', inputSchema: { type: 'object', properties: { selector1: { type: 'string' }, selector2: { type: 'string' } }, required: ['selector1', 'selector2'] } },
  { name: 'browser_get_elements_in_region', description: 'Find all elements whose bounding box intersects a given rectangular region (x, y, width, height)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' } }, required: ['x', 'y', 'width', 'height'] } },
  { name: 'browser_get_page_dimensions', description: 'Get full page dimensions: scrollWidth, scrollHeight, viewportWidth, viewportHeight, devicePixelRatio', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_layout_shift', description: 'Get the cumulative layout shift (CLS) score for the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_absolute_position', description: 'Get element position relative to the document (accounts for scroll)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Debug & diagnostics ───────────────────────────────────────────────────────
  { name: 'browser_get_obstruction', description: 'Check if an element is obscured by another element at the same position', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_clickable_state', description: 'Check all conditions for whether an element can be clicked: exists, visible, in viewport, enabled, not obscured', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_event_listeners', description: 'Get all event listeners attached to an element (type, useCapture, passive, once)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_page_diagnostic', description: 'Quick page health check: URL, title, readyState, error counts, visible element count, scroll position', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_find_stale_elements', description: 'Check which selectors in a list no longer match any element in the DOM', inputSchema: { type: 'object', properties: { selectors: { type: 'array', items: { type: 'string' } } }, required: ['selectors'] } },
  { name: 'browser_get_computed_properties', description: 'Get multiple computed CSS properties for an element in a single round-trip', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, properties: { type: 'array', items: { type: 'string' }, description: 'CSS property names e.g. ["color", "display", "opacity"]' } }, required: ['selector', 'properties'] } },
  { name: 'browser_check_visibility', description: 'Detailed visibility breakdown: exists, hasSize, cssVisible, display, opacity, overflowHidden, parentHidden', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Clipboard (advanced) ──────────────────────────────────────────────────────
  { name: 'browser_read_clipboard', description: 'Read current clipboard text (tries Clipboard API, falls back to execCommand)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_write_clipboard', description: 'Write text to the clipboard', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_clear_clipboard', description: 'Clear the clipboard', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_read_clipboard_html', description: 'Read clipboard as HTML (returns empty string if not available)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_write_clipboard_html', description: 'Write HTML to clipboard (also writes plain-text fallback)', inputSchema: { type: 'object', properties: { html: { type: 'string' } }, required: ['html'] } },
  { name: 'browser_copy_from_element', description: 'Focus and select all text in element, copy to clipboard, return copied text', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_paste_into_element', description: 'Write text to clipboard and paste into focused element via synthetic paste event', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' } }, required: ['selector', 'text'] } },
  { name: 'browser_clipboard_history_length', description: 'Get length of window.__cbClipHistory if present', inputSchema: { type: 'object', properties: {} } },
  // ── Animations ────────────────────────────────────────────────────────────────
  { name: 'browser_get_animations', description: 'Get all active animations on the page (id, name, type, duration, delay, playState, currentTime)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_element_animations', description: 'Get all animations on a specific element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_pause_animations', description: 'Pause all animations on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_resume_animations', description: 'Resume all animations', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_animation_speed', description: 'Set global animation playback rate (0=paused, 1=normal, 2=2x)', inputSchema: { type: 'object', properties: { rate: { type: 'number' } }, required: ['rate'] } },
  { name: 'browser_finish_animations', description: 'Jump all animations to their finished state', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_cancel_element_animations', description: 'Cancel all animations on a specific element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_wait_animations_finished', description: 'Wait until all animations (or element animations) have finished', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } } } },
  // ── Canvas ────────────────────────────────────────────────────────────────────
  { name: 'browser_get_canvas_elements', description: 'Get all canvas elements with their dimensions and context type', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_canvas_to_data_url', description: 'Export a canvas as a base64 PNG data URL', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_canvas_dimensions', description: 'Get width and height of a canvas element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_canvas_pixel', description: 'Get RGBA color of a specific pixel on a canvas', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' } }, required: ['selector', 'x', 'y'] } },
  { name: 'browser_clear_canvas', description: 'Clear a canvas (fill with transparent)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_draw_text_on_canvas', description: 'Draw text on a 2D canvas context', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, font: { type: 'string' }, color: { type: 'string' } }, required: ['selector', 'text', 'x', 'y'] } },
  { name: 'browser_draw_rect_on_canvas', description: 'Draw a rectangle on a 2D canvas context', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' }, color: { type: 'string' }, fill: { type: 'boolean' } }, required: ['selector', 'x', 'y', 'width', 'height'] } },
  { name: 'browser_canvas_equals', description: 'Check if two canvas elements have identical pixel content', inputSchema: { type: 'object', properties: { selector1: { type: 'string' }, selector2: { type: 'string' } }, required: ['selector1', 'selector2'] } },
  // ── Text search ───────────────────────────────────────────────────────────────
  { name: 'browser_find_text_matches', description: 'Find all occurrences of text on page with xpath and pixel rect', inputSchema: { type: 'object', properties: { search_text: { type: 'string' }, case_sensitive: { type: 'boolean' } }, required: ['search_text'] } },
  { name: 'browser_count_text', description: 'Count how many times text appears on the page', inputSchema: { type: 'object', properties: { search_text: { type: 'string' }, case_sensitive: { type: 'boolean' } }, required: ['search_text'] } },
  { name: 'browser_get_selected_text', description: 'Get the text currently selected/highlighted on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_select_all_text_in', description: 'Select all text content within an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_highlight_all_text', description: 'Highlight all occurrences of text on page with CSS <mark> (returns count)', inputSchema: { type: 'object', properties: { search_text: { type: 'string' }, color: { type: 'string' } }, required: ['search_text'] } },
  { name: 'browser_clear_highlights', description: 'Remove all highlights added by browser_highlight_all_text', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_replace_text_in', description: 'Replace first occurrence of text in an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, search_text: { type: 'string' }, replacement: { type: 'string' } }, required: ['selector', 'search_text', 'replacement'] } },
  { name: 'browser_scroll_to_text', description: 'Scroll to the first occurrence of text on the page', inputSchema: { type: 'object', properties: { search_text: { type: 'string' }, case_sensitive: { type: 'boolean' } }, required: ['search_text'] } },
  // ── Geolocation / locale ──────────────────────────────────────────────────────
  { name: 'browser_set_geolocation_city', description: 'Override browser geolocation to a named city (e.g. "Atlanta", "Lagos", "London")', inputSchema: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] } },
  { name: 'browser_get_geolocation', description: 'Get the current geolocation via navigator.geolocation', inputSchema: { type: 'object', properties: { timeout_ms: { type: 'number' } } } },
  { name: 'browser_set_timezone', description: 'Override the browser timezone (e.g. "America/New_York", "Africa/Lagos")', inputSchema: { type: 'object', properties: { timezone_id: { type: 'string' } }, required: ['timezone_id'] } },
  { name: 'browser_get_timezone', description: 'Get the current browser timezone string', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_locale', description: 'Override the browser locale (e.g. "en-US", "fr-FR", "yo-NG")', inputSchema: { type: 'object', properties: { locale: { type: 'string' } }, required: ['locale'] } },
  { name: 'browser_get_locale', description: 'Get the current browser locale (navigator.language)', inputSchema: { type: 'object', properties: {} } },
  // ── Responsive / viewport ─────────────────────────────────────────────────────
  { name: 'browser_set_device', description: 'Emulate a device preset (iPhone 14, iPad, Galaxy S23, MacBook Pro, Desktop 1080p, etc.)', inputSchema: { type: 'object', properties: { device_name: { type: 'string' } }, required: ['device_name'] } },
  { name: 'browser_get_viewport', description: 'Get current viewport width, height, and devicePixelRatio', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_reset_viewport', description: 'Reset viewport to default 1280x800', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_check_media_query', description: 'Evaluate a CSS media query (e.g. "(max-width: 768px)")', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'browser_get_breakpoints', description: 'Get all CSS media queries active in loaded stylesheets', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_responsive_screenshots', description: 'Capture screenshots at multiple viewport sizes and return base64 images', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_find_overflow', description: 'Find elements with horizontal overflow (layout bugs)', inputSchema: { type: 'object', properties: {} } },
  // ── Crypto / hashing ──────────────────────────────────────────────────────────
  { name: 'browser_hash_string', description: 'Hash a string using Web Crypto (sha-256 by default). Returns hex digest.', inputSchema: { type: 'object', properties: { input: { type: 'string' }, algorithm: { type: 'string' } }, required: ['input'] } },
  { name: 'browser_hash_element', description: 'Hash the text content of a page element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, algorithm: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_generate_uuid', description: 'Generate a cryptographically random UUID v4', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_random_bytes', description: 'Generate N random bytes as a hex string', inputSchema: { type: 'object', properties: { count: { type: 'number' } }, required: ['count'] } },
  { name: 'browser_random_int', description: 'Generate a random integer between min and max (inclusive)', inputSchema: { type: 'object', properties: { min: { type: 'number' }, max: { type: 'number' } }, required: ['min', 'max'] } },
  { name: 'browser_base64_encode', description: 'Base64-encode a string', inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } },
  { name: 'browser_base64_decode', description: 'Base64-decode a string', inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } },
  { name: 'browser_hmac_sha256', description: 'Compute HMAC-SHA256 of a message with a key. Returns hex.', inputSchema: { type: 'object', properties: { key: { type: 'string' }, message: { type: 'string' } }, required: ['key', 'message'] } },
  // ── Page load / performance ───────────────────────────────────────────────────
  { name: 'browser_web_vitals', description: 'Get Web Vitals: LCP, FID, CLS, FCP, TTFB, DCL, load (all in ms)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_navigation_timing', description: 'Get full Navigation Timing API data (fetchStart, TTFB, domInteractive, etc.)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_slow_resources', description: 'Get top 20 slowest resources by load duration', inputSchema: { type: 'object', properties: { min_duration_ms: { type: 'number' } } } },
  { name: 'browser_time_to_interactive', description: 'Get time-to-interactive estimate (ms from navigation start)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_render_blocking', description: 'Find render-blocking stylesheets and scripts in <head>', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_memory_usage', description: 'Get JS heap memory usage (Chrome only)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_dom_node_count', description: 'Count total DOM nodes (elements, text, comment)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_load_timeline', description: 'Get a sorted timeline of page load milestones (ms from navStart)', inputSchema: { type: 'object', properties: {} } },
  // ── Web Workers ───────────────────────────────────────────────────────────────
  { name: 'browser_get_workers', description: 'List all active workers (dedicated + service workers)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_evaluate_in_worker', description: 'Evaluate a JS expression inside a specific worker by its workerId', inputSchema: { type: 'object', properties: { worker_id: { type: 'string' }, expression: { type: 'string' } }, required: ['worker_id', 'expression'] } },
  { name: 'browser_worker_count', description: 'Count active workers (all types)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_terminate_worker', description: 'Terminate a worker by its workerId', inputSchema: { type: 'object', properties: { worker_id: { type: 'string' } }, required: ['worker_id'] } },
  { name: 'browser_get_dedicated_workers', description: 'List dedicated workers only (excludes service workers)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_worker_by_url', description: 'Find the first worker whose URL contains a fragment', inputSchema: { type: 'object', properties: { url_fragment: { type: 'string' } }, required: ['url_fragment'] } },
  { name: 'browser_wait_for_worker', description: 'Wait until a worker with URL matching a fragment appears', inputSchema: { type: 'object', properties: { url_fragment: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['url_fragment'] } },
  { name: 'browser_post_to_worker', description: 'Post a message into a worker via self.postMessage', inputSchema: { type: 'object', properties: { worker_id: { type: 'string' }, message: {} }, required: ['worker_id', 'message'] } },
  // ── IndexedDB (record-level) ──────────────────────────────────────────────────
  { name: 'browser_idb_count', description: 'Count records in an IndexedDB object store', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' } }, required: ['db_name', 'store_name'] } },
  { name: 'browser_idb_get', description: 'Get a single record from IndexedDB by key', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' }, key: {} }, required: ['db_name', 'store_name', 'key'] } },
  { name: 'browser_idb_put', description: 'Put (insert or update) a record in IndexedDB', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' }, value: {}, key: {} }, required: ['db_name', 'store_name', 'value'] } },
  { name: 'browser_idb_delete', description: 'Delete a record from IndexedDB by key', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' }, key: {} }, required: ['db_name', 'store_name', 'key'] } },
  { name: 'browser_idb_get_keys', description: 'Get all keys from an IndexedDB object store', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' } }, required: ['db_name', 'store_name'] } },
  { name: 'browser_idb_query', description: 'Query IndexedDB records via an index (pass empty string for no index)', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' }, index_name: { type: 'string' }, query: {} }, required: ['db_name', 'store_name', 'index_name', 'query'] } },
  { name: 'browser_idb_store_names', description: 'Get all object store names in an IndexedDB database', inputSchema: { type: 'object', properties: { db_name: { type: 'string' } }, required: ['db_name'] } },
  { name: 'browser_idb_clear_store', description: 'Clear all records from an IndexedDB object store', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' } }, required: ['db_name', 'store_name'] } },
  // ── Fonts ─────────────────────────────────────────────────────────────────────
  { name: 'browser_get_page_fonts', description: 'Get the top 20 most common font combinations on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_element_font', description: 'Get computed font properties for a specific element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_find_by_font', description: 'Find elements using a specific font family (substring match)', inputSchema: { type: 'object', properties: { font_family: { type: 'string' } }, required: ['font_family'] } },
  { name: 'browser_get_font_stack', description: 'Get the full font-family stack for an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_check_font_loaded', description: 'Check if a font family is currently loaded in document.fonts', inputSchema: { type: 'object', properties: { font_family: { type: 'string' } }, required: ['font_family'] } },
  { name: 'browser_get_loaded_fonts', description: 'Get all loaded font family names from document.fonts', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_fonts_ready', description: 'Wait until document.fonts.ready resolves', inputSchema: { type: 'object', properties: { timeout_ms: { type: 'number' } } } },
  { name: 'browser_get_font_metrics', description: 'Get ascent/descent/baseline metrics for the font at a selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Permissions ───────────────────────────────────────────────────────────────
  { name: 'browser_deny_permission', description: 'Revoke a permission for an origin (resets to prompt state)', inputSchema: { type: 'object', properties: { permission: { type: 'string' }, origin: { type: 'string' } }, required: ['permission', 'origin'] } },
  { name: 'browser_check_permission', description: 'Check current state of a permission (granted/denied/prompt)', inputSchema: { type: 'object', properties: { permission_name: { type: 'string' } }, required: ['permission_name'] } },
  { name: 'browser_grant_geolocation', description: 'Grant the geolocation permission for an origin', inputSchema: { type: 'object', properties: { origin: { type: 'string' } }, required: ['origin'] } },
  { name: 'browser_grant_notifications', description: 'Grant the notifications permission for an origin', inputSchema: { type: 'object', properties: { origin: { type: 'string' } }, required: ['origin'] } },
  { name: 'browser_grant_clipboard', description: 'Grant clipboard-read and clipboard-write for an origin', inputSchema: { type: 'object', properties: { origin: { type: 'string' } }, required: ['origin'] } },
  { name: 'browser_get_permission_state', description: 'Get state of all standard permissions (geolocation, notifications, camera, microphone, clipboard)', inputSchema: { type: 'object', properties: {} } },
  // ── CSS inspection ────────────────────────────────────────────────────────────
  { name: 'browser_get_css_vars', description: 'Get all CSS custom properties (--name: value) from an element or :root', inputSchema: { type: 'object', properties: { selector: { type: 'string' } } } },
  { name: 'browser_set_css_var', description: 'Set a CSS custom property on an element or :root', inputSchema: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'string' }, selector: { type: 'string' } }, required: ['name', 'value'] } },
  { name: 'browser_get_stylesheets', description: 'List all stylesheets on the page (href, type, disabled, rulesCount)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_matching_rules', description: 'Find CSS rules whose selectorText matches a substring', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_inline_style', description: 'Get all inline style properties on an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_set_inline_style', description: 'Set a CSS property on an element inline style', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, property: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'property', 'value'] } },
  { name: 'browser_remove_inline_style', description: 'Remove a CSS property from an element inline style', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, property: { type: 'string' } }, required: ['selector', 'property'] } },
  { name: 'browser_get_used_css', description: 'Get computed values for specific CSS properties on an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, properties: { type: 'array', items: { type: 'string' } } }, required: ['selector', 'properties'] } },
  // ── Text selection / caret ────────────────────────────────────────────────────
  { name: 'browser_get_selection_range', description: 'Get start/end offsets and container info for the current text selection', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_select_text_range', description: 'Select a range of text inside an element by start/end character offset', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, start_offset: { type: 'number' }, end_offset: { type: 'number' } }, required: ['selector', 'start_offset', 'end_offset'] } },
  { name: 'browser_clear_selection', description: 'Clear the current text selection', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_caret', description: 'Get caret position (collapsed selection) offset and container', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_caret', description: 'Place the caret at a specific offset within an element text node', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, offset: { type: 'number' } }, required: ['selector', 'offset'] } },
  { name: 'browser_copy_selection', description: 'Copy selected text to clipboard and return the text', inputSchema: { type: 'object', properties: {} } },
  // ── Touch events ──────────────────────────────────────────────────────────────
  { name: 'browser_touch_tap', description: 'Dispatch a touch tap at coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_touch_double_tap', description: 'Dispatch a double touch tap at coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_touch_long_press', description: 'Dispatch a long press touch gesture', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, duration_ms: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_touch_swipe', description: 'Swipe from start to end coordinates with configurable steps', inputSchema: { type: 'object', properties: { start_x: { type: 'number' }, start_y: { type: 'number' }, end_x: { type: 'number' }, end_y: { type: 'number' }, steps: { type: 'number' } }, required: ['start_x', 'start_y', 'end_x', 'end_y'] } },
  { name: 'browser_touch_pinch', description: 'Simulate a two-finger pinch/zoom gesture at a center point', inputSchema: { type: 'object', properties: { center_x: { type: 'number' }, center_y: { type: 'number' }, scale: { type: 'number' } }, required: ['center_x', 'center_y', 'scale'] } },
  { name: 'browser_touch_scroll', description: 'Scroll via synthesizeScrollGesture from a touch position', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, delta_x: { type: 'number' }, delta_y: { type: 'number' } }, required: ['x', 'y', 'delta_x', 'delta_y'] } },
  { name: 'browser_touch_drag', description: 'Drag from start to end via touch events', inputSchema: { type: 'object', properties: { start_x: { type: 'number' }, start_y: { type: 'number' }, end_x: { type: 'number' }, end_y: { type: 'number' } }, required: ['start_x', 'start_y', 'end_x', 'end_y'] } },
  { name: 'browser_get_touch_support', description: 'Check browser touch support (maxTouchPoints, ontouchstart, PointerEvent)', inputSchema: { type: 'object', properties: {} } },
  // ── Dark mode / color scheme ──────────────────────────────────────────────────
  { name: 'browser_dark_mode', description: 'Emulate prefers-color-scheme: dark', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_light_mode', description: 'Emulate prefers-color-scheme: light', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_color_scheme', description: 'Clear prefers-color-scheme emulation', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_color_scheme', description: 'Get the current color scheme preference (dark/light/no-preference)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_contrast', description: 'Emulate prefers-contrast (more/less/no-preference)', inputSchema: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] } },
  { name: 'browser_get_theme_colors', description: 'Get background, foreground, and accent colors from the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_theme_screenshots', description: 'Capture screenshots in both light and dark mode, returns {light, dark} base64 PNGs', inputSchema: { type: 'object', properties: {} } },
  // ── Printing / PDF ────────────────────────────────────────────────────────────
  { name: 'browser_print_pdf_full', description: 'Export page as base64 PDF with full layout options (margins, paper size, landscape)', inputSchema: { type: 'object', properties: { landscape: { type: 'boolean' }, paper_width: { type: 'number' }, paper_height: { type: 'number' }, margin_top: { type: 'number' }, margin_bottom: { type: 'number' }, margin_left: { type: 'number' }, margin_right: { type: 'number' }, print_background: { type: 'boolean' } } } },
  { name: 'browser_get_page_count', description: 'Estimate the number of print pages for the current content', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_printable_area', description: 'Get the full scrollable content dimensions (useful for PDF sizing)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_page_title', description: 'Set the document title (affects PDF filename and print header)', inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } },
  { name: 'browser_inject_print_style', description: 'Inject a <style media="print"> block for custom print CSS', inputSchema: { type: 'object', properties: { css: { type: 'string' } }, required: ['css'] } },
  { name: 'browser_remove_print_styles', description: 'Remove all injected print style blocks', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_print_rules', description: 'Get all CSS rules inside @media print blocks', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_page_to_html', description: 'Get the full page outer HTML (for offline rendering)', inputSchema: { type: 'object', properties: {} } },
  // ── Viewport / scroll state ───────────────────────────────────────────────────
  { name: 'browser_full_page_size', description: 'Get full page scroll dimensions (scrollWidth, scrollHeight, clientWidth, clientHeight, innerWidth, innerHeight)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_visible_rect', description: 'Get the visible rectangle of the page (scrollX/Y + viewport size)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_fully_visible', description: 'Check if all 4 corners of an element are within the viewport', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_visibility_ratio', description: 'Get the fraction (0-1) of an element visible in the viewport', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_offscreen_elements', description: 'Find elements fully outside the viewport and their direction (above/below/left/right)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_scrollable', description: 'Find scrollable elements (excluding html/body)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_element_scroll_pos', description: 'Get scrollLeft, scrollTop, scrollWidth, scrollHeight for an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Timing / polling ──────────────────────────────────────────────────────────
  { name: 'browser_sleep', description: 'Wait N milliseconds (server-side)', inputSchema: { type: 'object', properties: { ms: { type: 'number' } }, required: ['ms'] } },
  { name: 'browser_measure_duration', description: 'Evaluate a JS expression and return the result + elapsed ms', inputSchema: { type: 'object', properties: { expression: { type: 'string' } }, required: ['expression'] } },
  { name: 'browser_wait_idle', description: 'Wait until document.readyState is complete', inputSchema: { type: 'object', properties: { idle_ms: { type: 'number' }, timeout_ms: { type: 'number' } } } },
  { name: 'browser_wait_expression', description: 'Poll until a JS expression returns truthy', inputSchema: { type: 'object', properties: { expression: { type: 'string' }, polling_ms: { type: 'number' }, timeout_ms: { type: 'number' } }, required: ['expression'] } },
  { name: 'browser_debounce_evaluate', description: 'Wait N ms then evaluate a JS expression (let the page settle first)', inputSchema: { type: 'object', properties: { expression: { type: 'string' }, wait_ms: { type: 'number' } }, required: ['expression', 'wait_ms'] } },
  { name: 'browser_retry_evaluate', description: 'Evaluate a JS expression with retries on failure', inputSchema: { type: 'object', properties: { expression: { type: 'string' }, max_retries: { type: 'number' }, retry_delay_ms: { type: 'number' } }, required: ['expression', 'max_retries'] } },
  { name: 'browser_high_res_time', description: 'Get performance.now() from the browser (high-resolution timestamp in ms)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_measure_expression', description: 'Run a JS expression N times and return avg/min/max execution time in ms', inputSchema: { type: 'object', properties: { expression: { type: 'string' }, runs: { type: 'number' } }, required: ['expression'] } },
  // ── XPath queries ─────────────────────────────────────────────────────────────
  { name: 'browser_xpath_first', description: 'Find the first element matching an XPath expression', inputSchema: { type: 'object', properties: { xpath: { type: 'string' } }, required: ['xpath'] } },
  { name: 'browser_xpath_all', description: 'Find all elements matching an XPath expression (up to 50)', inputSchema: { type: 'object', properties: { xpath: { type: 'string' } }, required: ['xpath'] } },
  { name: 'browser_xpath_count', description: 'Count elements matching an XPath expression', inputSchema: { type: 'object', properties: { xpath: { type: 'string' } }, required: ['xpath'] } },
  { name: 'browser_xpath_text', description: 'Get text value of an XPath expression', inputSchema: { type: 'object', properties: { xpath: { type: 'string' } }, required: ['xpath'] } },
  { name: 'browser_xpath_exists', description: 'Check if any element matches an XPath expression', inputSchema: { type: 'object', properties: { xpath: { type: 'string' } }, required: ['xpath'] } },
  { name: 'browser_xpath_click', description: 'Click the first element matching an XPath expression', inputSchema: { type: 'object', properties: { xpath: { type: 'string' } }, required: ['xpath'] } },
  { name: 'browser_xpath_attr', description: 'Get an attribute from the first element matching an XPath expression', inputSchema: { type: 'object', properties: { xpath: { type: 'string' }, attribute: { type: 'string' } }, required: ['xpath', 'attribute'] } },
  { name: 'browser_xpath_wait', description: 'Wait until an element matching an XPath expression appears', inputSchema: { type: 'object', properties: { xpath: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['xpath'] } },
  { name: 'browser_social_stealth', description: 'Apply deep fingerprint masking for social media sites (Instagram, TikTok, Meta). Patches webdriver flag, window.chrome, canvas, WebGL, plugins, and more. Call once after connecting.', inputSchema: { type: 'object', properties: {} } },
  // ── Clipboard API ─────────────────────────────────────────────────────────────
  { name: 'browser_clipboard_read_text', description: 'Read plain text from clipboard via Clipboard API', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clipboard_write_text', description: 'Write text to clipboard', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_clipboard_read_html', description: 'Read HTML from clipboard (text/html type), returns empty string if not available', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clipboard_clear', description: 'Clear clipboard by writing empty string', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clipboard_copy_element_text', description: 'Copy textContent of matching element to clipboard', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_clipboard_paste_at_cursor', description: 'Paste text at the current cursor position using execCommand insertText', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_clipboard_item_types', description: 'List MIME types available in clipboard (e.g. text/plain, text/html)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clipboard_copy_element_html', description: 'Copy outerHTML of matching element to clipboard', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Highlight / overlay ────────────────────────────────────────────────────────
  { name: 'browser_highlight_elements', description: 'Add colored outline to all elements matching selector, returns count', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, color: { type: 'string', description: 'CSS color e.g. rgba(255,0,0,0.5)' } }, required: ['selector'] } },
  { name: 'browser_remove_highlights', description: 'Remove all highlights added by browser_highlight_elements', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_highlight_with_label', description: 'Highlight element and show floating text label badge near it', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, label: { type: 'string' } }, required: ['selector', 'label'] } },
  { name: 'browser_flash_element', description: 'Flash element border on/off N times to draw attention', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, times: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_get_bounding_boxes', description: 'Return bounding boxes {x,y,width,height} for all matching elements', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_draw_overlay', description: 'Draw a colored overlay div at page coordinates, returns overlayId', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' }, color: { type: 'string' } }, required: ['x', 'y', 'width', 'height'] } },
  { name: 'browser_remove_overlay', description: 'Remove overlay div by its ID', inputSchema: { type: 'object', properties: { overlay_id: { type: 'string' } }, required: ['overlay_id'] } },
  { name: 'browser_clear_overlays', description: 'Remove all overlay divs injected by browser_draw_overlay', inputSchema: { type: 'object', properties: {} } },
  // ── Advanced input ─────────────────────────────────────────────────────────────
  { name: 'browser_type_with_delay', description: 'Type text character by character with a delay between keystrokes (human-like)', inputSchema: { type: 'object', properties: { text: { type: 'string' }, delay_ms: { type: 'number', description: 'Delay between characters in ms' } }, required: ['text', 'delay_ms'] } },
  { name: 'browser_clear_and_type', description: 'Select all text in element then type replacement text', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' } }, required: ['selector', 'text'] } },
  { name: 'browser_press_key_combo', description: 'Press multiple keys simultaneously (e.g. [Control,a] or [Control,Shift,z])', inputSchema: { type: 'object', properties: { keys: { type: 'array', items: { type: 'string' } } }, required: ['keys'] } },
  { name: 'browser_fill_by_label', description: 'Find input associated with a label by text and set its value', inputSchema: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } }, required: ['label', 'value'] } },
  { name: 'browser_check_checkbox', description: 'Check a checkbox if unchecked', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_uncheck_checkbox', description: 'Uncheck a checkbox if checked', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_select_radio', description: 'Click a radio button to select it', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_type_contenteditable', description: 'Focus a contenteditable element and insert text at cursor position', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' } }, required: ['selector', 'text'] } },
  // ── Page info / SEO ────────────────────────────────────────────────────────────
  { name: 'browser_page_language', description: 'Get the lang attribute of the document root element', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_page_charset', description: 'Get the document character set', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_canonical_url', description: 'Get the canonical URL from link[rel=canonical], or null if not set', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_og_tags', description: 'Get all Open Graph meta tags as a key-value object', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_twitter_tags', description: 'Get all Twitter Card meta tags as a key-value object', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_structured_data', description: 'Parse and return all JSON-LD structured data blocks on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_word_count', description: 'Count words in document.body.innerText', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_external_links', description: 'Return all external anchor links as array of {href, text}', inputSchema: { type: 'object', properties: {} } },
  // ── Network analysis ─────────────────────────────────────────────────────────
  { name: 'browser_network_timings', description: 'Get DNS/connect/TTFB/total timing breakdown for all page resources', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_largest_requests', description: 'Return top N requests by transfer size', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },
  { name: 'browser_failed_requests', description: 'Return requests that transferred 0 bytes (blocked or failed)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_request_count', description: 'Count total requests and breakdown by type (script, img, fetch, etc.)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_service_worker_info', description: 'Get in-page service worker status: controlled, scriptURL, state', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_page_protocol', description: 'Get window.location.protocol (e.g. https:)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_dns_lookup_time', description: 'Get DNS lookup time in ms for a hostname from resource timings', inputSchema: { type: 'object', properties: { hostname: { type: 'string' } }, required: ['hostname'] } },
  { name: 'browser_cached_requests', description: 'Return resources served from browser cache (transferSize=0, decodedBodySize>0)', inputSchema: { type: 'object', properties: {} } },
  // ── Storage inspection ─────────────────────────────────────────────────────────
  { name: 'browser_localstorage_size', description: 'Get localStorage key count and total byte size', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_search_localstorage', description: 'Search localStorage by key or value substring', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'browser_sessionstorage_size', description: 'Get sessionStorage key count and total byte size', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_dump_storage', description: 'Dump all localStorage and sessionStorage as plain objects', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_cookie_count', description: 'Count cookies visible to the page via document.cookie', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_cookie_domains', description: 'List unique cookie domains for the current browser session', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_storage_estimate', description: 'Get storage quota/usage/percent via navigator.storage.estimate()', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_origin_storage', description: 'Clear all storage types for the current origin via CDP', inputSchema: { type: 'object', properties: {} } },
  // ── DOM manipulation ───────────────────────────────────────────────────────────
  { name: 'browser_create_element', description: 'Create and append a new element to a parent selector', inputSchema: { type: 'object', properties: { parent_selector: { type: 'string' }, tag: { type: 'string' }, attrs: { type: 'object' }, text: { type: 'string' } }, required: ['parent_selector', 'tag'] } },
  { name: 'browser_remove_element', description: 'Remove first element matching selector from DOM, returns true if found', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_wrap_element', description: 'Wrap element in a new parent element with optional class', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, wrapper_tag: { type: 'string' }, wrapper_class: { type: 'string' } }, required: ['selector', 'wrapper_tag'] } },
  { name: 'browser_unwrap_element', description: 'Unwrap element — replace parent with its own children', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_clone_element', description: 'Deep-clone element and append to a target parent', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, target_parent: { type: 'string' } }, required: ['selector', 'target_parent'] } },
  { name: 'browser_move_element', description: 'Move (not clone) element to a target parent', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, target_parent: { type: 'string' } }, required: ['selector', 'target_parent'] } },
  { name: 'browser_set_element_text', description: 'Set textContent of matching element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' } }, required: ['selector', 'text'] } },
  { name: 'browser_get_element_count', description: 'Count elements matching a CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Modal / overlay ───────────────────────────────────────────────────────────
  { name: 'browser_is_modal_open', description: 'Detect if any in-page modal or overlay is currently visible', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_modal_content', description: 'Return text content of the first visible modal dialog', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_close_modal', description: 'Close modal by clicking close button or pressing Escape, returns true if button was found', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_modal', description: 'Wait up to timeoutMs for a modal to appear, returns true if found', inputSchema: { type: 'object', properties: { timeout_ms: { type: 'number' } } } },
  { name: 'browser_get_modal_buttons', description: 'List all buttons inside visible modals as {text, selector}', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_click_modal_button', description: 'Click a button inside a modal by its text (case-insensitive)', inputSchema: { type: 'object', properties: { button_text: { type: 'string' } }, required: ['button_text'] } },
  { name: 'browser_is_overlay_blocking', description: 'Check if a higher z-index overlay is blocking the given selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_dismiss_overlay', description: 'Press Escape then click body (1,1) to dismiss any visible overlay', inputSchema: { type: 'object', properties: {} } },
  // ── URL / navigation ──────────────────────────────────────────────────────────
  { name: 'browser_get_url_parts', description: 'Get href/protocol/host/pathname/search/hash/origin of current URL', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_query_params', description: 'Get all query parameters as key-value object', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_query_param', description: 'Set a query parameter without navigating (history.replaceState)', inputSchema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'] } },
  { name: 'browser_remove_query_param', description: 'Remove a query parameter without navigating', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'browser_get_hash', description: 'Get window.location.hash fragment', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_hash', description: 'Set window.location.hash', inputSchema: { type: 'object', properties: { hash: { type: 'string' } }, required: ['hash'] } },
  { name: 'browser_navigate_to_hash', description: 'Scroll to element by id and set location hash', inputSchema: { type: 'object', properties: { element_id: { type: 'string' } }, required: ['element_id'] } },
  { name: 'browser_navigation_history', description: 'Get CDP navigation history with currentIndex and entries', inputSchema: { type: 'object', properties: {} } },
  // ── Advanced table ─────────────────────────────────────────────────────────────
  { name: 'browser_get_full_table_data', description: 'Extract full table as array of header-keyed row objects', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_table_row_data', description: 'Get a single table row by 0-based index as header→cell object', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, row_index: { type: 'number' } }, required: ['selector', 'row_index'] } },
  { name: 'browser_get_table_cell_text', description: 'Get text of a specific cell by row and column index (0-based)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, row_index: { type: 'number' }, col_index: { type: 'number' } }, required: ['selector', 'row_index', 'col_index'] } },
  { name: 'browser_sort_table_column', description: 'Click table header at colIndex to trigger sort', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, col_index: { type: 'number' } }, required: ['selector', 'col_index'] } },
  { name: 'browser_table_page_info', description: 'Get table metadata: rows, cols, hasHeader, hasFoot', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_export_table_csv', description: 'Export table to CSV string', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_selected_rows', description: 'Return indices of selected/checked rows in a table', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_highlight_table_row', description: 'Set background color of a table row by index', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, row_index: { type: 'number' }, color: { type: 'string' } }, required: ['selector', 'row_index'] } },
  // ── Device emulation ───────────────────────────────────────────────────────────
  { name: 'browser_set_geolocation_accuracy', description: 'Update geolocation accuracy without changing lat/lng', inputSchema: { type: 'object', properties: { accuracy: { type: 'number' } }, required: ['accuracy'] } },
  { name: 'browser_simulate_movement', description: 'Walk through array of {lat,lng} coordinates with delay between steps', inputSchema: { type: 'object', properties: { steps: { type: 'array', items: { type: 'object' } }, interval_ms: { type: 'number' } }, required: ['steps'] } },
  { name: 'browser_high_accuracy_mode', description: 'Set geolocation with accuracy: 1 (GPS-level)', inputSchema: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, required: ['lat', 'lng'] } },
  { name: 'browser_low_accuracy_mode', description: 'Set geolocation with accuracy: 150 (network-level)', inputSchema: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, required: ['lat', 'lng'] } },
  { name: 'browser_set_battery_level', description: 'Spoof battery level (0.0-1.0) and charging state', inputSchema: { type: 'object', properties: { level: { type: 'number' }, charging: { type: 'boolean' } }, required: ['level'] } },
  { name: 'browser_clear_battery_override', description: 'Restore real battery data by clearing battery override', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_screen_orientation', description: 'Set screen orientation override (portraitPrimary, landscapePrimary, etc.)', inputSchema: { type: 'object', properties: { type: { type: 'string' }, angle: { type: 'number' } }, required: ['type', 'angle'] } },
  { name: 'browser_clear_screen_orientation', description: 'Clear screen orientation override', inputSchema: { type: 'object', properties: {} } },
  // ── Advanced screenshots ───────────────────────────────────────────────────────
  { name: 'browser_screenshot_full_page', description: 'Screenshot full page including below the fold (captureBeyondViewport)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_screenshot_viewport', description: 'Screenshot current viewport only', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_screenshot_region', description: 'Screenshot a specific x,y,width,height region', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' } }, required: ['x', 'y', 'width', 'height'] } },
  { name: 'browser_screenshot_jpeg', description: 'Screenshot in JPEG format with quality setting (default 85)', inputSchema: { type: 'object', properties: { quality: { type: 'number' } } } },
  { name: 'browser_compare_screenshots', description: 'Compare two base64 screenshot strings for pixel-perfect equality', inputSchema: { type: 'object', properties: { base64a: { type: 'string' }, base64b: { type: 'string' } }, required: ['base64a', 'base64b'] } },
  { name: 'browser_full_page_dimensions2', description: 'Get full page scrollWidth/scrollHeight/devicePixelRatio', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_screenshot_after_delay', description: 'Wait delayMs then take a viewport screenshot', inputSchema: { type: 'object', properties: { delay_ms: { type: 'number' } }, required: ['delay_ms'] } },
  { name: 'browser_screenshot_selector', description: 'Screenshot a specific element by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Scroll state ──────────────────────────────────────────────────────────────
  { name: 'browser_scroll_depth', description: 'Get scroll position as {pixels, percent} (0-100)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_at_bottom', description: 'Return true if page is scrolled to bottom (2px tolerance)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_at_top', description: 'Return true if page is scrolled to top (2px tolerance)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_scrollable_parent', description: 'Find nearest scrollable ancestor of element, return CSS selector or null', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_scroll_by', description: 'Call window.scrollBy(x, y)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_scroll_element_by', description: 'Call element.scrollBy(x, y) on matched element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' } }, required: ['selector', 'x', 'y'] } },
  { name: 'browser_scrollbar_width', description: 'Measure browser scrollbar width in pixels', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_scroll_to_percent', description: 'Scroll to a percentage (0-100) of total page height', inputSchema: { type: 'object', properties: { percent: { type: 'number' } }, required: ['percent'] } },
  // ── Focus management ───────────────────────────────────────────────────────────
  { name: 'browser_get_focused_selector', description: 'Return CSS selector of currently focused element, or null', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_tab_next', description: 'Press Tab to move focus to next focusable element', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_tab_prev', description: 'Press Shift+Tab to move focus to previous focusable element', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_focusable', description: 'List all focusable elements as {selector, tag, type}', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_trap_focus', description: 'Inject focus trap (Tab cycling) inside a container element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_is_focus_trapped', description: 'Check if a focus trap is currently active on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_release_focus_trap', description: 'Remove all focus trap listeners from the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_focus_nth', description: 'Focus the nth (0-based) element matching a selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, n: { type: 'number' } }, required: ['selector', 'n'] } },
  // ── Text search ────────────────────────────────────────────────────────────────
  { name: 'browser_find_elements_by_text', description: 'Find elements whose text matches a string (case-insensitive partial)', inputSchema: { type: 'object', properties: { text: { type: 'string' }, tag: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_get_text_blocks', description: 'Extract all visible text blocks (h1-h6, p, li, td, th, direct-text divs)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_find_by_regex', description: 'Find elements whose text matches a regex pattern', inputSchema: { type: 'object', properties: { pattern: { type: 'string' }, flags: { type: 'string' } }, required: ['pattern'] } },
  { name: 'browser_get_headings', description: 'Return all h1-h6 elements as {level, text, id}', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_paragraphs', description: 'Return all non-empty paragraph texts as string array', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_list_items', description: 'Return all ul/ol lists with their items grouped', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_count_words', description: 'Count words in element text or full body', inputSchema: { type: 'object', properties: { selector: { type: 'string' } } } },
  { name: 'browser_extract_emails', description: 'Extract unique email addresses from page text', inputSchema: { type: 'object', properties: {} } },
  // ── Device info ────────────────────────────────────────────────────────────────
  { name: 'browser_get_browser_info', description: 'Get userAgent, vendor, platform, language, cookieEnabled', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_screen_info', description: 'Get screen width/height/colorDepth/devicePixelRatio', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_mobile', description: 'Return true if screen.width < 768 or userAgent is mobile', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_touch', description: 'Return true if device supports touch events', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_media_capabilities', description: 'Detect WebGL, WebGL2, canvas, and supported video/audio formats', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_feature_support', description: 'Test browser feature availability: serviceWorker, indexedDB, geolocation, etc.', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_network_type', description: 'Get connection type/effectiveType/downlink/rtt, null if not available', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_time_info', description: 'Get timezone, UTC offset, and locale', inputSchema: { type: 'object', properties: {} } },
  // ── Form inspection ───────────────────────────────────────────────────────────
  { name: 'browser_form_fields', description: 'List all input/textarea/select fields in a form with name/type/value/required', inputSchema: { type: 'object', properties: { form_selector: { type: 'string' } }, required: ['form_selector'] } },
  { name: 'browser_form_validation_errors', description: 'Return validation errors for form fields as {name, message}[]', inputSchema: { type: 'object', properties: { form_selector: { type: 'string' } }, required: ['form_selector'] } },
  { name: 'browser_is_form_valid', description: 'Return true if form.checkValidity() passes', inputSchema: { type: 'object', properties: { form_selector: { type: 'string' } }, required: ['form_selector'] } },
  { name: 'browser_required_fields', description: 'List names of required inputs in a form', inputSchema: { type: 'object', properties: { form_selector: { type: 'string' } }, required: ['form_selector'] } },
  { name: 'browser_empty_required_fields', description: 'List required fields that are currently empty', inputSchema: { type: 'object', properties: { form_selector: { type: 'string' } }, required: ['form_selector'] } },
  { name: 'browser_list_select_options', description: 'List all option values/texts for a <select> element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_set_multi_select', description: 'Set multiple selected values on a <select multiple> element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, values: { type: 'array', items: { type: 'string' } } }, required: ['selector', 'values'] } },
  { name: 'browser_checked_checkboxes', description: 'Return names of all checked checkboxes within a form', inputSchema: { type: 'object', properties: { form_selector: { type: 'string' } }, required: ['form_selector'] } },
  // ── Media detail ────────────────────────────────────────────────────────────────
  { name: 'browser_get_video_state', description: 'Get detailed state of a video/audio element: src, time, duration, volume, buffered, etc.', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_mute_media', description: 'Mute a media element (sets muted=true)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_unmute_media', description: 'Unmute a media element (sets muted=false)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Element animations ─────────────────────────────────────────────────────────
  { name: 'browser_pause_element_anims', description: 'Pause all animations on a specific element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_play_element_anims', description: 'Play (resume) all animations on a specific element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_transitions', description: 'Get computed CSS transition property string for an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_element_anim_count', description: 'Count animations currently running on an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_element_anim_rate', description: 'Set animation playback rate on a specific element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, rate: { type: 'number' } }, required: ['selector', 'rate'] } },
  { name: 'browser_page_anim_count', description: 'Count total animations running on the whole page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_cancel_element_anims', description: 'Cancel all animations on a specific element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Accessibility inspection ────────────────────────────────────────────────────
  { name: 'browser_aria_attributes', description: 'Get all aria-* attributes on an element as {name, value}[]', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_role', description: 'Get ARIA role of element (explicit role attribute or tag name)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_tabindex', description: 'Get tabIndex value of an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_check_image_alts', description: 'Audit all <img> elements for missing alt attributes', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_heading_structure', description: 'Get all headings h1-h6 with level and text', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_landmarks', description: 'Find all landmark elements (header, nav, main, aside, footer, roles)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_aria_labelledby', description: 'Resolve aria-labelledby for an element and return referenced text', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Iframe inspection ─────────────────────────────────────────────────────────
  { name: 'browser_get_iframes', description: 'List all iframes: index, src, name, id, width, height, sandbox', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_iframe_count', description: 'Count iframes on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_iframe_sandboxed', description: 'Check if iframe has sandbox attribute', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_iframe_src', description: 'Get src attribute of an iframe', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_set_iframe_src', description: 'Set src attribute of an iframe', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, src: { type: 'string' } }, required: ['selector', 'src'] } },
  { name: 'browser_scroll_iframe_into_view', description: 'Smooth-scroll an iframe into the visible area', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_iframe_position', description: 'Get bounding rect of an iframe: x, y, width, height, top, left', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_is_iframe_visible', description: 'Return true if iframe is visible and in the DOM', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── DOM events ──────────────────────────────────────────────────────────────────
  { name: 'browser_check_event_handlers', description: 'Check which inline event handlers (onclick, oninput, etc.) are set on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_dispatch_custom_event', description: 'Dispatch a CustomEvent with a detail payload on an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, event_name: { type: 'string' }, detail: { type: 'string', description: 'JSON string for event.detail' } }, required: ['selector', 'event_name'] } },
  { name: 'browser_trigger_mouse_event', description: 'Dispatch a MouseEvent (click, mousedown, mouseover, etc.) on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, event_type: { type: 'string' } }, required: ['selector', 'event_type'] } },
  { name: 'browser_trigger_key_event', description: 'Dispatch a KeyboardEvent (keydown, keyup, keypress) on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, event_type: { type: 'string' }, key: { type: 'string' } }, required: ['selector', 'event_type', 'key'] } },
  { name: 'browser_trigger_input_event', description: 'Dispatch input and change events on element (notify frameworks of value change)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_trigger_focus_event', description: 'Dispatch focus or blur event on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, type: { type: 'string', description: 'focus or blur' } }, required: ['selector', 'type'] } },
  { name: 'browser_wait_for_dom_mutation', description: 'Wait for any DOM mutation on an element (childList, attributes, subtree)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_form_submit_url', description: 'Get action URL and method of a form element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Performance metrics ─────────────────────────────────────────────────────────
  { name: 'browser_perf_entries', description: 'Get all performance entries (first 50): name, entryType, startTime, duration', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_nav_timing', description: 'Get navigation timing: domContentLoaded, load, TTFB, domInteractive', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_resource_timings', description: 'Get resource timing entries (first 30): name, duration, transferSize, initiatorType', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_long_tasks', description: 'Get long tasks (>50ms) count and entries', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_memory_info', description: 'Get JS heap size info (Chrome only): used/total/limit', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_cls', description: 'Get Cumulative Layout Shift score and shift count', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_fcp', description: 'Get First Contentful Paint time in ms', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_lcp', description: 'Get Largest Contentful Paint time in ms', inputSchema: { type: 'object', properties: {} } },
  // ── Shadow DOM ─────────────────────────────────────────────────────────────────
  { name: 'browser_has_shadow_root', description: 'Check if element has a shadow root and report its mode', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_shadow_children', description: 'List children inside a shadow root: tag, id, class', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_query_shadow_root', description: 'Run querySelector inside a shadow root', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, inner_selector: { type: 'string' } }, required: ['selector', 'inner_selector'] } },
  { name: 'browser_shadow_root_mode', description: 'Get mode of shadow root (open, closed, or no shadow root)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_shadow_host_content', description: 'Get innerHTML of shadow host element (truncated to 2000 chars)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_count_shadow_roots', description: 'Count all elements on page that have a shadow root', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_shadow_host_elements', description: 'List up to 30 shadow-host elements on page: tag, id, class', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_shadow_slots', description: 'List slots in a shadow root with their names and assigned node counts', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── CSS inspection ──────────────────────────────────────────────────────────────
  { name: 'browser_computed_color', description: 'Get computed color and background-color for element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_css_vars2', description: 'Get all CSS custom properties (--variables) defined on :root', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_css_var2', description: 'Set a CSS custom property (--name) on :root', inputSchema: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'string' } }, required: ['name', 'value'] } },
  { name: 'browser_element_classes', description: 'Get list of CSS classes on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_toggle_class', description: 'Toggle a CSS class on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, class_name: { type: 'string' } }, required: ['selector', 'class_name'] } },
  { name: 'browser_computed_property', description: 'Get a single computed CSS property value for element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, property: { type: 'string' } }, required: ['selector', 'property'] } },
  { name: 'browser_set_inline_style2', description: 'Set an inline CSS property on element (MCP format)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, property: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'property', 'value'] } },
  { name: 'browser_stylesheet_count', description: 'Count stylesheets loaded on the page', inputSchema: { type: 'object', properties: {} } },
  // ── Observer / mutation ─────────────────────────────────────────────────────────
  { name: 'browser_wait_element_added', description: 'Wait for an element matching selector to be added to DOM', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_wait_element_removed2', description: 'Wait (MutationObserver) for element to be removed from DOM', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_wait_text_change', description: 'Wait for text content of element to change', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_wait_class_change', description: 'Wait for class attribute of element to change', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_intersection_ratio', description: 'Get intersection ratio (0-1) of element with viewport', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_wait_value_change2', description: 'Wait (MutationObserver+input) for element value to change', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_resize_info', description: 'Get size info for element: width, height, scrollWidth, scrollHeight, offsetWidth, offsetHeight', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_wait_attribute_change', description: 'Wait for a specific attribute on element to change', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector', 'attribute'] } },
  // ── Clipboard extended ─────────────────────────────────────────────────────────
  { name: 'browser_copy_element_text', description: 'Select element text and copy to clipboard using execCommand', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_selection_text', description: 'Get currently selected text on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_select_all_text', description: 'Select all text in an input, textarea, or element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_clipboard_access', description: 'Check if clipboard read/write access is available and its permission state', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_paste_at_cursor', description: 'Paste text at cursor position in focused element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' } }, required: ['selector', 'text'] } },
  // ── Storage2 ───────────────────────────────────────────────────────────────────
  { name: 'browser_localstorage_keys', description: 'Get JSON array of all localStorage keys', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_sessionstorage_keys', description: 'Get JSON array of all sessionStorage keys', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wipe_localstorage', description: 'Clear all localStorage entries', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wipe_sessionstorage', description: 'Clear all sessionStorage entries', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_indexeddb_databases', description: 'List all IndexedDB databases: name and version', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_cookie_count_info', description: 'Get count of cookies visible to the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_storage_quota', description: 'Get storage quota/usage from navigator.storage.estimate()', inputSchema: { type: 'object', properties: {} } },
  // ── Network3 ───────────────────────────────────────────────────────────────────
  { name: 'browser_connection_type', description: 'Get network connection type, effectiveType, downlink, and rtt', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_online', description: 'Check if the browser reports being online via navigator.onLine', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_page_location', description: 'Get page hostname, port, and origin from location', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_open_websockets', description: 'Check WebSocket connection status (not enumerable from page context)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_service_worker_registrations', description: 'List all service worker registrations: scope and state', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_beacon_support', description: 'Check if navigator.sendBeacon is supported', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_page_referrer', description: 'Get document.referrer for the current page', inputSchema: { type: 'object', properties: {} } },
  // ── Drag2 ──────────────────────────────────────────────────────────────────────
  { name: 'browser_draggable_elements', description: 'List all draggable elements on page (draggable attr or role)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_drop_zones', description: 'List all drop-zone elements on page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_simulate_drag_start', description: 'Dispatch dragstart event on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_simulate_drag_end', description: 'Dispatch dragend event on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_simulate_drag_enter', description: 'Dispatch dragenter event on target element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_simulate_drag_over', description: 'Dispatch dragover event on target element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_simulate_drop', description: 'Dispatch drop event on target element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_is_draggable', description: 'Check if element has draggable attribute set to true', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Dialog2 ─────────────────────────────────────────────────────────────────────
  { name: 'browser_dialog_elements', description: 'List all <dialog> elements on page with open state and id', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_open_dialogs', description: 'List only open <dialog> elements', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_open_dialog', description: 'Open a <dialog> element by selector (calls showModal or show)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, modal: { type: 'boolean' } }, required: ['selector'] } },
  { name: 'browser_close_dialog', description: 'Close a <dialog> element by selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, return_value: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_dialog_return_value', description: 'Get returnValue of a <dialog> element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_is_dialog_open_el', description: 'Check if a <dialog> element is currently open', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_active_modals', description: 'List elements in the top layer (modal dialogs, popovers)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_click_dialog_button', description: 'Click a button inside a dialog by its text', inputSchema: { type: 'object', properties: { dialog_selector: { type: 'string' }, button_text: { type: 'string' } }, required: ['dialog_selector', 'button_text'] } },
  // ── Canvas2 ─────────────────────────────────────────────────────────────────────
  { name: 'browser_canvas_elements2', description: 'List all canvas elements: id, class, width, height, webgl status', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_canvas_size', description: 'Get width and height of a canvas element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_clear_canvas2', description: 'Clear all pixels on a canvas element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_canvas_data_url', description: 'Export canvas as base64 PNG data URL', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_draw_rect_canvas2', description: 'Draw a filled rectangle on a canvas', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' }, color: { type: 'string' } }, required: ['selector', 'x', 'y', 'width', 'height'] } },
  { name: 'browser_canvas_pixel_color2', description: 'Get RGBA color of a pixel at (x,y) on canvas', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' } }, required: ['selector', 'x', 'y'] } },
  { name: 'browser_is_webgl_canvas', description: 'Check if canvas uses WebGL context', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_canvas_count', description: 'Count all canvas elements on the page', inputSchema: { type: 'object', properties: {} } },
  // ── Pointer Events ─────────────────────────────────────────────────────────────
  { name: 'browser_pointer_events', description: 'List elements with pointer event handlers or pointer-events CSS', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_pointer_down', description: 'Dispatch pointerdown PointerEvent on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_pointer_up', description: 'Dispatch pointerup PointerEvent on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_pointer_move', description: 'Dispatch pointermove PointerEvent on element with clientX/clientY', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' } }, required: ['selector', 'x', 'y'] } },
  { name: 'browser_pointer_cancel', description: 'Dispatch pointercancel PointerEvent on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_pointer_enter', description: 'Dispatch pointerenter PointerEvent on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_pointer_capture', description: 'Check if element supports setPointerCapture and releasePointerCapture', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_touch_action', description: 'Get computed touch-action CSS property for element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Timing2 ─────────────────────────────────────────────────────────────────────
  { name: 'browser_dom_loaded_time', description: 'Get time from navigation start to DOMContentLoaded in ms', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_load_event_time', description: 'Get time from navigation start to load event end in ms', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_ttfb', description: 'Get Time to First Byte (responseStart - navigationStart) in ms', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_page_timing_summary', description: 'Get summary of page timing: ttfb, domInteractive, domContentLoaded, loadEvent (ms)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_first_paint', description: 'Get First Paint time from PerformanceObserver paint entries', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_fcp', description: 'Get First Contentful Paint time from PerformanceObserver paint entries', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_resource_count', description: 'Count total resources loaded by the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_slow_resources2', description: 'List resources that took longer than threshold_ms (default 500ms) to load', inputSchema: { type: 'object', properties: { threshold_ms: { type: 'number' } } } },
  // ── Geolocation ─────────────────────────────────────────────────────────────────
  { name: 'browser_set_geolocation2', description: 'Override geolocation via CDP Emulation domain', inputSchema: { type: 'object', properties: { latitude: { type: 'number' }, longitude: { type: 'number' }, accuracy: { type: 'number' } }, required: ['latitude', 'longitude'] } },
  { name: 'browser_clear_geolocation2', description: 'Clear CDP geolocation override', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_geolocation_permission', description: 'Check geolocation permission state (granted/denied/prompt)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_geolocation_supported', description: 'Check if navigator.geolocation API is available', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_device_orientation', description: 'Dispatch DeviceOrientationEvent with alpha/beta/gamma angles', inputSchema: { type: 'object', properties: { alpha: { type: 'number' }, beta: { type: 'number' }, gamma: { type: 'number' } }, required: ['alpha', 'beta', 'gamma'] } },
  { name: 'browser_timezone_info', description: 'Get browser timezone from Intl.DateTimeFormat', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_timezone', description: 'Override browser timezone via CDP Emulation', inputSchema: { type: 'object', properties: { timezone_id: { type: 'string' } }, required: ['timezone_id'] } },
  { name: 'browser_locale_info', description: 'Get navigator.language and navigator.languages', inputSchema: { type: 'object', properties: {} } },
  // ── Worker ──────────────────────────────────────────────────────────────────────
  { name: 'browser_worker_supported', description: 'Check if Web Workers are supported', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_shared_worker_supported', description: 'Check if SharedWorker is supported', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_worker_count_status', description: 'Get count of workers tracked in injected registry', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_inject_worker_registry', description: 'Inject a Worker constructor patch that tracks created workers', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_post_shared_worker_message', description: 'Post a message to a named BroadcastChannel', inputSchema: { type: 'object', properties: { name: { type: 'string' }, message: { type: 'string' } }, required: ['name', 'message'] } },
  { name: 'browser_broadcast_channel_supported', description: 'Check if BroadcastChannel API is supported', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_worker_registry', description: 'Get all entries in the injected worker registry', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_worker_registry', description: 'Clear the injected worker registry', inputSchema: { type: 'object', properties: {} } },
  // ── Accessibility2 ───────────────────────────────────────────────────────────────
  { name: 'browser_aria_roles', description: 'List all elements with explicit role attributes', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_aria_labels', description: 'List elements with aria-label or aria-labelledby', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_aria_descriptions', description: 'List elements with aria-describedby or aria-description', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_landmarks', description: 'List ARIA landmark elements on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_tab_order', description: 'Get elements in tab order (positive tabindex first, then DOM order)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_focusable2', description: 'List all focusable elements excluding tabindex=-1', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_aria_expanded', description: 'List elements with aria-expanded attribute and current value', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_aria_hidden', description: 'List elements with aria-hidden="true"', inputSchema: { type: 'object', properties: {} } },
  // ── Media2 ───────────────────────────────────────────────────────────────────────
  { name: 'browser_all_media', description: 'List all audio and video elements: src, paused, muted, duration, currentTime', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_play2', description: 'Call .play() on a media element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_pause2', description: 'Call .pause() on a media element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_volume', description: 'Set media element volume (0.0–1.0)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, volume: { type: 'number' } }, required: ['selector', 'volume'] } },
  { name: 'browser_seek2', description: 'Seek media element to time in seconds', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, time: { type: 'number' } }, required: ['selector', 'time'] } },
  { name: 'browser_media_state', description: 'Get full state of media element: paused, muted, volume, currentTime, duration, src, etc.', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── History ─────────────────────────────────────────────────────────────────────
  { name: 'browser_history_length', description: 'Get window.history.length', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_go_back', description: 'Navigate back in history (window.history.back())', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_go_forward', description: 'Navigate forward in history (window.history.forward())', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_go_delta', description: 'Navigate by delta in history (window.history.go(n))', inputSchema: { type: 'object', properties: { delta: { type: 'number' } }, required: ['delta'] } },
  { name: 'browser_current_url', description: 'Get current window.location.href', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_page_title', description: 'Get current document.title', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_push_state', description: 'Push a new entry onto the history stack (history.pushState)', inputSchema: { type: 'object', properties: { url: { type: 'string' }, title: { type: 'string' } }, required: ['url'] } },
  { name: 'browser_replace_state', description: 'Replace current history entry (history.replaceState)', inputSchema: { type: 'object', properties: { url: { type: 'string' }, title: { type: 'string' } }, required: ['url'] } },
  // ── Viewport2 ───────────────────────────────────────────────────────────────────
  { name: 'browser_scroll_pos', description: 'Get current window scroll position (scrollX, scrollY)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_viewport2', description: 'Get viewport inner width and height', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_document_size', description: 'Get full document scrollWidth and scrollHeight', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_scroll_to_xy', description: 'Call window.scrollTo(x, y)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_scroll_by_xy', description: 'Call window.scrollBy(x, y)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_scroll_to_element2', description: 'Scroll element into view smoothly (scrollIntoView center)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_in_viewport', description: 'Check if element is visible in viewport and get visibility ratio', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Event2 ──────────────────────────────────────────────────────────────────────
  { name: 'browser_dispatch_custom2', description: 'Dispatch a CustomEvent on element with optional detail payload', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, event_name: { type: 'string' }, detail: {} }, required: ['selector', 'event_name'] } },
  { name: 'browser_dispatch_window_event', description: 'Dispatch a CustomEvent on window', inputSchema: { type: 'object', properties: { event_name: { type: 'string' } }, required: ['event_name'] } },
  { name: 'browser_event_listeners', description: 'Check inline event handler properties on element (onclick, onchange, etc.)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_trigger_input2', description: 'Dispatch input event on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_trigger_change', description: 'Dispatch change event on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_trigger_focus2', description: 'Dispatch focus event and call el.focus() on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_trigger_blur', description: 'Dispatch blur event and call el.blur() on element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_trigger_submit', description: 'Dispatch submit event on a form element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Notifications & page state ─────────────────────────────────────────────────
  { name: 'browser_notification_permission', description: 'Get Notification.permission state (granted/denied/default)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_notification_supported', description: 'Check if Web Notifications API is supported', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_page_visibility', description: 'Get document.visibilityState', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_visible', description: 'Check if page is visible (not hidden)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_ready_state', description: 'Get document.readyState (loading/interactive/complete)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_page_charset', description: 'Get document.characterSet', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_compat_mode', description: 'Get document.compatMode (CSS1Compat=standards, BackCompat=quirks)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_last_modified', description: 'Get document.lastModified', inputSchema: { type: 'object', properties: {} } },
  // ── Table ───────────────────────────────────────────────────────────────────────
  { name: 'browser_table_count', description: 'Count all <table> elements on page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_table_headers3', description: 'Get <th> text content from a table', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_table_row_count2', description: 'Count <tr> elements in a table', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_table_cell_count', description: 'Count total <td>+<th> cells in a table', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_table_row', description: 'Get all cell text values from row at 0-based index', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, row_index: { type: 'number' } }, required: ['selector', 'row_index'] } },
  { name: 'browser_table_cell', description: 'Get text of single cell at [row][col] (0-based)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, row_index: { type: 'number' }, col_index: { type: 'number' } }, required: ['selector', 'row_index', 'col_index'] } },
  { name: 'browser_table_data', description: 'Dump all table data as 2D array of cell text (max 50 rows)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_table_summary', description: 'Summarize all tables on page: rows, cols, hasHeader, id, class (max 10)', inputSchema: { type: 'object', properties: {} } },
  // ── Links ───────────────────────────────────────────────────────────────────────
  { name: 'browser_all_links', description: 'Get all <a href> links: text, href, target, rel (max 50)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_external_links2', description: 'Get external links (different host) from page (max 30)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_internal_links', description: 'Get internal links (same host) from page (max 30)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_link_count', description: 'Count all links: total, withHref, withoutHref', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_links_with_rel', description: 'Get links with specific rel value (nofollow, noreferrer, etc.)', inputSchema: { type: 'object', properties: { rel: { type: 'string' } }, required: ['rel'] } },
  { name: 'browser_mailto_links', description: 'Get all mailto: links with extracted email addresses', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_tel_links', description: 'Get all tel: links', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_anchor_links', description: 'Get all #fragment anchor links', inputSchema: { type: 'object', properties: {} } },
  // ── Image2 ──────────────────────────────────────────────────────────────────────
  { name: 'browser_all_images', description: 'Get all <img> elements: src, alt, width, height, naturalWidth/Height (max 30)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_broken_images', description: 'Get images that failed to load (naturalWidth=0, src non-empty)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_image_count', description: 'Count images: total, loaded, broken', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_lazy_images', description: 'Get images with loading="lazy"', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_images_no_alt', description: 'Get images missing or with empty alt attribute', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_svg_elements', description: 'List inline <svg> elements: id, class, width, height, viewBox', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_picture_elements', description: 'List <picture> elements with sources and fallback src', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_image_dimensions', description: 'Get dimensions of a specific image: natural and display size', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Input2 ──────────────────────────────────────────────────────────────────────
  { name: 'browser_all_inputs', description: 'List all form inputs: tag, type, name, id, placeholder, value, required, disabled', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_required_inputs', description: 'List inputs with required attribute', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_disabled_inputs', description: 'List disabled form inputs', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_input_values', description: 'Get current values of all named inputs', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_input', description: 'Set input value using native value setter (works with React/Vue)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'browser_clear_input', description: 'Clear an input value using native value setter', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_checkbox_state', description: 'Get checked, indeterminate, value of a checkbox/radio', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_set_checkbox', description: 'Set checked state of a checkbox and dispatch change event', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, checked: { type: 'boolean' } }, required: ['selector', 'checked'] } },
  // ── Meta2 ───────────────────────────────────────────────────────────────────────
  { name: 'browser_meta_description', description: 'Get <meta name="description"> content', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_meta_keywords', description: 'Get <meta name="keywords"> content', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_meta_robots', description: 'Get <meta name="robots"> content', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_meta_viewport', description: 'Get <meta name="viewport"> content', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_canonical2', description: 'Get <link rel="canonical"> href', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_hreflang_tags', description: 'Get all hreflang alternate link tags', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_json_ld', description: 'Get all <script type="application/ld+json"> schemas (max 5)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_headings', description: 'Get all h1-h6 headings in document order: level and text', inputSchema: { type: 'object', properties: {} } },
  // ── Font ────────────────────────────────────────────────────────────────────────
  { name: 'browser_computed_font', description: 'Get computed font properties for a specific element (family, size, weight, style, lineHeight)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_loaded_fonts2', description: 'List all fonts loaded by the page via document.fonts (name, style, weight, status)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_font_faces', description: 'Get all @font-face rules declared in stylesheets (family, src, weight, style)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_element_font_size', description: 'Get computed font-size in px for a specific element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_element_font_family', description: 'Get computed font-family stack for a specific element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_text_styles', description: 'Get all text-related computed styles for an element (font, color, spacing, decoration)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_distinct_fonts', description: 'Count how many distinct font families are used on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_is_font_loaded', description: 'Check if a specific font family is loaded and ready via document.fonts.check()', inputSchema: { type: 'object', properties: { font_family: { type: 'string' } }, required: ['font_family'] } },
  // ── Modal2 ──────────────────────────────────────────────────────────────────────
  { name: 'browser_detect_modals', description: 'Detect fixed/absolute positioned elements with high z-index (potential modals, max 10)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_overlay_elements', description: 'List all position:fixed elements with non-zero dimensions (max 15)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_has_backdrop', description: 'Check if a visible backdrop/mask element is present on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_close_modal_escape', description: 'Dispatch Escape keydown+keyup on document to dismiss modals', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_click_close_button', description: 'Find and click a modal close button (aria-label, .close class, or [data-dismiss])', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_popover_elements', description: 'List all elements with [popover] attribute (HTML popover API)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_zindex_layers', description: 'Count distinct z-index values on visible positioned elements', inputSchema: { type: 'object', properties: {} } },
  // ── Perf2 ───────────────────────────────────────────────────────────────────────
  { name: 'browser_cdp_metrics', description: 'Get Chrome Performance domain metrics (TaskDuration, ScriptDuration, LayoutCount, etc.)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_js_heap_size', description: 'Get JS heap size: used, total, limit (Chrome only via performance.memory)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_dom_node_count2', description: 'Count all DOM nodes in the document (document.querySelectorAll(*))', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_event_listener_total', description: 'Approximate count of event listeners attached via on* handler properties (scans 500 elements)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_mark_performance2', description: 'Create a named performance.mark() timestamp', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'browser_measure_performance2', description: 'Create a performance.measure() between two marks, returns duration in ms', inputSchema: { type: 'object', properties: { name: { type: 'string' }, start_mark: { type: 'string' }, end_mark: { type: 'string' } }, required: ['name', 'start_mark', 'end_mark'] } },
  { name: 'browser_clear_perf_marks', description: 'Clear all performance marks via performance.clearMarks()', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_perf_marks2', description: 'Get all performance marks: name and startTime', inputSchema: { type: 'object', properties: {} } },
  // ── Shadow DOM ──────────────────────────────────────────────────────────────────
  { name: 'browser_shadow_hosts', description: 'List all elements with shadow roots: tag, id, class, mode (max 20)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_shadow_root_info', description: 'Get shadow root info for element: mode, delegatesFocus, childCount', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_query_shadow2', description: 'querySelector inside a shadow root, returns found, tag, id, class, text', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, inner_selector: { type: 'string' } }, required: ['selector', 'inner_selector'] } },
  { name: 'browser_shadow_children2', description: 'List direct children of a shadow root: tag, id, class, text snippet', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_is_shadow_host', description: 'Check if element has a shadow root and return its mode', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_shadow_slots2', description: 'List <slot> elements inside a shadow root: name, assignedCount', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_shadow_css_vars', description: 'Get CSS custom properties (--var) computed on a shadow host element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_shadow_depth', description: 'Count how many shadow DOM levels deep an element is (0 = not in shadow)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Network2 ────────────────────────────────────────────────────────────────────
  { name: 'browser_resource_timings2', description: 'Get all resource timing entries: name, duration, transferSize, initiatorType (max 30)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_resources_by_type', description: 'Filter resource timings by initiatorType: script, img, css, fetch, xmlhttprequest, etc.', inputSchema: { type: 'object', properties: { type: { type: 'string' } }, required: ['type'] } },
  { name: 'browser_largest_resources', description: 'Get top N resources by transferSize (default 10)', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },
  { name: 'browser_cached_resources', description: 'Get resources served from cache (transferSize=0, duration>0)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_total_transfer_size', description: 'Sum all resource transferSize: totalBytes, totalKb, count', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_failed_resources', description: 'Get resources with duration=0 and no transferSize (likely failed)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_resource_timings', description: 'Call performance.clearResourceTimings() to reset the buffer', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_nav_timing_basic', description: 'Get navigation timing: domContentLoaded and loadEventEnd in ms from PerformanceTiming', inputSchema: { type: 'object', properties: {} } },
  // ── Status & auth ─────────────────────────────────────────────────────────────
  { name: 'browser_status', description: 'Check CDP connection and active tab', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_auth_check', description: 'Check login status for Instagram, Meta Ads, TikTok Ads. Run before any automation.', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_auth', description: 'Wait up to 2 minutes for the user to log in', inputSchema: { type: 'object', properties: { platform: { type: 'string' }, timeout_ms: { type: 'number' } } } },
];

export async function startServer(sessionName?: string): Promise<void> {
  const config = readConfig();
  const cdp = new CdpClient(config.debugPort);

  pruneDeadSessions();
  const sessionId = generateSessionId();
  registerSession(sessionId, sessionName);

  let watchdogHandle: NodeJS.Timeout | null = null;
  const reconnect = async () => {
    try {
      resetNetworkMonitor();
      resetConsoleMonitor();
      await cdp.connect();
      startNetworkMonitor(cdp);
      startConsoleMonitor(cdp);
      startFrameMonitor(cdp);
      await startCdpConsole(cdp);
      // Re-apply stealth patches after reconnect — without this, navigator.webdriver
      // becomes visible again and bot-detection sites will flag the session.
      await applyStealthPatches(cdp);
    } catch { /* retry on next watchdog tick */ }
  };

  const cleanup = () => {
    if (watchdogHandle) stopWatchdog(watchdogHandle);
    // Run and discard any pending network interception cleanups so Fetch domain
    // handlers don't leak after the session exits.
    const pending = _interceptCleanups.get(sessionId) ?? [];
    _interceptCleanups.delete(sessionId);
    for (const fn of pending) fn().catch(() => {});
    unregisterSession(sessionId);
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  try {
    await cdp.connect();
    startNetworkMonitor(cdp);
    startConsoleMonitor(cdp);
    startFrameMonitor(cdp);
    await startCdpConsole(cdp);
    await applyStealthPatches(cdp);
    watchdogHandle = startWatchdog(config.debugPort, reconnect);
  } catch {
    process.stderr.write(`Warning: Chrome not reachable on port ${config.debugPort}. Run claudebrowser init first.\n`);
  }

  const server = new Server(
    { name: 'claudebrowser', version: '1.25.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    const a = args as Record<string, unknown>;

    if (!cdp.isConnected() && name !== 'browser_status') {
      try {
        resetNetworkMonitor(); resetConsoleMonitor();
        await cdp.connect();
        await applyStealthPatches(cdp);
        startNetworkMonitor(cdp); startConsoleMonitor(cdp); startFrameMonitor(cdp);
      } catch {
        return fail('Chrome not connected. Is it running? Run: claudebrowser init', 'CDP_DISCONNECTED', 'claudebrowser status');
      }
    }

    const NO_TIMEOUT = new Set(['browser_wait_for_auth', 'browser_auth_check', 'browser_status', 'browser_wait_for_response', 'browser_wait_for_new_tab', 'browser_wait_for_download', 'browser_wait_for_dialog']);

    const run = async () => {
      switch (name) {
        // Navigation
        case 'browser_navigate':               return ok(await navigate(cdp, a.url as string, config.navigationTimeoutMs));
        case 'browser_back':                   return ok({ url: await goBack(cdp) });
        case 'browser_reload':                 { await reload(cdp, config.navigationTimeoutMs); return ok('Reloaded'); }
        case 'browser_wait_for':               { await waitForSelector(cdp, a.selector as string, a.timeout_ms as number | undefined); return ok('Element found'); }
        case 'browser_wait_for_network_idle':  { await waitForNetworkIdle(cdp, a.idle_ms as number | undefined, a.timeout_ms as number | undefined); return ok('Network idle'); }
        case 'browser_wait_for_url':           return ok({ url: await waitForUrl(cdp, a.pattern as string, a.timeout_ms as number | undefined) });
        case 'browser_wait_for_response':      return ok(await waitForResponse(cdp, a.url_pattern as string, a.timeout_ms as number | undefined));
        case 'browser_wait_for_new_tab':       return ok({ targetId: await waitForNewTab(cdp, a.timeout_ms as number | undefined) });
        case 'browser_get_url':                return ok({ url: await getUrl(cdp) });
        case 'browser_get_title':              return ok({ title: await getTitle(cdp) });
        case 'browser_forward':                return ok({ url: await goForward(cdp) });
        case 'browser_wait_for_removed':       { await waitForElementRemoved(cdp, a.selector as string, a.timeout_ms as number | undefined); return ok('Element removed'); }
        case 'browser_wait_for_text':          { await waitForText(cdp, a.selector as string, a.text as string, a.timeout_ms as number | undefined); return ok('Text found'); }
        case 'browser_wait_for_attribute':     { await waitForAttribute(cdp, a.selector as string, a.attribute as string, a.value as string, a.timeout_ms as number | undefined); return ok('Attribute matched'); }
        case 'browser_wait_for_count':         { await waitForElementCount(cdp, a.selector as string, a.count as number, a.timeout_ms as number | undefined); return ok('Count matched'); }
        // Tabs
        case 'browser_tabs':                   return ok(a.all ? await listTabs(cdp) : await listSessionTabs(cdp, sessionId));
        case 'browser_sessions':               return ok(getAllSessions());
        case 'browser_new_tab':                return ok({ id: await newTab(config.debugPort, a.url as string | undefined, sessionId) });
        case 'browser_close_tab':              { await closeTab(config.debugPort, a.id as string, sessionId); return ok('Tab closed'); }
        case 'browser_switch_tab':             { await activateTab(config.debugPort, a.id as string); await cdp.disconnect(); await cdp.connect(a.id as string); return ok('Switched'); }
        // Capture
        case 'browser_screenshot':             return okImage(await takeScreenshot(cdp, (a.full_page as boolean) ?? false));
        case 'browser_accessibility_tree':     return ok(await getAccessibilityTree(cdp));
        case 'browser_dom':                    return ok(await getDom(cdp, a.selector as string | undefined));
        case 'browser_network_requests':       return ok(getNetworkRequests(a.filter as string | undefined));
        case 'browser_console_messages':       return ok(getConsoleMessages(a.type as string | undefined));
        case 'browser_clear_console':          { clearConsoleLog(); return ok('Console cleared'); }
        case 'browser_clear_network_log':      { clearNetworkLog(); return ok('Network log cleared'); }
        case 'browser_get_page_metrics':       return ok(await getPageMetrics(cdp));
        case 'browser_print_to_pdf':           return ok(await printToPDF(cdp, { landscape: a.landscape as boolean | undefined, printBackground: a.print_background as boolean | undefined, scale: a.scale as number | undefined }));
        // Viewport
        case 'browser_set_viewport':           { await setViewport(cdp, a.width as number, a.height as number, a.device_scale_factor as number | undefined, a.mobile as boolean | undefined); return ok('Viewport set'); }
        // Click & mouse
        case 'browser_click':                  { await clickAt(cdp, a.x as number, a.y as number); return ok('Clicked'); }
        case 'browser_click_selector':         { await clickSelector(cdp, a.selector as string); return ok('Clicked'); }
        case 'browser_wait_and_click':         { await retry(() => clickSelector(cdp, a.selector as string), { timeoutMs: (a.timeout_ms as number) ?? 10000, errorMessage: `Element not clickable: ${a.selector}` }); return ok('Clicked'); }
        case 'browser_double_click':           { await doubleClickAt(cdp, a.x as number, a.y as number); return ok('Double-clicked'); }
        case 'browser_right_click':            { await rightClickAt(cdp, a.x as number, a.y as number); return ok('Right-clicked'); }
        case 'browser_drag':                   { await dragAndDrop(cdp, a.start_x as number, a.start_y as number, a.end_x as number, a.end_y as number, a.steps as number | undefined); return ok('Dragged'); }
        case 'browser_hover':                  { await hoverAt(cdp, a.x as number, a.y as number); return ok('Hovered'); }
        case 'browser_hover_selector':         { await hoverSelector(cdp, a.selector as string); return ok('Hovered'); }
        case 'browser_scroll':                 { await scroll(cdp, a.direction as any, a.amount as number); return ok('Scrolled'); }
        case 'browser_scroll_to':              return ok(await scrollToElement(cdp, a.selector as string));
        case 'browser_scroll_to_top':          { await scrollToTop(cdp); return ok('Scrolled to top'); }
        case 'browser_scroll_to_bottom':       { await scrollToBottom(cdp); return ok('Scrolled to bottom'); }
        case 'browser_scroll_to_coords':       { await scrollToCoords(cdp, a.x as number, a.y as number); return ok('Scrolled'); }
        case 'browser_get_scroll_position':    return ok(await getScrollPosition(cdp));
        // Keyboard & input
        case 'browser_type':                   { await typeText(cdp, a.text as string); return ok('Typed'); }
        case 'browser_press_key':              { await pressKey(cdp, a.key as string, a.modifiers as string[] | undefined); return ok('Key pressed'); }
        case 'browser_key_chord':              { await keyChord(cdp, a.modifiers as string[], a.key as string); return ok('Chord sent'); }
        case 'browser_clear_input':            { await clearInput(cdp, a.selector as string); return ok('Input cleared'); }
        case 'browser_focus':                  { await focusElement(cdp, a.selector as string); return ok('Focused'); }
        case 'browser_blur':                   { await blurActiveElement(cdp); return ok('Blurred'); }
        case 'browser_select_option':          { await elementSelectOption(cdp, a.selector as string, a.value as string); return ok('Selected'); }
        case 'browser_set_value':              { await setValue(cdp, a.selector as string, a.value as string); return ok('Value set'); }
        case 'browser_get_form_values':        return ok(await getFormValues(cdp, a.selector as string));
        case 'browser_handle_dialog':          { await handleDialog(cdp, a.accept as boolean, a.prompt_text as string | undefined); return ok('Dialog handled'); }
        case 'browser_file_upload':            { await uploadFile(cdp, a.selector as string, a.file_paths as string[]); return ok('Files set'); }
        // Evaluate & query
        case 'browser_evaluate':               return ok(await evaluate(cdp, a.script as string));
        case 'browser_get_text':               return ok(await getText(cdp, a.selector as string));
        case 'browser_get_all_text':           return ok(await getAllText(cdp, a.selector as string));
        case 'browser_get_attribute':          return ok(await getAttribute(cdp, a.selector as string, a.attribute as string));
        case 'browser_get_all_attributes':     return ok(await getAllAttributes(cdp, a.selector as string, a.attribute as string));
        case 'browser_is_visible':             return ok({ visible: await isVisible(cdp, a.selector as string) });
        case 'browser_find_text':              return ok(await findText(cdp, a.text as string));
        // DOM manipulation
        case 'browser_set_attribute':          { await setAttribute(cdp, a.selector as string, a.attribute as string, a.value as string); return ok('Attribute set'); }
        case 'browser_remove_attribute':       { await removeAttribute(cdp, a.selector as string, a.attribute as string); return ok('Attribute removed'); }
        case 'browser_add_class':              { await addClass(cdp, a.selector as string, a.class_name as string); return ok('Class added'); }
        case 'browser_remove_class':           { await removeClass(cdp, a.selector as string, a.class_name as string); return ok('Class removed'); }
        case 'browser_inject_css':             return ok({ styleId: await injectCss(cdp, a.css as string) });
        case 'browser_remove_css':             { await removeInjectedCss(cdp, a.style_id as string); return ok('Style removed'); }
        case 'browser_submit_form':            { await submitForm(cdp, a.selector as string); return ok('Form submitted'); }
        case 'browser_reset_form':             { await resetForm(cdp, a.selector as string); return ok('Form reset'); }
        // Clipboard
        case 'browser_set_clipboard':          { await writeClipboardText(cdp, a.text as string); return ok('Clipboard set'); }
        case 'browser_get_clipboard':          { const r = await getClipboardTextV2(cdp); return ok({ text: r.content[0].text }); }
        // IndexedDB
        case 'browser_list_indexed_databases': return ok(await listIndexedDatabases(cdp));
        case 'browser_get_all_indexed_db':     return ok(await getAllIndexedDb(cdp, a.db_name as string, a.store_name as string));
        case 'browser_get_indexed_db':         return ok(await getIndexedDb(cdp, a.db_name as string, a.store_name as string, a.key as any));
        case 'browser_clear_indexed_db':       { await clearIndexedDb(cdp, a.db_name as string, a.store_name as string); return ok('IndexedDB store cleared'); }
        // Extraction
        case 'browser_get_inner_html':         return ok(await getInnerHtml(cdp, a.selector as string));
        case 'browser_get_table':              return ok(await getTableData(cdp, a.selector as string));
        case 'browser_screenshot_element':     return okImage(await screenshotElement(cdp, a.selector as string));
        // Shadow DOM
        case 'browser_query_shadow':           return ok(await queryShadow(cdp, a.host_selector as string, a.shadow_selector as string));
        case 'browser_get_shadow_html':        return ok(await getShadowHtml(cdp, a.host_selector as string));
        case 'browser_evaluate_in_shadow':     return ok(await evaluateInShadow(cdp, a.host_selector as string, a.script as string));
        // Storage
        case 'browser_get_cookies':            return ok(await getCookies(cdp));
        case 'browser_set_cookie':             { await setCookie(cdp, a.name as string, a.value as string, { domain: a.domain as string | undefined, path: a.path as string | undefined, expires: a.expires as number | undefined, httpOnly: a.http_only as boolean | undefined, secure: a.secure as boolean | undefined }); return ok('Cookie set'); }
        case 'browser_delete_cookies':         { await deleteCookies(cdp, a.name as string, { domain: a.domain as string | undefined }); return ok('Cookies deleted'); }
        case 'browser_clear_cookies':          { await clearAllCookies(cdp); return ok('Cookies cleared'); }
        case 'browser_get_local_storage':      return ok(await getLocalStorage(cdp, a.key as string));
        case 'browser_set_local_storage':      { await setLocalStorage(cdp, a.key as string, a.value as string); return ok('localStorage set'); }
        case 'browser_remove_local_storage':   { await removeLocalStorage(cdp, a.key as string); return ok('localStorage key removed'); }
        case 'browser_get_all_local_storage':  return ok(await getAllLocalStorage(cdp));
        case 'browser_clear_local_storage':    { await clearLocalStorage(cdp); return ok('localStorage cleared'); }
        case 'browser_get_session_storage':    return ok(await getSessionStorage(cdp, a.key as string));
        case 'browser_set_session_storage':    { await setSessionStorage(cdp, a.key as string, a.value as string); return ok('sessionStorage set'); }
        case 'browser_remove_session_storage': { await removeSessionStorage(cdp, a.key as string); return ok('sessionStorage key removed'); }
        case 'browser_get_all_session_storage':return ok(await getAllSessionStorage(cdp));
        case 'browser_clear_session_storage':  { await clearSessionStorage(cdp); return ok('sessionStorage cleared'); }
        // Element state
        case 'browser_is_enabled':             return ok({ enabled: await isEnabled(cdp, a.selector as string) });
        case 'browser_is_checked':             return ok({ checked: await isChecked(cdp, a.selector as string) });
        case 'browser_get_bounding_box':       return ok(await getBoundingBox(cdp, a.selector as string));
        case 'browser_count_elements':         return ok({ count: await countElements(cdp, a.selector as string) });
        case 'browser_get_computed_style':     return ok({ value: await getElementComputedStyle(cdp, a.selector as string, a.property as string) });
        case 'browser_get_select_options':     return ok(await getSelectOptions(cdp, a.selector as string));
        // JS errors
        case 'browser_get_js_errors':          return ok(getJsErrors(cdp));
        case 'browser_clear_js_errors':        { clearJsErrors(cdp); return ok('JS error buffer cleared'); }
        // Network capture
        case 'browser_network_log_start':      { await startNetworkLog(cdp); return ok('Network capture started'); }
        case 'browser_network_log_get':        return ok(getNetworkLog(cdp));
        case 'browser_network_log_clear':      { clearNetLog(cdp); return ok('Network capture buffer cleared'); }
        case 'browser_network_log_stop':       return ok(await stopNetworkLog(cdp));
        // Emulation
        case 'browser_set_user_agent':         { await setUserAgent(cdp, a.user_agent as string); return ok('User-Agent set'); }
        case 'browser_set_device_metrics':     { await setDeviceMetrics(cdp, { width: a.width as number, height: a.height as number, deviceScaleFactor: a.device_scale_factor as number | undefined, mobile: a.mobile as boolean | undefined }); return ok('Device metrics set'); }
        case 'browser_clear_device_metrics':   { await clearDeviceMetrics(cdp); return ok('Device metrics cleared'); }
        case 'browser_set_network_conditions': { await setNetworkConditions(cdp, { offline: a.offline as boolean | undefined, latency: a.latency as number | undefined, downloadThroughput: a.download_throughput as number | undefined, uploadThroughput: a.upload_throughput as number | undefined, connectionType: a.connection_type as string | undefined }); return ok('Network conditions set'); }
        case 'browser_clear_network_conditions':{ await clearNetworkConditions(cdp); return ok('Network conditions cleared'); }
        case 'browser_set_geolocation':        { await setGeolocation(cdp, a.latitude as number, a.longitude as number, a.accuracy as number | undefined); return ok('Geolocation set'); }
        case 'browser_clear_geolocation':      { await clearGeolocation(cdp); return ok('Geolocation cleared'); }
        case 'browser_grant_permission':       { await grantPermission(cdp, a.permission as string, a.origin as string | undefined); return ok('Permission granted'); }
        case 'browser_reset_permissions':      { await resetPermissions(cdp); return ok('Permissions reset'); }
        case 'browser_set_media_type':         { await setMediaType(cdp, a.media as string); return ok('Media type set'); }
        case 'browser_set_color_scheme':       { await setColorScheme(cdp, a.scheme as string); return ok('Color scheme set'); }
        case 'browser_set_prefers_reduced_motion': { await setPrefersReducedMotion(cdp, a.value as string); return ok('Reduced motion set'); }
        case 'browser_set_extra_headers':      { await setExtraHeaders(cdp, a.headers as Record<string, string>); return ok('Extra headers set'); }
        case 'browser_clear_extra_headers':    { await clearExtraHeaders(cdp); return ok('Extra headers cleared'); }
        // Performance
        case 'browser_get_paint_timing':       return ok(await getPaintTiming(cdp));
        case 'browser_get_navigation_timing':  return ok(await getNavigationTiming(cdp));
        case 'browser_get_resource_timings':   return ok(await getResourceTimings(cdp));
        case 'browser_clear_performance_buffer': { await clearPerformanceBuffer(cdp); return ok('Performance buffer cleared'); }
        // Network interception
        case 'browser_intercept_request': {
          const cleanup = await interceptRequest(cdp, { urlPattern: a.url_pattern as string, status: a.status as number | undefined, body: a.body as string | undefined, contentType: a.content_type as string | undefined });
          // Store cleanup in a module-level map keyed by session for later clearing
          _interceptCleanups.set(sessionId, [...(_interceptCleanups.get(sessionId) ?? []), cleanup]);
          return ok('Interception active');
        }
        case 'browser_get_response_body':      return ok(await getResponseBody(cdp, a.request_id as string));
        case 'browser_clear_interceptions': {
          const cleanups = _interceptCleanups.get(sessionId) ?? [];
          for (const fn of cleanups) await fn().catch(() => {});
          _interceptCleanups.delete(sessionId);
          await clearInterceptions(cdp);
          return ok('Interceptions cleared');
        }
        // Frames
        case 'browser_get_frames':             return ok(await getFrames(cdp));
        case 'browser_evaluate_in_frame':      return ok(await evaluateInFrame(cdp, a.selector as string, a.script as string));
        case 'browser_switch_frame':           return ok({ frameId: await switchToFrame(cdp, a.selector as string) });
        case 'browser_switch_main_frame':      { switchToMainFrame(cdp); return ok('Switched to main frame'); }
        // Input type helpers
        case 'browser_set_range':              { await setRangeValue(cdp, a.selector as string, a.value as number); return ok('Range value set'); }
        case 'browser_set_date':               { await setDateValue(cdp, a.selector as string, a.value as string); return ok('Date value set'); }
        case 'browser_set_color':              { await setColorValue(cdp, a.selector as string, a.value as string); return ok('Color value set'); }
        case 'browser_set_selection_range':    { await setSelectionRange(cdp, a.selector as string, a.start as number, a.end as number); return ok('Selection range set'); }
        // Touch
        case 'browser_tap':                    { await tapAt(cdp, a.x as number, a.y as number); return ok('Tapped'); }
        case 'browser_swipe':                  { await swipeAt(cdp, a.start_x as number, a.start_y as number, a.end_x as number, a.end_y as number, a.steps as number | undefined); return ok('Swiped'); }
        case 'browser_pinch_zoom':             { await pinchZoom(cdp, a.x as number, a.y as number, a.from_distance as number, a.to_distance as number, a.steps as number | undefined); return ok('Pinch zoom applied'); }
        // WebSocket monitor
        case 'browser_websocket_start':        { await startWebSocketLog(cdp); return ok('WebSocket capture started'); }
        case 'browser_websocket_messages':     return ok(getWebSocketMessages(cdp));
        case 'browser_websocket_connections':  return ok(getWebSocketConnections(cdp));
        case 'browser_websocket_clear':        { clearWebSocketLog(cdp); return ok('WebSocket buffer cleared'); }
        case 'browser_websocket_stop':         return ok(await stopWebSocketLog(cdp));
        // CSS & JS coverage
        case 'browser_start_css_coverage':     { await startCssCoverage(cdp); return ok('CSS coverage started'); }
        case 'browser_stop_css_coverage':      return ok(await stopCssCoverage(cdp));
        case 'browser_start_js_coverage':      { await startJsCoverage(cdp); return ok('JS coverage started'); }
        case 'browser_take_js_coverage':       return ok(await takeJsCoverage(cdp));
        case 'browser_stop_js_coverage':       return ok(await stopJsCoverage(cdp));
        // Service workers
        case 'browser_list_service_workers':   return ok(await listServiceWorkers(cdp));
        case 'browser_unregister_service_worker': return ok({ unregistered: await unregisterServiceWorker(cdp, a.scope_url as string) });
        case 'browser_update_service_worker':  { await updateServiceWorker(cdp, a.scope_url as string); return ok('Service worker updated'); }
        case 'browser_is_controlled_by_sw':    return ok({ controlled: await isControlledByServiceWorker(cdp) });
        // Security inspection
        case 'browser_get_security_info':      return ok(await getSecurityInfo(cdp));
        case 'browser_has_mixed_content':      return ok({ mixed: await hasMixedContent(cdp) });
        case 'browser_get_csp':                return ok(await getCSPInfo(cdp));
        case 'browser_get_third_party_domains':return ok(await getThirdPartyDomains(cdp));
        case 'browser_is_secure_context':      return ok({ secure: await isSecureContext(cdp) });
        // Network utilities
        case 'browser_block_urls':             { await blockUrls(cdp, a.patterns as string[]); return ok('URLs blocked'); }
        case 'browser_clear_blocked_urls':     { await clearBlockedUrls(cdp); return ok('Blocked URLs cleared'); }
        case 'browser_enable_cors_override': {
          const cleanupCors = await enableCorsOverride(cdp);
          _interceptCleanups.set(sessionId, [...(_interceptCleanups.get(sessionId) ?? []), cleanupCors]);
          return ok('CORS override active');
        }
        case 'browser_start_header_capture':   { startHeaderCapture(cdp); return ok('Header capture started'); }
        case 'browser_stop_header_capture':    { stopHeaderCapture(cdp); return ok('Header capture stopped'); }
        case 'browser_get_response_headers':   return ok(await getResponseHeaders(cdp, a.request_id as string));
        case 'browser_wait_for_network_quiet': { await waitForNetworkQuiet(cdp, a.idle_ms as number | undefined, a.timeout_ms as number | undefined); return ok('Network quiet'); }
        case 'browser_block_next_request': {
          const cleanupBlock = await blockNextRequest(cdp, a.url_pattern as string);
          _interceptCleanups.set(sessionId, [...(_interceptCleanups.get(sessionId) ?? []), cleanupBlock]);
          return ok('Next matching request will be blocked');
        }
        // Cache API
        case 'browser_list_caches':            return ok(await listCacheNames(cdp));
        case 'browser_get_cache_entries':      return ok(await getCacheEntries(cdp, a.cache_name as string));
        case 'browser_delete_cache':           return ok({ deleted: await deleteCache(cdp, a.cache_name as string) });
        case 'browser_delete_cache_entry':     return ok({ deleted: await deleteCacheEntry(cdp, a.cache_name as string, a.url as string) });
        case 'browser_clear_all_caches':       { await clearAllCaches(cdp); return ok('All caches cleared'); }
        case 'browser_get_storage_quota':      return ok(await getStorageQuota(cdp));
        case 'browser_get_storage_breakdown':  return ok(await getStorageBreakdown(cdp));
        // Visual inspection
        case 'browser_get_z_index':            return ok({ zIndex: await getZIndex(cdp, a.selector as string) });
        case 'browser_get_elements_at_point':  return ok(await getElementsAtPoint(cdp, a.x as number, a.y as number));
        case 'browser_get_pixel_color':        return ok(await getPixelColor(cdp, a.x as number, a.y as number));
        case 'browser_get_colors':             return ok(await getColors(cdp, a.selector as string));
        case 'browser_highlight_element':      return ok({ styleId: await highlightElement(cdp, a.selector as string, a.color as string | undefined) });
        case 'browser_remove_highlight':       { await removeHighlight(cdp, a.style_id as string); return ok('Highlight removed'); }
        case 'browser_do_elements_overlap':    return ok({ overlap: await doElementsOverlap(cdp, a.selector1 as string, a.selector2 as string) });
        case 'browser_get_font_info':          return ok(await getFontInfo(cdp, a.selector as string));
        // DOM mutation observer
        case 'browser_mutation_start':         { await startMutationObserver(cdp, a.observer_id as string, a.selector as string, { childList: a.child_list as boolean | undefined, attributes: a.attributes as boolean | undefined, characterData: a.character_data as boolean | undefined, subtree: a.subtree as boolean | undefined }); return ok('Mutation observer started'); }
        case 'browser_mutation_get':           return ok(await getMutations(cdp, a.observer_id as string));
        case 'browser_mutation_clear':         { await clearMutations(cdp, a.observer_id as string); return ok('Mutation buffer cleared'); }
        case 'browser_mutation_stop':          return ok(await stopMutationObserver(cdp, a.observer_id as string));
        case 'browser_mutation_stop_all':      { await stopAllMutationObservers(cdp); return ok('All mutation observers stopped'); }
        case 'browser_wait_for_mutation':      return ok(await waitForMutation(cdp, a.observer_id as string, a.timeout_ms as number | undefined));
        // Media
        case 'browser_get_media':              return ok(await getMediaElements(cdp));
        case 'browser_play_media':             { await playMedia(cdp, a.selector as string); return ok('Playing'); }
        case 'browser_pause_media':            { await pauseMedia(cdp, a.selector as string); return ok('Paused'); }
        case 'browser_seek_media':             { await seekMedia(cdp, a.selector as string, a.time as number); return ok('Seeked'); }
        case 'browser_set_media_volume':       { await setMediaVolume(cdp, a.selector as string, a.volume as number); return ok('Volume set'); }
        case 'browser_set_media_muted':        { await setMediaMuted(cdp, a.selector as string, a.muted as boolean); return ok('Muted state set'); }
        case 'browser_set_playback_rate':      { await setPlaybackRate(cdp, a.selector as string, a.rate as number); return ok('Playback rate set'); }
        case 'browser_wait_for_media_ready':   { await waitForMediaReady(cdp, a.selector as string, a.ready_state as number | undefined, a.timeout_ms as number | undefined); return ok('Media ready'); }
        // DOM events & performance marks
        case 'browser_dispatch_event':         { await dispatchDomEvent(cdp, a.selector as string, a.event_type as string, { bubbles: a.bubbles as boolean | undefined, cancelable: a.cancelable as boolean | undefined, detail: a.detail, key: a.key as string | undefined, ctrlKey: a.ctrl_key as boolean | undefined, shiftKey: a.shift_key as boolean | undefined, altKey: a.alt_key as boolean | undefined, metaKey: a.meta_key as boolean | undefined, button: a.button as number | undefined, clientX: a.client_x as number | undefined, clientY: a.client_y as number | undefined }); return ok('Event dispatched'); }
        case 'browser_trigger_react_change':   { await triggerReactChange(cdp, a.selector as string, a.value as string); return ok('React change triggered'); }
        case 'browser_wait_for_event':         return ok(await waitForEvent(cdp, a.selector as string, a.event_type as string, a.timeout_ms as number | undefined));
        case 'browser_get_performance_marks':  return ok(await getPerformanceMarks(cdp));
        case 'browser_set_performance_mark':   { await setPerformanceMark(cdp, a.name as string); return ok('Mark set'); }
        case 'browser_measure_performance':    return ok({ durationMs: await measurePerformance(cdp, a.name as string, a.start_mark as string, a.end_mark as string) });
        // Tab state
        case 'browser_get_all_tabs':           return ok(await getAllTabSnapshots(cdp, config.debugPort));
        case 'browser_find_tabs_by_url':       return ok(await findTabsByUrl(cdp, config.debugPort, a.url_pattern as string));
        case 'browser_duplicate_tab':          return ok({ newTabId: await duplicateTab(config.debugPort, a.tab_id as string) });
        case 'browser_get_tab_info':           return ok(await getTabInfo(cdp, config.debugPort, a.tab_id as string));
        case 'browser_wait_for_tab_load':      { await waitForTabLoad(cdp, config.debugPort, a.tab_id as string, a.timeout_ms as number | undefined); return ok('Tab loaded'); }
        // Page snapshot
        case 'browser_page_snapshot':          return ok(await getPageSnapshot(cdp));
        // Page metadata
        case 'browser_get_meta_tags':          return ok(await getMetaTags(cdp));
        case 'browser_get_link_tags':          return ok(await getLinkTags(cdp));
        case 'browser_get_ready_state':        return ok({ readyState: await getReadyState(cdp) });
        case 'browser_wait_for_load':          { await waitForDOMContentLoaded(cdp, a.timeout_ms as number | undefined); return ok('Page loaded'); }
        // Evaluate helpers
        case 'browser_evaluate_on_element':    return ok(await evaluateOnElement(cdp, a.selector as string, a.script as string));
        case 'browser_get_window_globals':     return ok(await getWindowGlobals(cdp));
        // Downloads
        case 'browser_download_start':         { await startDownloadMonitor(cdp, a.download_path as string | undefined); return ok('Download monitoring started'); }
        case 'browser_download_get':           return ok(getDownloads(cdp));
        case 'browser_download_clear':         { clearDownloads(cdp); return ok('Download buffer cleared'); }
        case 'browser_download_stop':          return ok(await stopDownloadMonitor(cdp));
        case 'browser_wait_for_download':      return ok(await waitForDownload(cdp, a.url_pattern as string | undefined, a.timeout_ms as number | undefined));
        // Accessibility (extended)
        case 'browser_get_ax_subtree':         return ok(await getAxSubtree(cdp, a.selector as string));
        case 'browser_get_focused_element':    return ok(await getFocusedElement(cdp));
        case 'browser_get_interactive_ax_nodes': return ok(await getInteractiveAxNodes(cdp));
        case 'browser_get_live_regions':       return ok(await getLiveRegions(cdp));
        // Dialog
        case 'browser_wait_for_dialog':        return ok(await waitForDialog(cdp, { accept: (a.accept as boolean) ?? true, promptText: a.prompt_text as string | undefined, timeoutMs: a.timeout_ms as number | undefined }));
        case 'browser_is_dialog_open':         return ok({ open: await isDialogOpen(cdp) });
        case 'browser_dismiss_print_dialog':   { await dismissPrintDialog(cdp); return ok('Print dialog dismissed'); }
        // Iframes (CDP-level)
        case 'browser_list_iframes':           return ok(await listIframes(cdp));
        case 'browser_evaluate_in_iframe':     return ok(await evaluateInIframe(cdp, a.frame as string, a.expression as string));
        case 'browser_get_iframe_content':     return ok(await getIframeContent(cdp, a.frame as string));
        case 'browser_click_in_iframe':        { await clickInIframe(cdp, a.frame as string, a.selector as string); return ok('Clicked'); }
        case 'browser_type_in_iframe':         { await typeInIframe(cdp, a.frame as string, a.selector as string, a.text as string); return ok('Typed'); }
        case 'browser_wait_for_iframe':        return ok(await waitForIframe(cdp, a.url_pattern as string, a.timeout_ms as number | undefined));
        // Smart form fill
        case 'browser_fill_form':              return ok(await fillForm(cdp, a.fields as any[]));
        case 'browser_detect_form_fields':     return ok(await detectFormFields(cdp, a.form_selector as string | undefined));
        case 'browser_smart_submit_form':      { await autofillSubmitForm(cdp, a.form_selector as string | undefined); return ok('Form submitted'); }
        case 'browser_clear_form':             { await clearForm(cdp, a.form_selector as string | undefined); return ok('Form cleared'); }
        case 'browser_get_form_state':         return ok(await getFormState(cdp, a.form_selector as string | undefined));
        // Composite waiters
        case 'browser_wait_for_any':           return ok({ matched: await waitForAny(cdp, a.selectors as string[], a.timeout_ms as number | undefined) });
        case 'browser_wait_for_all':           { await waitForAll(cdp, a.selectors as string[], a.timeout_ms as number | undefined); return ok('All found'); }
        case 'browser_wait_for_condition':     return ok(await waitForCondition(cdp, a.expression as string, a.timeout_ms as number | undefined));
        case 'browser_wait_for_stable':        { await waitForStable(cdp, a.selector as string, a.stable_ms as number | undefined, a.timeout_ms as number | undefined); return ok('Stable'); }
        case 'browser_wait_for_value_change':  return ok({ value: await waitForValueChange(cdp, a.selector as string, a.timeout_ms as number | undefined) });
        case 'browser_wait_for_count_change':  return ok({ count: await waitForCountChange(cdp, a.selector as string, a.direction as 'increase' | 'decrease' | 'any' | undefined, a.timeout_ms as number | undefined) });
        case 'browser_retry_until_success':    return ok(await retryUntilSuccess(cdp, a.expression as string, a.max_attempts as number | undefined, a.delay_ms as number | undefined));
        // Advanced pointer
        case 'browser_mouse_path':             { await mousePath(cdp, a.points as Array<{x: number; y: number}>, a.delay_ms as number | undefined); return ok('Path traced'); }
        case 'browser_smooth_drag':            { await smoothDrag(cdp, a.from_x as number, a.from_y as number, a.to_x as number, a.to_y as number, a.steps as number | undefined); return ok('Dragged'); }
        case 'browser_drag_selector':          { await dragSelector(cdp, a.source_selector as string, a.target_selector as string); return ok('Dragged'); }
        case 'browser_hover_sequence':         { await hoverSequence(cdp, a.selectors as string[], a.delay_ms as number | undefined); return ok('Hover sequence done'); }
        case 'browser_multi_click':            { await multiClick(cdp, a.x as number, a.y as number, a.count as number, a.delay_ms as number | undefined); return ok('Clicked'); }
        case 'browser_context_click':          { await contextClickAt(cdp, a.x as number, a.y as number); return ok('Context-clicked'); }
        case 'browser_middle_click':           { await middleClickAt(cdp, a.x as number, a.y as number); return ok('Middle-clicked'); }
        case 'browser_get_mouse_position':     return ok(await getMousePosition(cdp));
        // Action recorder
        case 'browser_record_start':           { await startRecording(cdp); return ok('Recording started'); }
        case 'browser_record_stop':            return ok(await stopRecording(cdp));
        case 'browser_record_get':             return ok(await getRecordedActions(cdp));
        case 'browser_record_clear':           { await clearRecording(cdp); return ok('Recording cleared'); }
        case 'browser_is_recording':           return ok({ recording: isRecording(cdp) });
        // Semantic element finder
        case 'browser_find_by_label':          return ok(await findByLabel(cdp, a.label_text as string));
        case 'browser_find_by_placeholder':    return ok(await findByPlaceholder(cdp, a.placeholder as string));
        case 'browser_find_button':            return ok(await findButton(cdp, a.text as string));
        case 'browser_find_by_role':           return ok(await findByRole(cdp, a.role as string, a.name as string | undefined));
        case 'browser_find_by_text':           return ok(await findByText(cdp, a.text as string, a.tag_name as string | undefined));
        case 'browser_find_near_label':        return ok(await findNearLabel(cdp, a.label_text as string));
        case 'browser_get_element_selector':   return ok({ selector: await getElementSelector(cdp, a.x as number, a.y as number) });
        // Advanced scrolling
        case 'browser_scroll_until_visible':   return ok({ found: await scrollUntilVisible(cdp, a.selector as string, a.max_scrolls as number | undefined, a.scroll_amount as number | undefined) });
        case 'browser_scroll_until_text':      return ok({ found: await scrollUntilText(cdp, a.text as string, a.max_scrolls as number | undefined) });
        case 'browser_scroll_container':       { await scrollContainer(cdp, a.selector as string, a.direction as 'up' | 'down' | 'left' | 'right', a.amount as number); return ok('Scrolled'); }
        case 'browser_scroll_container_to_end': { await scrollContainerToEnd(cdp, a.selector as string, a.direction as 'top' | 'bottom' | 'left' | 'right'); return ok('Scrolled to end'); }
        case 'browser_get_container_scroll':   return ok(await getContainerScrollState(cdp, a.selector as string));
        case 'browser_infinite_scroll':        return ok({ stopped: await infiniteScrollUntil(cdp, a.trigger_selector as string, a.stop_condition as string, a.max_clicks as number | undefined) });
        case 'browser_smooth_scroll_to':       { await smoothScrollTo(cdp, a.x as number, a.y as number, a.duration_ms as number | undefined); return ok('Scrolled'); }
        // Toast & notification
        case 'browser_wait_for_toast':         return ok(await waitForToast(cdp, { selector: a.selector as string | undefined, timeoutMs: a.timeout_ms as number | undefined }));
        case 'browser_get_toasts':             return ok(await getToasts(cdp));
        case 'browser_wait_for_toast_containing': return ok(await waitForToastContaining(cdp, a.text as string, a.timeout_ms as number | undefined));
        case 'browser_dismiss_toast':          return ok({ dismissed: await dismissToast(cdp, a.selector as string | undefined) });
        case 'browser_intercept_notifications': { await interceptBrowserNotification(cdp); return ok('Notification API intercepted'); }
        case 'browser_get_notifications':      return ok(await getCapturedNotifications(cdp));
        case 'browser_clear_notifications':    { await clearCapturedNotifications(cdp); return ok('Notifications cleared'); }
        case 'browser_wait_for_banner_change': return ok({ text: await waitForBannerChange(cdp, a.selector as string, a.timeout_ms as number | undefined) });
        // Table (advanced)
        case 'browser_table_headers':          return ok(await getTableHeaders(cdp, a.selector as string));
        case 'browser_table_row_count':        return ok({ count: await getTableRowCount(cdp, a.selector as string) });
        case 'browser_table_column_values':    return ok(await getTableColumnValues(cdp, a.selector as string, a.column_index as number));
        case 'browser_table_column_by_name':   return ok(await getTableColumn(cdp, a.selector as string, a.column_name as string));
        case 'browser_table_find_row':         return ok(await findTableRow(cdp, a.selector as string, a.search_text as string));
        case 'browser_table_filter_rows':      return ok(await filterTableRows(cdp, a.selector as string, a.column_index as number, a.filter_text as string));
        case 'browser_table_click_header':     { await clickTableHeader(cdp, a.selector as string, a.column_name as string); return ok('Clicked header'); }
        case 'browser_table_click_cell':       { await clickTableCell(cdp, a.selector as string, a.row_index as number, a.column_index as number); return ok('Clicked cell'); }
        // File upload (advanced)
        case 'browser_find_file_inputs':       return ok(await findFileInputs(cdp));
        case 'browser_set_files_cdp':          { await setFilesOnInput(cdp, a.selector as string, a.files as string[]); return ok('Files set'); }
        case 'browser_wait_upload_complete':   return ok(await waitForUploadComplete(cdp, a.selector as string, a.timeout_ms as number | undefined));
        case 'browser_get_upload_progress':    return ok(await getUploadProgress(cdp, a.selector as string));
        case 'browser_simulate_file_drop':     { await simulateDragDropFile(cdp, a.selector as string, a.file_name as string, a.file_content as string, a.mime_type as string | undefined); return ok('File dropped'); }
        case 'browser_click_and_upload':       { await clickAndUpload(cdp, a.selector as string, a.files as string[]); return ok('Files uploaded'); }
        // Layout & positioning
        case 'browser_get_viewport_elements':  return ok(await getViewportElements(cdp));
        case 'browser_is_in_viewport':         return ok(await isInViewport(cdp, a.selector as string));
        case 'browser_get_element_center':     return ok(await getElementCenter(cdp, a.selector as string));
        case 'browser_get_relative_position':  return ok(await getRelativePosition(cdp, a.selector as string, a.reference_selector as string));
        case 'browser_get_elements_in_region': return ok(await getElementsInRegion(cdp, a.x as number, a.y as number, a.width as number, a.height as number));
        case 'browser_get_page_dimensions':    return ok(await getPageDimensions(cdp));
        case 'browser_get_layout_shift':       return ok(await getLayoutShift(cdp));
        case 'browser_get_absolute_position':  return ok(await getAbsolutePosition(cdp, a.selector as string));
        // Debug & diagnostics
        case 'browser_get_obstruction':        return ok(await getElementObstruction(cdp, a.selector as string));
        case 'browser_get_clickable_state':    return ok(await getClickableState(cdp, a.selector as string));
        case 'browser_get_event_listeners':    return ok(await getEventListeners(cdp, a.selector as string));
        case 'browser_page_diagnostic':        return ok(await getPageDiagnostic(cdp));
        case 'browser_find_stale_elements':    return ok(await findStaleElements(cdp, (a.selectors as string[] | undefined) ?? []));
        case 'browser_get_computed_properties':return ok(await getComputedProperties(cdp, a.selector as string, a.properties as string[]));
        case 'browser_check_visibility':       return ok(await checkVisibility(cdp, a.selector as string));
        // Clipboard (advanced)
        case 'browser_read_clipboard':         return ok({ text: await getClipboardText(cdp) });
        case 'browser_write_clipboard':        { await setClipboardText(cdp, a.text as string); return ok('Clipboard written'); }
        case 'browser_clear_clipboard':        { await clearClipboard(cdp); return ok('Clipboard cleared'); }
        case 'browser_read_clipboard_html':    return ok({ html: await getClipboardHtml(cdp) });
        case 'browser_write_clipboard_html':   { await setClipboardText(cdp, a.html as string); return ok('HTML written to clipboard'); }
        case 'browser_copy_from_element':      return ok({ text: await copyElementHtml(cdp, a.selector as string) });
        case 'browser_paste_into_element':     { await pasteTextAtCursor(cdp, a.text as string); return ok('Pasted'); }
        case 'browser_clipboard_history_length': return ok({ length: await getClipboardItemTypes(cdp) });
        // Animations
        case 'browser_get_animations':         return ok(await getAnimations(cdp));
        case 'browser_get_element_animations': return ok(await getElementAnimations(cdp, a.selector as string));
        case 'browser_pause_animations':       { await pauseAllAnimations(cdp); return ok('Animations paused'); }
        case 'browser_resume_animations':      { await resumeAllAnimations(cdp); return ok('Animations resumed'); }
        case 'browser_set_animation_speed':    { await setAnimationSpeed(cdp, a.rate as number); return ok(`Playback rate set to ${a.rate}`); }
        case 'browser_finish_animations':      { await finishAllAnimations(cdp); return ok('Animations finished'); }
        case 'browser_cancel_element_animations': { await cancelElementAnimations(cdp, a.selector as string); return ok('Animations cancelled'); }
        case 'browser_wait_animations_finished': { await waitForAnimationsFinished(cdp, a.selector as string | undefined, a.timeout_ms as number | undefined); return ok('Animations finished'); }
        // Canvas
        case 'browser_get_canvas_elements':    return ok(await getCanvasElements(cdp));
        case 'browser_canvas_to_data_url':     return ok({ dataUrl: await canvasToDataUrl(cdp, a.selector as string) });
        case 'browser_get_canvas_dimensions':  return ok(await getCanvasDimensions(cdp, a.selector as string));
        case 'browser_get_canvas_pixel':       return ok(await getCanvasPixelColor(cdp, a.selector as string, a.x as number, a.y as number));
        case 'browser_clear_canvas':           { await clearCanvas(cdp, a.selector as string); return ok('Canvas cleared'); }
        case 'browser_draw_text_on_canvas':    { await drawTextOnCanvas(cdp, a.selector as string, a.text as string, a.x as number, a.y as number, a.font as string | undefined, a.color as string | undefined); return ok('Text drawn'); }
        case 'browser_draw_rect_on_canvas':    { await drawRectOnCanvas(cdp, a.selector as string, a.x as number, a.y as number, a.width as number, a.height as number, a.color as string | undefined, a.fill as boolean | undefined); return ok('Rect drawn'); }
        case 'browser_canvas_equals':          return ok({ equal: await canvasEquals(cdp, a.selector1 as string, a.selector2 as string) });
        // Text search
        case 'browser_find_text_matches':      return ok(await findTextMatches(cdp, a.search_text as string, a.case_sensitive as boolean | undefined));
        case 'browser_count_text':             return ok({ count: await countTextOccurrences(cdp, a.search_text as string, a.case_sensitive as boolean | undefined) });
        case 'browser_get_selected_text':      return ok({ text: await getSelectedText(cdp) });
        case 'browser_select_all_text_in':     { await selectAllTextInElement(cdp, a.selector as string); return ok('Text selected'); }
        case 'browser_highlight_all_text':     return ok({ count: await highlightAllText(cdp, a.search_text as string, a.color as string | undefined) });
        case 'browser_clear_highlights':       { await clearHighlights(cdp); return ok('Highlights cleared'); }
        case 'browser_replace_text_in':        return ok({ replaced: await replaceTextInElement(cdp, a.selector as string, a.search_text as string, a.replacement as string) });
        case 'browser_scroll_to_text':         return ok({ found: await scrollToText(cdp, a.search_text as string, a.case_sensitive as boolean | undefined) });
        // Geolocation / locale
        case 'browser_set_geolocation_city':   return ok(await setGeolocationCity(cdp, a.city as string));
        case 'browser_get_geolocation':        return ok(await getCurrentGeolocation(cdp, a.timeout_ms as number | undefined));
        case 'browser_set_timezone':           { await setTimezone(cdp, a.timezone_id as string); return ok('Timezone set'); }
        case 'browser_get_timezone':           return ok({ timezone: await getTimezone(cdp) });
        case 'browser_set_locale':             { await setLocale(cdp, a.locale as string); return ok('Locale set'); }
        case 'browser_get_locale':             return ok({ locale: await getLocale(cdp) });
        // Responsive / viewport
        case 'browser_set_device':             return ok(await setDevicePreset(cdp, a.device_name as string));
        case 'browser_get_viewport':           return ok(await getViewportSize(cdp));
        case 'browser_reset_viewport':         { await resetViewport(cdp); return ok('Viewport reset'); }
        case 'browser_check_media_query':      return ok({ matches: await checkMediaQuery(cdp, a.query as string) });
        case 'browser_get_breakpoints':        return ok(await getActiveBreakpoints(cdp));
        case 'browser_responsive_screenshots': return ok(await responsiveScreenshots(cdp));
        case 'browser_find_overflow':          return ok(await findHorizontalOverflow(cdp));
        // Crypto / hashing
        case 'browser_hash_string':            return ok({ hash: await hashString(cdp, a.input as string, a.algorithm as 'sha-1' | 'sha-256' | 'sha-384' | 'sha-512' | undefined) });
        case 'browser_hash_element':           return ok({ hash: await hashElementContent(cdp, a.selector as string, a.algorithm as string | undefined) });
        case 'browser_generate_uuid':          return ok({ uuid: await generateUuid(cdp) });
        case 'browser_random_bytes':           return ok({ hex: await randomBytes(cdp, a.count as number) });
        case 'browser_random_int':             return ok({ value: await randomInt(cdp, a.min as number, a.max as number) });
        case 'browser_base64_encode':          return ok({ encoded: await base64Encode(cdp, a.input as string) });
        case 'browser_base64_decode':          return ok({ decoded: await base64Decode(cdp, a.input as string) });
        case 'browser_hmac_sha256':            return ok({ hmac: await hmacSha256(cdp, a.key as string, a.message as string) });
        // Page load / performance
        case 'browser_web_vitals':             return ok(await getWebVitals(cdp));
        case 'browser_navigation_timing':      return ok(await getNavigationTiming2(cdp));
        case 'browser_slow_resources':         return ok(await getSlowResources(cdp, a.min_duration_ms as number | undefined));
        case 'browser_time_to_interactive':    return ok({ tti: await getTimeToInteractive(cdp) });
        case 'browser_render_blocking':        return ok(await getRenderBlockingResources(cdp));
        case 'browser_memory_usage':           return ok(await getMemoryUsage(cdp));
        case 'browser_dom_node_count':         return ok(await getDomNodeCount(cdp));
        case 'browser_load_timeline':          return ok(await getLoadTimeline(cdp));
        // Web Workers
        case 'browser_get_workers':            return ok(await getWorkerList(cdp));
        case 'browser_evaluate_in_worker':     return ok({ result: await evaluateInWorker(cdp, a.worker_id as string, a.expression as string) });
        case 'browser_worker_count':           return ok({ count: await getWorkerCount(cdp) });
        case 'browser_terminate_worker':       { await terminateWorker(cdp, a.worker_id as string); return ok('Worker terminated'); }
        case 'browser_get_dedicated_workers':  return ok(await getDedicatedWorkers(cdp));
        case 'browser_get_worker_by_url':      return ok(await getWorkerByUrl(cdp, a.url_fragment as string));
        case 'browser_wait_for_worker':        return ok(await waitForWorker(cdp, a.url_fragment as string, a.timeout_ms as number | undefined));
        case 'browser_post_to_worker':         { await postMessageToWorker(cdp, a.worker_id as string, a.message); return ok('Message posted'); }
        // IndexedDB record-level
        case 'browser_idb_count':              return ok({ count: await countRecords(cdp, a.db_name as string, a.store_name as string) });
        case 'browser_idb_get':                return ok(await getRecord(cdp, a.db_name as string, a.store_name as string, a.key));
        case 'browser_idb_put':                { await putRecord(cdp, a.db_name as string, a.store_name as string, a.value, a.key); return ok('Record written'); }
        case 'browser_idb_delete':             { await deleteRecord(cdp, a.db_name as string, a.store_name as string, a.key); return ok('Record deleted'); }
        case 'browser_idb_get_keys':           return ok(await getAllKeys(cdp, a.db_name as string, a.store_name as string));
        case 'browser_idb_query':              return ok(await queryRecords(cdp, a.db_name as string, a.store_name as string, a.index_name as string, a.query));
        case 'browser_idb_store_names':        return ok(await getObjectStoreNames(cdp, a.db_name as string));
        case 'browser_idb_clear_store':        { await clearObjectStore(cdp, a.db_name as string, a.store_name as string); return ok('Store cleared'); }
        // Fonts
        case 'browser_get_page_fonts':         return ok(await getPageFonts(cdp));
        case 'browser_get_element_font':       return ok(await getElementFont(cdp, a.selector as string));
        case 'browser_find_by_font':           return ok(await findElementsByFont(cdp, a.font_family as string));
        case 'browser_get_font_stack':         return ok(await getFontStack(cdp, a.selector as string));
        case 'browser_check_font_loaded':      return ok({ loaded: await checkFontLoaded(cdp, a.font_family as string) });
        case 'browser_get_loaded_fonts':       return ok(await getLoadedFonts(cdp));
        case 'browser_wait_fonts_ready':       { await waitForFontsReady(cdp, a.timeout_ms as number | undefined); return ok('Fonts ready'); }
        case 'browser_get_font_metrics':       return ok(await getFontMetrics(cdp, a.selector as string));
        // Permissions
        case 'browser_deny_permission':        { await denyPermission(cdp, a.permission as string, a.origin as string); return ok('Permission revoked'); }
        case 'browser_check_permission':       return ok({ state: await checkPermission(cdp, a.permission_name as string) });
        case 'browser_grant_geolocation':      { await grantGeolocation(cdp, a.origin as string); return ok('Geolocation granted'); }
        case 'browser_grant_notifications':    { await grantNotifications(cdp, a.origin as string); return ok('Notifications granted'); }
        case 'browser_grant_clipboard':        { await grantClipboardAccess(cdp, a.origin as string); return ok('Clipboard access granted'); }
        case 'browser_get_permission_state':   return ok(await getPermissionState(cdp));
        // CSS inspection
        case 'browser_get_css_vars':           return ok(await getCssVariables(cdp, a.selector as string | undefined));
        case 'browser_set_css_var':            { await setCssVariable(cdp, a.name as string, a.value as string, a.selector as string | undefined); return ok('CSS variable set'); }
        case 'browser_get_stylesheets':        return ok(await getStylesheets(cdp));
        case 'browser_get_matching_rules':     return ok(await getMatchingRules(cdp, a.selector as string));
        case 'browser_get_inline_style':       return ok(await getInlineStyle(cdp, a.selector as string));
        case 'browser_set_inline_style':       { await setInlineStyle(cdp, a.selector as string, a.property as string, a.value as string); return ok('Inline style set'); }
        case 'browser_remove_inline_style':    { await removeInlineStyle(cdp, a.selector as string, a.property as string); return ok('Inline style removed'); }
        case 'browser_get_used_css':           return ok(await getUsedCssProperties(cdp, a.selector as string, a.properties as string[]));
        // Text selection / caret
        case 'browser_get_selection_range':    return ok(await getSelectionRange(cdp));
        case 'browser_select_text_range':      { await selectText(cdp, a.selector as string, a.start_offset as number, a.end_offset as number); return ok('Text selected'); }
        case 'browser_clear_selection':        { await clearSelection(cdp); return ok('Selection cleared'); }
        case 'browser_get_caret':              return ok(await getCaretPosition(cdp));
        case 'browser_set_caret':              { await setCaretInElement(cdp, a.selector as string, a.offset as number); return ok('Caret set'); }
        case 'browser_copy_selection':         return ok({ text: await copySelectionToClipboard(cdp) });
        // Touch events
        case 'browser_touch_tap':              { await touchTap(cdp, a.x as number, a.y as number); return ok('Touch tap sent'); }
        case 'browser_touch_double_tap':       { await touchDoubleTap(cdp, a.x as number, a.y as number); return ok('Touch double tap sent'); }
        case 'browser_touch_long_press':       { await touchLongPress(cdp, a.x as number, a.y as number, a.duration_ms as number | undefined); return ok('Long press sent'); }
        case 'browser_touch_swipe':            { await touchSwipe(cdp, a.start_x as number, a.start_y as number, a.end_x as number, a.end_y as number, a.steps as number | undefined); return ok('Touch swipe sent'); }
        case 'browser_touch_pinch':            { await touchPinch(cdp, a.center_x as number, a.center_y as number, a.scale as number); return ok('Touch pinch sent'); }
        case 'browser_touch_scroll':           { await touchScroll(cdp, a.x as number, a.y as number, a.delta_x as number, a.delta_y as number); return ok('Touch scroll sent'); }
        case 'browser_touch_drag':             { await touchDrag(cdp, a.start_x as number, a.start_y as number, a.end_x as number, a.end_y as number); return ok('Touch drag sent'); }
        case 'browser_get_touch_support':      return ok(await getTouchSupport(cdp));
        // Dark mode / color scheme
        case 'browser_dark_mode':              { await setDarkMode(cdp); return ok('Dark mode set'); }
        case 'browser_light_mode':             { await setLightMode(cdp); return ok('Light mode set'); }
        case 'browser_clear_color_scheme':     { await clearColorScheme(cdp); return ok('Color scheme cleared'); }
        case 'browser_get_color_scheme':       return ok({ scheme: await getColorScheme(cdp) });
        case 'browser_set_contrast':           { await setContrastPreference(cdp, a.value as 'more' | 'less' | 'no-preference'); return ok('Contrast set'); }
        case 'browser_get_theme_colors':       return ok(await getThemeColors(cdp));
        case 'browser_theme_screenshots':      return ok(await takeThemeScreenshots(cdp));
        // Printing / PDF
        case 'browser_print_pdf_full':      return ok({ pdf: await printToPdfBuffer(cdp, { landscape: a.landscape as boolean | undefined, paperWidth: a.paper_width as number | undefined, paperHeight: a.paper_height as number | undefined, marginTop: a.margin_top as number | undefined, marginBottom: a.margin_bottom as number | undefined, marginLeft: a.margin_left as number | undefined, marginRight: a.margin_right as number | undefined, printBackground: a.print_background as boolean | undefined }) });
        case 'browser_get_page_count':      return ok({ count: await getPageCount(cdp) });
        case 'browser_get_printable_area':  return ok(await getPrintableArea(cdp));
        case 'browser_set_page_title':      { await setPageTitle(cdp, a.title as string); return ok('Title set'); }
        case 'browser_inject_print_style':  { await injectPrintStyle(cdp, a.css as string); return ok('Print style injected'); }
        case 'browser_remove_print_styles': { await removePrintStyles(cdp); return ok('Print styles removed'); }
        case 'browser_get_print_rules':     return ok(await getPrintCssRules(cdp));
        case 'browser_page_to_html':        return ok({ html: await printPageToHtml(cdp) });
        // Viewport / scroll state
        case 'browser_full_page_size':      return ok(await getFullPageDimensions(cdp));
        case 'browser_get_visible_rect':    return ok(await getVisibleRect(cdp));
        case 'browser_is_fully_visible':    return ok({ visible: await isElementFullyVisible(cdp, a.selector as string) });
        case 'browser_visibility_ratio':    return ok({ ratio: await getElementVisibilityRatio(cdp, a.selector as string) });
        case 'browser_offscreen_elements':  return ok(await getOffScreenElements(cdp));
        case 'browser_get_scrollable':      return ok(await getScrollableElements(cdp));
        case 'browser_element_scroll_pos':  return await getElementScrollPosition(cdp, a.selector as string);
        // Timing / polling
        case 'browser_sleep':               { await sleep(cdp, a.ms as number); return ok('Done'); }
        case 'browser_measure_duration':    return ok(await measureDuration(cdp, a.expression as string));
        case 'browser_wait_idle':           { await waitUntilIdle(cdp, a.idle_ms as number | undefined, a.timeout_ms as number | undefined); return ok('Idle'); }
        case 'browser_wait_expression':     { await waitForExpressionTrue(cdp, a.expression as string, a.polling_ms as number | undefined, a.timeout_ms as number | undefined); return ok('Expression true'); }
        case 'browser_debounce_evaluate':   return ok({ result: await debounceEvaluate(cdp, a.expression as string, a.wait_ms as number) });
        case 'browser_retry_evaluate':      return ok({ result: await retryEvaluate(cdp, a.expression as string, a.max_retries as number, a.retry_delay_ms as number | undefined) });
        case 'browser_high_res_time':       return ok({ time: await getHighResolutionTime(cdp) });
        case 'browser_measure_expression':  return ok(await measureExpressionTime(cdp, a.expression as string, a.runs as number | undefined));
        // XPath queries
        case 'browser_xpath_first':         return ok(await xpathFirst(cdp, a.xpath as string));
        case 'browser_xpath_all':           return ok(await xpathAll(cdp, a.xpath as string));
        case 'browser_xpath_count':         return ok({ count: await xpathCount(cdp, a.xpath as string) });
        case 'browser_xpath_text':          return ok({ text: await xpathText(cdp, a.xpath as string) });
        case 'browser_xpath_exists':        return ok({ exists: await xpathExists(cdp, a.xpath as string) });
        case 'browser_xpath_click':         { await xpathClick(cdp, a.xpath as string); return ok('Clicked'); }
        case 'browser_xpath_attr':          return ok({ value: await xpathGetAttribute(cdp, a.xpath as string, a.attribute as string) });
        case 'browser_xpath_wait':          return ok(await xpathWaitFor(cdp, a.xpath as string, a.timeout_ms as number | undefined));
        // Status
        case 'browser_status': {
          if (!cdp.isConnected()) return ok({ connected: false, port: config.debugPort });
          const target = await cdp.getActiveTarget();
          return ok({ connected: true, port: config.debugPort, sessionId, sessionName: sessionName ?? null, activeTab: target ? { url: target.url, title: target.title } : null });
        }
        // Auth
        case 'browser_auth_check': {
          const checks = config.authChecks ?? AUTH_PRESETS;
          return ok(await checkAllAuth(cdp, checks));
        }
        case 'browser_wait_for_auth': {
          const platformName = a.platform as string | undefined;
          const checks = config.authChecks ?? AUTH_PRESETS;
          const check = platformName ? checks.find(c => c.name.toLowerCase() === platformName.toLowerCase()) : checks[0];
          if (!check) return fail(`Unknown platform: ${platformName}`, 'AUTH_PLATFORM_NOT_FOUND', `Known: ${checks.map(c => c.name).join(', ')}`);
          return ok({ loggedIn: await waitForAuth(cdp, check, (a.timeout_ms as number) ?? 120000), platform: check.name });
        }
        // highlight2
        case 'browser_highlight_elements':     return ok(await highlightElements(cdp, a.selector as string, a.color as string | undefined));
        case 'browser_remove_highlights':      { await removeHighlights(cdp); return ok('Highlights removed'); }
        case 'browser_highlight_with_label':   return ok(await highlightWithLabel(cdp, a.selector as string, a.label as string));
        case 'browser_flash_element':          { await flashElement(cdp, a.selector as string, a.times as number | undefined); return ok('Flashed'); }
        case 'browser_get_bounding_boxes':     return ok(await getBoundingBoxes(cdp, a.selector as string));
        case 'browser_draw_overlay':           return ok({ overlayId: await drawOverlay(cdp, a.x as number, a.y as number, a.width as number, a.height as number, a.color as string | undefined) });
        case 'browser_remove_overlay':         { await removeOverlay(cdp, a.overlay_id as string); return ok('Overlay removed'); }
        case 'browser_clear_overlays':         { await clearAllOverlays(cdp); return ok('All overlays removed'); }
        // input2
        case 'browser_type_with_delay':        { await typeWithDelay(cdp, a.text as string, a.delay_ms as number); return ok('Typed'); }
        case 'browser_clear_and_type':         { await clearAndType(cdp, a.selector as string, a.text as string); return ok('Cleared and typed'); }
        case 'browser_press_key_combo':        { await pressKeyCombo(cdp, a.keys as string[]); return ok('Keys pressed'); }
        case 'browser_fill_by_label':          { await fillInputByLabel(cdp, a.label as string, a.value as string); return ok('Filled'); }
        case 'browser_check_checkbox':         { await checkCheckbox(cdp, a.selector as string); return ok('Checked'); }
        case 'browser_uncheck_checkbox':       { await uncheckCheckbox(cdp, a.selector as string); return ok('Unchecked'); }
        case 'browser_select_radio':           { await selectRadio(cdp, a.selector as string); return ok('Selected'); }
        case 'browser_type_contenteditable':   { await typeIntoContentEditable(cdp, a.selector as string, a.text as string); return ok('Typed'); }
        // pageinfo
        case 'browser_page_language':          return ok({ language: await getPageLanguage(cdp) });
        case 'browser_page_charset':           return ok({ charset: await getCharset(cdp) });
        case 'browser_canonical_url':          return ok({ url: await getCanonicalUrl(cdp) });
        case 'browser_og_tags':                return ok(await getOpenGraphTags(cdp));
        case 'browser_twitter_tags':           return ok(await getTwitterCardTags(cdp));
        case 'browser_structured_data':        return ok(await getStructuredData(cdp));
        case 'browser_word_count':             return ok({ count: await getPageWordCount(cdp) });
        case 'browser_external_links':         return ok(await getExternalLinks(cdp));
        // network2
        case 'browser_network_timings':        return ok(await getNetworkTimings(cdp));
        case 'browser_largest_requests':       return ok(await getLargestRequests(cdp, a.limit as number | undefined));
        case 'browser_failed_requests':        return ok(await getFailedRequests(cdp));
        case 'browser_request_count':          return ok(await getRequestCount(cdp));
        case 'browser_service_worker_info':    return ok(await getServiceWorkerInfo(cdp));
        case 'browser_page_protocol':          return ok({ protocol: await getPageProtocol(cdp) });
        case 'browser_dns_lookup_time':        return ok({ ms: await getDnsLookupTime(cdp, a.hostname as string) });
        case 'browser_cached_requests':        return ok(await getCachedRequests(cdp));
        // storage2
        case 'browser_localstorage_size':      return ok(await getLocalStorageSize(cdp));
        case 'browser_search_localstorage':    return ok(await searchLocalStorage(cdp, a.query as string));
        case 'browser_sessionstorage_size':    return ok(await getSessionStorageSize(cdp));
        case 'browser_dump_storage':           return ok(await dumpAllStorage(cdp));
        case 'browser_cookie_count':           return ok({ count: await getCookieCount(cdp) });
        case 'browser_cookie_domains':         return ok(await getCookieDomains(cdp));
        case 'browser_storage_estimate':       return ok(await getStorageEstimate(cdp));
        case 'browser_clear_origin_storage':   { await clearOriginStorage(cdp); return ok('Storage cleared'); }
        // dom2
        case 'browser_create_element':         return ok(await createElement(cdp, a.parent_selector as string, a.tag as string, a.attrs as Record<string,string> | undefined, a.text as string | undefined));
        case 'browser_remove_element':         return ok({ removed: await removeElement(cdp, a.selector as string) });
        case 'browser_wrap_element':           { await wrapElement(cdp, a.selector as string, a.wrapper_tag as string, a.wrapper_class as string | undefined); return ok('Wrapped'); }
        case 'browser_unwrap_element':         { await unwrapElement(cdp, a.selector as string); return ok('Unwrapped'); }
        case 'browser_clone_element':          { await cloneElement(cdp, a.selector as string, a.target_parent as string); return ok('Cloned'); }
        case 'browser_move_element':           { await moveElement(cdp, a.selector as string, a.target_parent as string); return ok('Moved'); }
        case 'browser_set_element_text':       { await setElementText(cdp, a.selector as string, a.text as string); return ok('Text set'); }
        case 'browser_get_element_count':      return ok({ count: await getElementCount(cdp, a.selector as string) });
        // modal
        case 'browser_is_modal_open':          return await isModalOpen(cdp);
        case 'browser_get_modal_content':      return ok({ content: await getModalContent(cdp) });
        case 'browser_close_modal':            return ok({ closed: await closeModal(cdp) });
        case 'browser_wait_for_modal':         return ok({ found: await waitForModal(cdp, a.timeout_ms as number | undefined) });
        case 'browser_get_modal_buttons':      return ok(await getModalButtons(cdp));
        case 'browser_click_modal_button':     { await clickModalButton(cdp, a.button_text as string); return ok('Clicked'); }
        case 'browser_is_overlay_blocking':    return ok({ blocking: await isOverlayBlocking(cdp, a.selector as string) });
        case 'browser_dismiss_overlay':        { await dismissOverlay(cdp); return ok('Dismissed'); }
        // url2
        case 'browser_get_url_parts':          return ok(await getUrlParts(cdp));
        case 'browser_get_query_params':       return ok(await getQueryParams(cdp));
        case 'browser_set_query_param':        { await setQueryParam(cdp, a.key as string, a.value as string); return ok('Set'); }
        case 'browser_remove_query_param':     { await removeQueryParam(cdp, a.key as string); return ok('Removed'); }
        case 'browser_get_hash':               return ok({ hash: await getHashFragment(cdp) });
        case 'browser_set_hash':               { await setHashFragment(cdp, a.hash as string); return ok('Hash set'); }
        case 'browser_navigate_to_hash':       { await navigateToHash(cdp, a.element_id as string); return ok('Navigated'); }
        case 'browser_navigation_history':     return ok(await getNavigationHistory(cdp));
        // table3
        case 'browser_get_full_table_data':    return ok(await getFullTableData(cdp, a.selector as string));
        case 'browser_get_table_row_data':     return ok(await getTableRowData(cdp, a.selector as string, a.row_index as number));
        case 'browser_get_table_cell_text':    return ok({ text: await getTableCellText(cdp, a.selector as string, a.row_index as number, a.col_index as number) });
        case 'browser_sort_table_column':      { await sortTableByColumn(cdp, a.selector as string, a.col_index as number); return ok('Sorted'); }
        case 'browser_table_page_info':        return ok(await getTablePageInfo(cdp, a.selector as string));
        case 'browser_export_table_csv':       return ok({ csv: await exportTableAsCsv(cdp, a.selector as string) });
        case 'browser_get_selected_rows':      return ok(await getSelectedTableRows(cdp, a.selector as string));
        case 'browser_highlight_table_row':    { await highlightTableRow(cdp, a.selector as string, a.row_index as number, a.color as string | undefined); return ok('Row highlighted'); }
        // geolocation3
        case 'browser_set_geolocation_accuracy': { await setGeolocationAccuracy(cdp, a.accuracy as number); return ok('Accuracy set'); }
        case 'browser_simulate_movement':      { await simulateMovement(cdp, a.steps as any[], a.interval_ms as number | undefined); return ok('Movement simulated'); }
        case 'browser_high_accuracy_mode':     { await setHighAccuracyMode(cdp, a.lat as number, a.lng as number); return ok('High accuracy mode set'); }
        case 'browser_low_accuracy_mode':      { await setLowAccuracyMode(cdp, a.lat as number, a.lng as number); return ok('Low accuracy mode set'); }
        case 'browser_set_battery_level':      { await setBatteryLevel(cdp, a.level as number, a.charging as boolean | undefined); return ok('Battery level set'); }
        case 'browser_clear_battery_override': { await clearBatteryOverride(cdp); return ok('Battery override cleared'); }
        case 'browser_set_screen_orientation': { await setScreenOrientation(cdp, a.type as 'portraitPrimary' | 'landscapePrimary' | 'portraitSecondary' | 'landscapeSecondary', a.angle as number); return ok('Orientation set'); }
        case 'browser_clear_screen_orientation': { await clearScreenOrientation(cdp); return ok('Orientation cleared'); }
        // capture2
        case 'browser_screenshot_full_page':   return ok(await takeFullPageScreenshot(cdp));
        case 'browser_screenshot_viewport':    return ok(await takeViewportScreenshot(cdp));
        case 'browser_screenshot_region':      return ok(await takeRegionScreenshot(cdp, a.x as number, a.y as number, a.width as number, a.height as number));
        case 'browser_screenshot_jpeg':        return ok(await takeJpegScreenshot(cdp, a.quality as number | undefined));
        case 'browser_compare_screenshots':    return ok(compareScreenshots(cdp, a.base64a as string, a.base64b as string));
        case 'browser_full_page_dimensions2':  return ok(await getFullPageDimensions2(cdp));
        case 'browser_screenshot_after_delay': return ok(await takeScreenshotAfterDelay(cdp, a.delay_ms as number));
        case 'browser_screenshot_selector':    return ok(await screenshotSelector(cdp, a.selector as string));
        // scroll3
        case 'browser_scroll_depth':           return ok(await getScrollDepth(cdp));
        case 'browser_is_at_bottom':           return ok({ bottom: await isScrolledToBottom(cdp) });
        case 'browser_is_at_top':              return ok({ top: await isScrolledToTop(cdp) });
        case 'browser_get_scrollable_parent':  return ok({ parent: await getScrollableParent(cdp, a.selector as string) });
        case 'browser_scroll_by':              { await scrollByAmount(cdp, a.x as number, a.y as number); return ok('Scrolled'); }
        case 'browser_scroll_element_by':      { await scrollElementBy(cdp, a.selector as string, a.x as number, a.y as number); return ok('Scrolled'); }
        case 'browser_scrollbar_width':        return ok({ width: await getScrollbarWidth(cdp) });
        case 'browser_scroll_to_percent':      { await scrollToPercent(cdp, a.percent as number); return ok('Scrolled'); }
        // focus
        case 'browser_get_focused_selector':   return ok({ selector: await getFocusedSelector(cdp) });
        case 'browser_tab_next':               { await tabToNext(cdp); return ok('Tabbed forward'); }
        case 'browser_tab_prev':               { await tabToPrev(cdp); return ok('Tabbed backward'); }
        case 'browser_get_focusable':          return ok(await getFocusableElements(cdp));
        case 'browser_trap_focus':             { await trapFocusInElement(cdp, a.selector as string); return ok('Focus trapped'); }
        case 'browser_is_focus_trapped':       return ok({ trapped: await isFocusTrapped(cdp) });
        case 'browser_release_focus_trap':     { await releaseFocusTrap(cdp); return ok('Focus trap released'); }
        case 'browser_focus_nth':              { await focusNthElement(cdp, a.selector as string, a.n as number); return ok('Focused'); }
        // search2
        case 'browser_find_elements_by_text':  return ok(await findElementsByText(cdp, a.text as string, a.tag as string | undefined));
        case 'browser_get_text_blocks':        return ok(await getPageTextBlocks(cdp));
        case 'browser_find_by_regex':          return ok(await findByRegex(cdp, a.pattern as string, a.flags as string | undefined));
        case 'browser_get_headings':           return ok(await getHeadings(cdp));
        case 'browser_get_paragraphs':         return ok(await getParagraphs(cdp));
        case 'browser_get_list_items':         return ok(await getListItems(cdp));
        case 'browser_count_words':            return ok({ count: await countWords(cdp, a.selector as string | undefined) });
        case 'browser_extract_emails':         return ok(await extractEmails(cdp));
        // device
        case 'browser_get_browser_info':       return ok(await getBrowserInfo(cdp));
        case 'browser_get_screen_info':        return ok(await getScreenInfo(cdp));
        case 'browser_is_mobile':              return ok({ mobile: await isMobileDevice(cdp) });
        case 'browser_is_touch':               return ok({ touch: await isTouchDevice(cdp) });
        case 'browser_media_capabilities':     return ok(await getMediaCapabilities(cdp));
        case 'browser_feature_support':        return ok(await getFeatureSupport(cdp));
        case 'browser_network_type':           return ok(await getNetworkType(cdp));
        case 'browser_time_info':              return ok(await getTimeInfo(cdp));
        // form2
        case 'browser_form_fields':            return ok(await getFormFields(cdp, a.form_selector as string));
        case 'browser_form_validation_errors': return ok(await getFormValidationErrors(cdp, a.form_selector as string));
        case 'browser_is_form_valid':          return ok({ valid: await isFormValid(cdp, a.form_selector as string) });
        case 'browser_required_fields':        return ok(await getRequiredFields(cdp, a.form_selector as string));
        case 'browser_empty_required_fields':  return ok(await getEmptyRequiredFields(cdp, a.form_selector as string));
        case 'browser_list_select_options':    return ok(await listSelectOptions(cdp, a.selector as string));
        case 'browser_set_multi_select':       { await setMultipleSelectValues(cdp, a.selector as string, a.values as string[]); return ok('Values set'); }
        case 'browser_checked_checkboxes':     return ok(await getCheckedCheckboxes(cdp, a.form_selector as string));
        // media2
        case 'browser_get_video_state':        return await getVideoState(cdp, a.selector as string);
        case 'browser_mute_media':             return await muteMedia(cdp, a.selector as string);
        case 'browser_unmute_media':           return await unmuteMedia(cdp, a.selector as string);
        // animation
        case 'browser_pause_element_anims':    return await pauseAnimations(cdp, a.selector as string);
        case 'browser_play_element_anims':     return await playAnimations(cdp, a.selector as string);
        case 'browser_get_transitions':        return await getTransitions(cdp, a.selector as string);
        case 'browser_element_anim_count':     return await getAnimationCount(cdp, a.selector as string);
        case 'browser_element_anim_rate':      return await setAnimationPlaybackRate(cdp, a.selector as string, a.rate as number);
        case 'browser_page_anim_count':        return await getPageAnimationCount(cdp);
        case 'browser_cancel_element_anims':   return await cancelAnimations(cdp, a.selector as string);
        // accessibility2
        case 'browser_aria_attributes':        return await getAriaAttributes(cdp, a.selector as string);
        case 'browser_get_role':               return await getRole(cdp, a.selector as string);
        case 'browser_get_tabindex':           return await getTabIndex(cdp, a.selector as string);
        case 'browser_check_image_alts':       return await checkImageAlts(cdp);
        case 'browser_heading_structure':      return await getHeadingStructure(cdp);
        case 'browser_get_landmarks':          return await getLandmarks(cdp);
        case 'browser_aria_labelledby':        return await getAriaLabelledBy(cdp, a.selector as string);
                // iframe new tools
        case 'browser_get_iframes':            return ok(await getIframes(cdp));
        case 'browser_iframe_count':           return ok(await getIframeCount(cdp));
        case 'browser_is_iframe_sandboxed':    return ok(await isIframeSandboxed(cdp, a.selector as string));
        case 'browser_iframe_src':             return ok(await getIframeSrc(cdp, a.selector as string));
        case 'browser_set_iframe_src':         { await setIframeSrc(cdp, a.selector as string, a.src as string); return ok('Source set'); }
        case 'browser_scroll_iframe_into_view': { await scrollIframeIntoView(cdp, a.selector as string); return ok('Scrolled into view'); }
        case 'browser_iframe_position':        return ok(await getIframePosition(cdp, a.selector as string));
        case 'browser_is_iframe_visible':      return ok(await isIframeVisible(cdp, a.selector as string));
        // events2
        case 'browser_check_event_handlers':   return await checkEventHandlers(cdp, a.selector as string);
        case 'browser_dispatch_custom_event':  return await dispatchCustomEvent(cdp, a.selector as string, a.event_name as string, a.detail as string ?? '{}');
        case 'browser_trigger_mouse_event':    return await triggerMouseEvent(cdp, a.selector as string, a.event_type as string);
        case 'browser_trigger_key_event':      return await triggerKeyEvent(cdp, a.selector as string, a.event_type as string, a.key as string);
        case 'browser_trigger_input_event':    return await triggerInputEvent(cdp, a.selector as string);
        case 'browser_trigger_focus_event':    return await triggerFocusEvent(cdp, a.selector as string, a.type as string);
        case 'browser_wait_for_dom_mutation':  return await waitForDomMutation(cdp, a.selector as string, a.timeout_ms as number ?? 5000);
        case 'browser_form_submit_url':        return await getFormSubmitUrl(cdp, a.selector as string);
        // performance2
        case 'browser_perf_entries':           return await getPerformanceEntries(cdp);
        case 'browser_nav_timing':             return await getNavigationTiming3(cdp);
        case 'browser_resource_timings':       return await getResourceTimings3(cdp);
        case 'browser_long_tasks':             return await getLongTasks(cdp);
        case 'browser_memory_info':            return await getMemoryInfo(cdp);
        case 'browser_cls':                    return await getCLS(cdp);
        case 'browser_fcp':                    return await getFCP(cdp);
        case 'browser_lcp':                    return await getLCP(cdp);
                // shadow-dom
        case 'browser_has_shadow_root':          return await hasShadowRoot(cdp, a.selector as string);
        case 'browser_shadow_children':          return await getShadowChildren(cdp, a.selector as string);
        case 'browser_query_shadow_root':        return await queryShadowRoot(cdp, a.selector as string, a.inner_selector as string);
        case 'browser_shadow_root_mode':         return await getShadowRootMode(cdp, a.selector as string);
        case 'browser_shadow_host_content':      return await getShadowHostContent(cdp, a.selector as string);
        case 'browser_count_shadow_roots':       return await countShadowRoots(cdp);
        case 'browser_shadow_host_elements':     return await getShadowHostElements(cdp);
        case 'browser_shadow_slots':             return await getShadowSlots(cdp, a.selector as string);
        // css2
        case 'browser_computed_color':           return await getComputedColor(cdp, a.selector as string);
        case 'browser_css_vars2':                return await getCssVariables2(cdp);
        case 'browser_set_css_var2':             return await setCssVariable2(cdp, a.name as string, a.value as string);
        case 'browser_element_classes':          return await getElementClasses(cdp, a.selector as string);
        case 'browser_toggle_class':             return await toggleClass(cdp, a.selector as string, a.class_name as string);
        case 'browser_computed_property':        return await getComputedProperty(cdp, a.selector as string, a.property as string);
        case 'browser_set_inline_style2':        return await setInlineStyle2(cdp, a.selector as string, a.property as string, a.value as string);
        case 'browser_stylesheet_count':         return await getStylesheetCount(cdp);
        // observer
        case 'browser_wait_element_added':       return await waitForElementAdded(cdp, a.selector as string, a.timeout_ms as number ?? 5000);
        case 'browser_wait_element_removed2':    return await waitForElementRemoved2(cdp, a.selector as string, a.timeout_ms as number ?? 5000);
        case 'browser_wait_text_change':         return await waitForTextChange(cdp, a.selector as string, a.timeout_ms as number ?? 5000);
        case 'browser_wait_class_change':        return await waitForClassChange(cdp, a.selector as string, a.timeout_ms as number ?? 5000);
        case 'browser_intersection_ratio':       return await getIntersectionRatio(cdp, a.selector as string);
        case 'browser_wait_value_change2':       return await waitForValueChange2(cdp, a.selector as string, a.timeout_ms as number ?? 5000);
        case 'browser_resize_info':              return await getResizeInfo(cdp, a.selector as string);
        case 'browser_wait_attribute_change':    return await waitForAttributeChange(cdp, a.selector as string, a.attribute as string, a.timeout_ms as number ?? 5000);
                // clipboard extended
        case 'browser_copy_element_text':        return await copyElementText(cdp, a.selector as string);
        case 'browser_selection_text':           return await getSelectedTextV2(cdp);
        case 'browser_select_all_text':          return await selectAllText(cdp, a.selector as string);
        case 'browser_clear_selection_alt':      return await clearPageSelection(cdp);
        case 'browser_clipboard_access':         return await isClipboardSupported(cdp);
        case 'browser_paste_at_cursor':          return ok('pasteAtCursor is no longer supported; use writeClipboardText instead');
        // storage2 new
        case 'browser_localstorage_keys':        return await getLocalStorageKeys(cdp);
        case 'browser_sessionstorage_keys':      return await getSessionStorageKeys(cdp);
        case 'browser_localstorage_size_info':   return await getLocalStorageSizeInfo(cdp);
        case 'browser_wipe_localstorage':        return await wipeLocalStorage(cdp);
        case 'browser_wipe_sessionstorage':      return await wipeSessionStorage(cdp);
        case 'browser_indexeddb_databases':      return await getIndexedDBDatabases(cdp);
        case 'browser_cookie_count_info':        return await getCookieCountInfo(cdp);
        case 'browser_storage_quota':            return await getStorageQuotaInfo(cdp);
        // network3
        case 'browser_connection_type':          return await getConnectionType(cdp);
        case 'browser_is_online':                return await isOnline(cdp);
        case 'browser_page_location':            return await getPageLocation(cdp);
        case 'browser_open_websockets':          return await getOpenWebSockets(cdp);
        case 'browser_service_worker_registrations': return await getServiceWorkerRegistrations(cdp);
        case 'browser_beacon_support':           return await getBeaconSupport(cdp);
        case 'browser_page_referrer':            return await getPageReferrer(cdp);
                // drag2
        case 'browser_draggable_elements':       return await getDraggableElements(cdp);
        case 'browser_drop_zones':               return await getDropZones(cdp);
        case 'browser_simulate_drag_start':      return await simulateDragStart(cdp, a.selector as string);
        case 'browser_simulate_drag_end':        return await simulateDragEnd(cdp, a.selector as string);
        case 'browser_simulate_drag_enter':      return await simulateDragEnter(cdp, a.selector as string);
        case 'browser_simulate_drag_over':       return await simulateDragOver(cdp, a.selector as string);
        case 'browser_simulate_drop':            return await simulateDrop(cdp, a.selector as string);
        case 'browser_is_draggable':             return await isDraggable(cdp, a.selector as string);
        // dialog2
        case 'browser_dialog_elements':          return await getDialogElements(cdp);
        case 'browser_open_dialogs':             return await getOpenDialogs(cdp);
        case 'browser_open_dialog':              return await openDialog(cdp, a.selector as string);
        case 'browser_close_dialog':             return await closeDialog(cdp, a.selector as string);
        case 'browser_dialog_return_value':      return await getDialogReturnValue(cdp, a.selector as string);
        case 'browser_is_dialog_open_el':        return await isDialogOpenEl(cdp, a.selector as string);
        case 'browser_active_modals':            return await getActiveModals(cdp);
        case 'browser_click_dialog_button':      return await clickDialogButton(cdp, a.dialog_selector as string);
        // canvas2
        case 'browser_canvas_elements2':         return await getCanvasElements2(cdp);
        case 'browser_canvas_size':              return await getCanvasSize(cdp, a.selector as string);
        case 'browser_clear_canvas2':            return await clearCanvas2(cdp, a.selector as string);
        case 'browser_canvas_data_url':          return await getCanvasDataUrl(cdp, a.selector as string);
        case 'browser_draw_rect_canvas2':        return await drawRectOnCanvas2(cdp, a.selector as string, a.x as number, a.y as number, a.width as number, a.height as number);
        case 'browser_canvas_pixel_color2':      return await getCanvasPixelColor2(cdp, a.selector as string, a.x as number, a.y as number);
        case 'browser_is_webgl_canvas':          return await isWebGLCanvas(cdp, a.selector as string);
        case 'browser_canvas_count':             return await getCanvasCount(cdp);
                // pointer events
        case 'browser_pointer_events':           return await getPointerEvents(cdp);
        case 'browser_pointer_down':             return await simulatePointerDown(cdp, a.selector as string);
        case 'browser_pointer_up':               return await simulatePointerUp(cdp, a.selector as string);
        case 'browser_pointer_move':             return await simulatePointerMove(cdp, a.selector as string, a.x as number, a.y as number);
        case 'browser_pointer_cancel':           return await simulatePointerCancel(cdp, a.selector as string);
        case 'browser_pointer_enter':            return await simulatePointerEnter(cdp, a.selector as string);
        case 'browser_pointer_capture':          return await getPointerCapture(cdp, a.selector as string);
        case 'browser_touch_action':             return await getTouchActionStyle(cdp, a.selector as string);
        // timing2
        case 'browser_dom_loaded_time':          return await getDomContentLoadedTime(cdp);
        case 'browser_load_event_time':          return await getLoadEventTime(cdp);
        case 'browser_ttfb':                     return await getTimeToFirstByte(cdp);
        case 'browser_page_timing_summary':      return await getPageTimingSummary(cdp);
        case 'browser_first_paint':              return await getFirstPaint(cdp);
        case 'browser_fcp':                      return await getFirstContentfulPaint(cdp);
        case 'browser_resource_count':           return await getResourceCount(cdp);
        case 'browser_slow_resources2':          return await getSlowResources2(cdp, a.threshold_ms as number | undefined);
        // geolocation
        case 'browser_set_geolocation2':         return await setGeolocationNew(cdp, a.latitude as number, a.longitude as number, a.accuracy as number | undefined);
        case 'browser_clear_geolocation2':       return await clearGeolocationNew(cdp);
        case 'browser_geolocation_permission':   return await getGeolocationPermission(cdp);
        case 'browser_geolocation_supported':    return await isGeolocationSupported(cdp);
        case 'browser_device_orientation':       return await setDeviceOrientation(cdp, a.alpha as number, a.beta as number, a.gamma as number);
        case 'browser_timezone_info':            return await getTimezoneInfo(cdp);
        case 'browser_set_timezone':             return await setTimezoneOverride(cdp, a.timezone_id as string);
        case 'browser_locale_info':              return await getLocaleInfo(cdp);
                // worker
        case 'browser_worker_supported':         return await isWorkerSupported(cdp);
        case 'browser_shared_worker_supported':  return await isSharedWorkerSupported(cdp);
        case 'browser_worker_count_status':      return await getWorkerCountStatus(cdp);
        case 'browser_inject_worker_registry':   return await injectWorkerRegistry(cdp);
        case 'browser_post_shared_worker_message': return await postMessageToSharedWorker(cdp, a.name as string, a.message as string);
        case 'browser_broadcast_channel_supported': return await isBroadcastChannelSupported(cdp);
        case 'browser_worker_registry':          return await getWorkerRegistryEntries(cdp);
        case 'browser_clear_worker_registry':    return await clearWorkerRegistry(cdp);
        // a11y2
        case 'browser_aria_roles':               return await getAriaRoles(cdp);
        case 'browser_aria_labels':              return await getAriaLabels(cdp);
        case 'browser_aria_descriptions':        return await getAriaDescriptions(cdp);
        case 'browser_landmarks':                return await getLandmarkElements(cdp);
        case 'browser_tab_order':                return await getTabOrder(cdp);
        case 'browser_focusable2':               return await getFocusableElements2(cdp);
        case 'browser_aria_expanded':            return await getAriaExpanded(cdp);
        case 'browser_aria_hidden':              return await getAriaHidden(cdp);
        // media2 new
        case 'browser_all_media':                return await getAllMediaElements(cdp);
        case 'browser_play2':                    return await playMedia2(cdp, a.selector as string);
        case 'browser_pause2':                   return await pauseMedia2(cdp, a.selector as string);
        case 'browser_volume':                   return await setMediaVolume2(cdp, a.selector as string, a.volume as number);
        case 'browser_seek2':                    return await seekMedia2(cdp, a.selector as string, a.time as number);
        case 'browser_media_state':              return await getMediaState(cdp, a.selector as string);
                // history
        case 'browser_history_length':           return await getHistoryLength2(cdp);
        case 'browser_go_back':                  return await goBackNav(cdp);
        case 'browser_go_forward':               return await goForwardNav(cdp);
        case 'browser_go_delta':                 return await goTo(cdp, a.delta as number);
        case 'browser_current_url':              return await getCurrentUrl(cdp);
        case 'browser_page_title':               return await getPageTitle(cdp);
        case 'browser_push_state':               return await pushHistoryState(cdp, a.url as string, a.title as string ?? '');
        case 'browser_replace_state':            return await replaceHistoryState(cdp, a.url as string, a.title as string ?? '');
        // viewport2 new
        case 'browser_scroll_pos':               return await getScrollPosition2(cdp);
        case 'browser_viewport2':                return await getViewportSize2(cdp);
        case 'browser_document_size':            return await getDocumentSize(cdp);
        case 'browser_scroll_to_xy':             return await scrollToWindow(cdp, a.x as number, a.y as number);
        case 'browser_scroll_by_xy':             return await scrollByWindow(cdp, a.x as number, a.y as number);
        case 'browser_scroll_to_element2':       return await scrollToElement2(cdp, a.selector as string);
        case 'browser_in_viewport':              return await isElementInViewport(cdp, a.selector as string);
        // event2
        case 'browser_dispatch_custom2':         return await dispatchCustomEvent2(cdp, a.selector as string, a.event_name as string, a.detail);
        case 'browser_dispatch_window_event':    return await dispatchWindowEvent(cdp, a.event_name as string);
        case 'browser_event_listeners':          return await getEventListenerCount(cdp, a.selector as string);
        case 'browser_trigger_input2':           return await triggerInputEvent2(cdp, a.selector as string);
        case 'browser_trigger_change':           return await triggerChangeEvent(cdp, a.selector as string);
        case 'browser_trigger_focus2':           return await triggerFocusEvent2(cdp, a.selector as string);
        case 'browser_trigger_blur':             return await triggerBlurEvent(cdp, a.selector as string);
        case 'browser_trigger_submit':           return await triggerSubmitEvent(cdp, a.selector as string);
                // notify new
        case 'browser_notification_permission':  return await getNotificationPermission(cdp);
        case 'browser_notification_supported':   return await isNotificationSupported(cdp);
        case 'browser_page_visibility':          return await getPageVisibility(cdp);
        case 'browser_is_visible':               return await isPageVisible(cdp);
        case 'browser_ready_state':              return await getDocumentReadyState(cdp);
        case 'browser_page_charset':             return await getPageCharset(cdp);
        case 'browser_compat_mode':              return await getDocumentMode(cdp);
        case 'browser_last_modified':            return await getLastModified(cdp);
        // table
        case 'browser_table_count':              return await getTableCount(cdp);
        case 'browser_table_headers3':           return await getTableHeaders3(cdp, a.selector as string);
        case 'browser_table_row_count2':         return await getTableRowCount2(cdp, a.selector as string);
        case 'browser_table_cell_count':         return await getTableCellCount(cdp, a.selector as string);
        case 'browser_table_row':                return await getTableRow(cdp, a.selector as string, a.row_index as number);
        case 'browser_table_cell':               return await getTableCell(cdp, a.selector as string, a.row_index as number, a.col_index as number);
        case 'browser_table_data':               return await getTableData2(cdp, a.selector as string);
        case 'browser_table_summary':            return await getTableSummary(cdp);
        // links
        case 'browser_all_links':                return await getAllLinks(cdp);
        case 'browser_external_links2':          return await getExternalLinks2(cdp);
        case 'browser_internal_links':           return await getInternalLinks(cdp);
        case 'browser_link_count':               return await getLinkCount(cdp);
        case 'browser_links_with_rel':           return await getLinksWithRel(cdp, a.rel as string);
        case 'browser_mailto_links':             return await getMailtoLinks(cdp);
        case 'browser_tel_links':                return await getTelLinks(cdp);
        case 'browser_anchor_links':             return await getAnchorLinks(cdp);
                // image2
        case 'browser_all_images':               return await getAllImages(cdp);
        case 'browser_broken_images':            return await getBrokenImages(cdp);
        case 'browser_image_count':              return await getImageCount(cdp);
        case 'browser_lazy_images':              return await getLazyImages(cdp);
        case 'browser_images_no_alt':            return await getImagesWithoutAlt(cdp);
        case 'browser_svg_elements':             return await getSvgElements(cdp);
        case 'browser_picture_elements':         return await getPictureElements(cdp);
        case 'browser_image_dimensions':         return await getImageDimensions(cdp, a.selector as string);
        // input2
        case 'browser_all_inputs':               return await getAllInputs(cdp);
        case 'browser_required_inputs':          return await getRequiredInputs(cdp);
        case 'browser_disabled_inputs':          return await getDisabledInputs(cdp);
        case 'browser_input_values':             return await getInputValues(cdp);
        case 'browser_set_input':                return await setInputValue(cdp, a.selector as string, a.value as string);
        case 'browser_clear_input':              return await clearInputValue(cdp, a.selector as string);
        case 'browser_checkbox_state':           return await getCheckboxState(cdp, a.selector as string);
        case 'browser_set_checkbox':             return await setCheckboxState(cdp, a.selector as string, a.checked as boolean);
        // meta2
        case 'browser_meta_description':         return await getMetaDescription(cdp);
        case 'browser_meta_keywords':            return await getMetaKeywords(cdp);
        case 'browser_meta_robots':              return await getMetaRobots(cdp);
        case 'browser_meta_viewport':            return await getMetaViewport(cdp);
        case 'browser_canonical2':               return await getCanonicalUrl2(cdp);
        case 'browser_hreflang_tags':            return await getHreflangTags(cdp);
        case 'browser_json_ld':                  return await getJsonLdSchemas(cdp);
        case 'browser_headings':                 return await getHeadingStructure2(cdp);
                // font
        case 'browser_computed_font':            return await getComputedFont(cdp, a.selector as string);
        case 'browser_loaded_fonts2':            return await getLoadedFonts2(cdp);
        case 'browser_font_faces':               return await getFontFaces(cdp);
        case 'browser_element_font_size':        return await getElementFontSize(cdp, a.selector as string);
        case 'browser_element_font_family':      return await getElementFontFamily(cdp, a.selector as string);
        case 'browser_text_styles':              return await getTextStyles(cdp, a.selector as string);
        case 'browser_distinct_fonts':           return await countDistinctFonts(cdp);
        case 'browser_is_font_loaded':           return await isFontLoaded(cdp, a.font_family as string);
        // modal2
        case 'browser_detect_modals':            return await detectModals(cdp);
        case 'browser_overlay_elements':         return await getOverlayElements(cdp);
        case 'browser_has_backdrop':             return await hasBackdrop(cdp);
        case 'browser_close_modal_escape':       return await closeModalByEscape(cdp);
        case 'browser_click_close_button':       return await clickModalCloseButton(cdp);
        case 'browser_popover_elements':         return await getPopoverElements(cdp);
        case 'browser_zindex_layers':            return await countZIndexLayers(cdp);
        // perf2
        case 'browser_cdp_metrics':              return await getCdpMetrics(cdp);
        case 'browser_js_heap_size':             return await getJsHeapSize(cdp);
        case 'browser_dom_node_count2':          return await getDomNodeCount2(cdp);
        case 'browser_event_listener_total':     return await getEventListenerTotal(cdp);
        case 'browser_mark_performance2':        return await markPerformance2(cdp, a.name as string);
        case 'browser_measure_performance2':     return await measurePerformance2(cdp, a.name as string, a.start_mark as string, a.end_mark as string);
        case 'browser_clear_perf_marks':         return await clearPerformanceMarks(cdp);
        case 'browser_get_perf_marks2':          return await getPerformanceMarks2(cdp);
                // shadow
        case 'browser_shadow_hosts':             return await getShadowHosts(cdp);
        case 'browser_shadow_root_info':         return await getShadowRootInfo(cdp, a.selector as string);
        case 'browser_query_shadow2':            return await queryShadowRoot2(cdp, a.selector as string, a.inner_selector as string);
        case 'browser_shadow_children2':         return await getShadowChildren2(cdp, a.selector as string);
        case 'browser_is_shadow_host':           return await isShadowHost(cdp, a.selector as string);
        case 'browser_shadow_slots2':            return await getShadowSlots2(cdp, a.selector as string);
        case 'browser_shadow_css_vars':          return await getShadowCssVars(cdp, a.selector as string);
        case 'browser_shadow_depth':             return await getShadowDepth(cdp, a.selector as string);
        // network2 new
        case 'browser_resource_timings2':        return await getResourceTimings2(cdp);
        case 'browser_resources_by_type':        return await getResourcesByType(cdp, a.type as string);
        case 'browser_largest_resources':        return await getLargestResources(cdp, a.limit as number | undefined);
        case 'browser_cached_resources':         return await getCachedResources(cdp);
        case 'browser_total_transfer_size':      return await getTotalTransferSize(cdp);
        case 'browser_failed_resources':         return await getFailedResources2(cdp);
        case 'browser_clear_resource_timings':   return await clearResourceTimings(cdp);
        case 'browser_nav_timing_basic':         return await getNavigationTimingBasic(cdp);
                default: return fail(`Unknown tool: ${name}`, 'UNKNOWN_TOOL');
      }
    };

    try {
      if (NO_TIMEOUT.has(name)) return await run();
      return await withTimeout(name, DEFAULT_TOOL_TIMEOUT_MS, run);
    } catch (e: any) {
      if (e instanceof TimeoutError) return fail(e.message, 'TOOL_TIMEOUT', 'The page may be unresponsive. Try browser_screenshot to check state.');
      return fail(e.message, 'TOOL_ERROR', 'Check browser_status to verify connection');
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Per-session intercept cleanup registry
const _interceptCleanups = new Map<string, Array<() => Promise<void>>>();
