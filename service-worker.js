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