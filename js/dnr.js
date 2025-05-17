// js/dnr.js – 브라우저(service-worker·popup 등)에서 import
'use strict';

export async function updateEnabledRulesets(options) {
  return chrome.declarativeNetRequest.updateEnabledRulesets(options);
}
export async function updateDynamicRules(options) {
  return chrome.declarativeNetRequest.updateDynamicRules(options);
}
export async function getMatchedRules(options) {
  return chrome.declarativeNetRequest.getMatchedRules(options);
}
