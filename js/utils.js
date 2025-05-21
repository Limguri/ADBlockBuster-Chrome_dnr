// js/utils.js
export async function setGlobalBlockState(enabled) {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds:  enabled ? ["block_rule"] : [],
    disableRulesetIds: enabled ? []            : ["block_rule"]
  });
}
