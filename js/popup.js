// popup.js

const globalToggle = document.getElementById('globalBlockToggle');
const currentSiteToggle = document.getElementById('whitelistToggle');
const adCountDisplay = document.getElementById('adCount');
const RULESET_ID = 'block_rule';
const settingsBtn = document.getElementById('goToSettingsBtn');

// 설정 페이지 새 창 열기
settingsBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('setting.html') });
});

// 광고 차단 ruleset 업데이트 함수
async function updateRuleset(disabled) {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: disabled ? [] : [RULESET_ID],
    disableRulesetIds: disabled ? [RULESET_ID] : []
  });
}

// 현재 도메인 가져오기
async function getCurrentDomain() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tabs[0].url);
  return url.hostname;
}

// 전체 차단 토글 상태 동기화
document.addEventListener('DOMContentLoaded', async () => {
  const domain = await getCurrentDomain();

  // 스토리지에서 현재 상태 불러오기
  const result = await chrome.storage.sync.get(['globalBlockingDisabled', 'whitelist']);
  const isDisabledGlobally = result.globalBlockingDisabled ?? false;
  const whitelist = result.whitelist || [];

  // UI에 반영
  globalToggle.checked = isDisabledGlobally;
  currentSiteToggle.checked = whitelist.includes(domain);

  // 룰셋 상태 결정 (→ 차단을 활성화할지 여부)
  const shouldEnableBlocking = !isDisabledGlobally && !whitelist.includes(domain);
  await updateRuleset(!shouldEnableBlocking); // true면 disable

  chrome.storage.local.get('totalBlockedCount', (result) => {
    const count = result.totalBlockedCount || 0;
    document.getElementById('adCount').textContent = count;
  });
});




// 전체 광고 차단 토글 이벤트
globalToggle.addEventListener('change', async () => {
  const isDisabled = globalToggle.checked;
  await chrome.storage.sync.set({ globalBlockingDisabled: isDisabled });
  await updateRuleset(isDisabled);
});

// 현재 사이트 화이트리스트 토글 이벤트
currentSiteToggle.addEventListener('change', async () => {
  const domain = await getCurrentDomain();
  chrome.storage.sync.get(['whitelist'], async (result) => {
    let list = result.whitelist || [];
  
    // 도메인 비교 시 소문자로 통일
    const normalizedDomain = domain.toLowerCase();
    list = list.map(d => d.toLowerCase());
  
    const index = list.indexOf(normalizedDomain);
  
    if (currentSiteToggle.checked) {
      if (index === -1) {
        list.push(normalizedDomain);  // 중복 없이 추가
      }
    } else {
      list = list.filter(d => d !== normalizedDomain);  // 명확하게 제거
    }
  
    await chrome.storage.sync.set({ whitelist: list });
  
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
});


