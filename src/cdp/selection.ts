// src/cdp/selection.ts
import { CdpClient } from './client';

// Get currently selected text in the page
export async function getSelectionText(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.getSelection()?.toString() ?? ''`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as string) ?? '';
}

// Get selection range info: offsets, collapsed state, container descriptions
export async function getSelectionRange(
  client: CdpClient,
): Promise<{ startOffset: number; endOffset: number; collapsed: boolean; startContainer: string; endContainer: string } | null> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const describeNode = (node) => {
    if (!node) return 'null';
    if (node.tagName) return node.tagName.toLowerCase();
    const text = node.textContent ?? '';
    return 'text:' + text.slice(0, 30);
  };
  return {
    startOffset: sel.anchorOffset,
    endOffset: sel.focusOffset,
    collapsed: sel.isCollapsed,
    startContainer: describeNode(sel.anchorNode),
    endContainer: describeNode(sel.focusNode),
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) return null;
  return result.value as { startOffset: number; endOffset: number; collapsed: boolean; startContainer: string; endContainer: string };
}

// Select a range of text within an element's first text child node
export async function selectText(
  client: CdpClient,
  selector: string,
  startOffset: number,
  endOffset: number,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  const textNode = el.firstChild;
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) throw new Error('No text child node in: ' + ${selLiteral});
  const range = document.createRange();
  range.setStart(textNode, ${startOffset});
  range.setEnd(textNode, ${endOffset});
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Select all content inside the given element
export async function selectAllInElement(client: CdpClient, selector: string): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Clear the current selection
export async function clearSelection(client: CdpClient): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.getSelection()?.removeAllRanges()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Get the caret position if the selection is collapsed, otherwise null
export async function getCaretPosition(
  client: CdpClient,
): Promise<{ offset: number; container: string } | null> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const sel = window.getSelection();
  if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return null;
  const node = sel.anchorNode;
  const describeNode = (node) => {
    if (!node) return 'null';
    if (node.tagName) return node.tagName.toLowerCase();
    const text = node.textContent ?? '';
    return 'text:' + text.slice(0, 30);
  };
  return { offset: sel.anchorOffset, container: describeNode(node) };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) return null;
  return result.value as { offset: number; container: string };
}

// Place the caret at a given offset within the first text child of an element
export async function setCaretInElement(
  client: CdpClient,
  selector: string,
  offset: number,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  const textNode = el.firstChild;
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) throw new Error('No text child node in: ' + ${selLiteral});
  const range = document.createRange();
  range.setStart(textNode, ${offset});
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Copy the current selection to the clipboard and return the selected text
export async function copySelectionToClipboard(client: CdpClient): Promise<string> {
  const { result: textResult, exceptionDetails: textEx } = await client.raw.Runtime.evaluate({
    expression: `window.getSelection()?.toString() ?? ''`,
    returnByValue: true,
  });
  if (textEx) {
    throw new Error(`JS error: ${textEx.exception?.description ?? textEx.text}`);
  }
  const text = (textResult.value as string) ?? '';

  const textLiteral = JSON.stringify(text);
  const { exceptionDetails: writeEx } = await client.raw.Runtime.evaluate({
    expression: `navigator.clipboard.writeText(${textLiteral})`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (writeEx) {
    throw new Error(`JS error: ${writeEx.exception?.description ?? writeEx.text}`);
  }

  return text;
}
