// js/utils.js
export async function setGlobalBlockState(enabled) {
    try {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: enabled ? ["block_rule"] : [],
        disableRulesetIds: enabled ? [] : ["block_rule"]
      });
      await chrome.storage.sync.set({ globalBlocking: enabled });
    } catch (error) {
      console.error("ruleset 변경 실패:", error);
    }
  }
  
  export async function getGlobalBlockState() {
    const result = await chrome.storage.sync.get("globalBlocking");
    return result.globalBlocking ?? true; // 기본값은 true
  }
  