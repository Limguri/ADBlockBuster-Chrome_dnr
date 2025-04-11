'use strict';

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((e) => {
  const msg = `Navigation blocked to ${e.request.url} on tab ${e.request.tabId}.`;
  console.log(msg);
});

console.log('Service worker started.');


let totalBlockedCount = 0;

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  const { request, rule } = info;

  // 여기서 request 사용 가능
  if (request.documentLifecycle === 'prerender') {
    return; // prerender 요청은 무시
  }
  console.log('🔍 Rule matched:', info);
  totalBlockedCount++;
  chrome.storage.local.set({ totalBlockedCount });
});