'use strict';
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((e) => {
    const msg = `Navigation blocked to ${e.request.url} on tab ${e.request.tabId}.`;
    console.log(msg);
});
console.log('Service worker started.');

let totalBlockedCount = 0;
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    const {request, rule} = info;

    // 여기서 request 사용 가능
    if (request.documentLifecycle === 'prerender') {
        return; // prerender 요청은 무시
    }
    console.log('🔍 Rule matched:', info);
    totalBlockedCount++;
    chrome.storage.local.set({totalBlockedCount});
});

// 코스메틱 필터 룰셋 리스너 추가
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 테스트 룰셋
    const ruleset = [
        {
            selector: "audioholics.com,classy-online.jp#@#.side-ad",
            action: {type: "hide"}
        },
        {
            selector: "ekitan.com,kissanadu.com#@#.sidebar-ad:not(.adsbygoogle)",
            action: {type: "hide"}
        },
        {
            selector: "citynews.ca###Bigbox_300x250",
            action: {type: "hide"}
        },
        {
            selector: "calculatorsoup.com,thetvdb.com###Bottom",
            action: {type: "hide"}
        },
        {
            selector: "dez.ro#@##ad-carousel",
            action: {type: "hide"}
        },
        {
            selector: "so-net.ne.jp#@##ad-p3",
            action: {type: "hide"}
        },
        {
            selector: '##[data-testid="commercial-label-taboola"]',
            action: {type: "hide"}
        },
        {
            selector: '##[data-testid^="taboola-"]',
            action: {type: "hide"}
        },
        {
            selector: "##.van_taboola",
            action: {type: "hide"}
        },
        {
            selector: "##.widget_taboola",
            action: {type: "hide"}
        },
        {
            selector: "###block-boxes-taboola",
            action: {type: "hide"}
        },
        {
            selector: "###block-taboolablock",
            action: {type: "hide"}
        }
    ];
    console.log(`[Cosmetic] ${ruleset}`);

    if (message.type === 'GET_COSMETIC_RULESET') {
        sendResponse({ruleset: ruleset});

        // true → 비동기 응답을 위해 필요
        return true;
    }
});

const HASH_URL = chrome.runtime.getURL("easylist.sha256");
const KEY = "lastAppliedHash";

async function checkReloadNeeded() {
  try {
    console.log("룰셋 업데이트 확인중..")
    const res = await fetch(HASH_URL);
    const newHash = (await res.text()).trim();
  
    const { lastAppliedHash } = await chrome.storage.local.get(KEY);

    if (lastAppliedHash && lastAppliedHash !== newHash) {
      await chrome.storage.local.set({ [KEY]: newHash });
      console.log("[AdBlock] 새 룰셋 감지 → 5초 뒤 reload");
      setTimeout(() => chrome.runtime.reload(), 5000);
    } else {
      // 첫 실행 또는 이미 최신
      console.log("[ADBlockBuster] 새 룰셋 미감지")
      await chrome.storage.local.set({ [KEY]: newHash });
    }
  } catch (e) {
    console.error("flag check failed", e);
  }
}
/*  1. 확장 로드 직후 1회 체크 */
checkReloadNeeded();
/*  2. 알람 등록 – 60분마다 한 번씩 실행 -> 테스트용으로 확인위해서 임시로 0.1로 설정해놓음 */
chrome.alarms.create("ruleCheck", { periodInMinutes: 0.1 });

/*  3. 알람 트리거 시 같은 함수 재사용 */
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "ruleCheck") checkReloadNeeded();
});