// setting.js
const globalToggle = document.getElementById('globalBlockToggle');
const RULESET_ID = 'block_rule';
const menuBlockSettings = document.getElementById('menu-block-settings');
const menuWhitelist = document.getElementById('menu-whitelist');
const sectionBlockSettings = document.getElementById('block-settings');
const sectionWhitelist = document.getElementById('whitelist-management');
const whitelistForm = document.getElementById('whitelistForm');
const whitelistInput = document.getElementById('whitelistInput');
const whitelistList = document.getElementById('whitelistList');


// 메뉴 전환
menuBlockSettings.addEventListener('click', () => {
  sectionBlockSettings.style.display = 'block';
  sectionWhitelist.style.display = 'none';
});

menuWhitelist.addEventListener('click', () => {
  sectionBlockSettings.style.display = 'none';
  sectionWhitelist.style.display = 'block';
});

// ruleset 적용 함수
async function updateRuleset(disabled) {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: disabled ? [] : [RULESET_ID],
    disableRulesetIds: disabled ? [RULESET_ID] : []
  });
}

// 상태 동기화
chrome.storage.sync.get(['globalBlockingDisabled'], async (result) => {
  let isDisabled = result.globalBlockingDisabled;

  if (typeof isDisabled === 'undefined') {
    isDisabled = false; // 기본값: 광고 차단 활성화
    await chrome.storage.sync.set({ globalBlockingDisabled: isDisabled });
  }

  globalToggle.checked = isDisabled;
  await updateRuleset(isDisabled);
});

// 토글 변경 이벤트
globalToggle.addEventListener('change', async () => {
  const isDisabled = globalToggle.checked;
  await chrome.storage.sync.set({ globalBlockingDisabled: isDisabled });
  await updateRuleset(isDisabled);
});

// 화이트리스트 입력 처리 및 저장
whitelistForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const domain = whitelistInput.value.trim();

  if (!domain) return;

  chrome.storage.sync.get(['whitelist'], async (result) => {
    let list = result.whitelist || [];

    if (!list.includes(domain)) {
      list.push(domain);
      await chrome.storage.sync.set({ whitelist: list });
      renderWhitelist(list); // 🔥 추가 후 바로 다시 렌더링
    }

    whitelistInput.value = '';
  });

});

// 저장된 화이트리스트 불러오기
chrome.storage.sync.get(['whitelist'], (result) => {
  const list = result.whitelist || [];
  list.forEach((site) => {
    const li = document.createElement('li');
    li.textContent = site;
    whitelistList.appendChild(li);
  });
});

function renderWhitelist(domains) {
  const list = document.getElementById('whitelistList');
  list.innerHTML = '';

  domains.forEach((domain) => {
    const li = document.createElement('li');

    const domainSpan = document.createElement('span');
    domainSpan.textContent = domain;
    domainSpan.className = 'site-domain';

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'X';
    removeBtn.className = 'remove-btn';

    removeBtn.addEventListener('click', async () => {
      chrome.storage.sync.get(['whitelist'], async (result) => {
        const updatedList = (result.whitelist || []).filter(d => d !== domain);
        await chrome.storage.sync.set({ whitelist: updatedList });
        renderWhitelist(updatedList);
      });
    });

    li.appendChild(domainSpan);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}




document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['whitelist'], (result) => {
    const domains = result.whitelist || [];
    renderWhitelist(domains);
  });
});