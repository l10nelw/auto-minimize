import * as Settings from '../settings.js';

enforceLimit_minimizeMultiple();
browser.windows.onCreated.addListener(window => handleFocusChange(window.id));
browser.windows.onFocusChanged.addListener(handleFocusChange);
browser.runtime.onInstalled.addListener(handleInstall);


function handleFocusChange(windowId) {
  if (windowId === browser.windows.WINDOW_ID_NONE)
    return;
  enforceLimit_minimizeSingle();
  saveLastFocused(windowId);
}

async function handleInstall(details) {
  if (details.reason !== 'install')
    return;
  browser.runtime.openOptionsPage();
  // If available, get lastFocused data from Winger so we don't have to start from nothing
  const winfos = await browser.runtime.sendMessage('winman@lionelw', { type: 'info', properties: ['lastFocused'] });
  winfos?.forEach(({ id, lastFocused }) => saveLastFocused(id, lastFocused));
}

async function enforceLimit_minimizeMultiple() {
  if (!await Settings.get('enabled'))
    return;
  const [minimizables, limit] = await getCommonEnforcementData();
  await Promise.all(minimizables.map(loadLastFocused));
  minimizables.sort((a, b) => b.lastFocused - a.lastFocused); // Sort from most to least recent
  minimizables.slice(limit).forEach(minimize); // Remove set number of windows from start of array, and minimize any remainder
}

async function enforceLimit_minimizeSingle() {
  if (!await Settings.get('enabled'))
    return;
  const [minimizables, limit] = await getCommonEnforcementData();
  if (minimizables.length > limit - 1) { // -1 from limit to account for excluded focused window in minimizables
    const target = await findLeastRecentlyFocused(minimizables);
    minimize(target);
  }
}


async function getCommonEnforcementData() {
  const [windows, limit] = await Promise.all([ browser.windows.getAll(), Settings.get('limit') ]);
  // Include only non-minimized windows except the currently focused window
  const minimizables = windows.filter(window => window.state !== 'minimized' && !window.focused);
  return [minimizables, limit];
}

async function findLeastRecentlyFocused(windows) {
  let result = { lastFocused: Number.POSITIVE_INFINITY };
  windows = await Promise.all( windows.map(loadLastFocused) );
  for (const window of windows)
    if (window.lastFocused < result.lastFocused)
      result = window;
  return result;
}

function saveLastFocused(windowId, lastFocused = Date.now()) {
  browser.sessions.setWindowValue(windowId, 'lastFocused', lastFocused);
}

async function loadLastFocused(window) {
  window.lastFocused = (await browser.sessions.getWindowValue(window.id, 'lastFocused')) || 0;
  return window;
}

function minimize(window) {
  browser.windows.update(window.id, { state: 'minimized' });
}
