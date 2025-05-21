class CosmeticFilter {

    constructor(ruleset, options = {}) {
        this.ruleset = this.parseSelectors(ruleset);
        this.options = options;
    }

    /**
     * Adblock 스타일의 코스메틱 필터 룰셋을 파싱하여
     * CSS 셀렉터, 도메인 정보, 액션 정보를 추출합니다.
     *
     * `##`, `###` 접두사가 포함된 일반 필터만 처리하며,
     * `#@#`로 시작하는 예외 필터는 무시됩니다.
     *
     * ### 지원하는 필터 형식:
     *
     * - `##.foo`
     *   모든 도메인에서 `class="foo"`를 가진 요소를 숨깁니다.
     *   → 결과: `{ selector: ".foo", domain: null }`
     *
     * - `###bar`
     *   모든 도메인에서 `id="bar"`를 가진 요소를 숨깁니다.
     *   → 결과: `{ selector: "#bar", domain: null }`
     *
     * - `##[attr=val]`
     *   모든 도메인에서 `attr="val"` 속성을 가진 요소를 숨깁니다.
     *   → 결과: `{ selector: "[attr=val]", domain: null }`
     *
     * - `example.com##.foobar`
     *   `example.com` 도메인에서 `class="foobar"`를 가진 요소를 숨깁니다.
     *   → 결과: `{ selector: ".foobar", domain: "example.com" }`
     *
     * - `example.com###foobar`
     *   `example.com` 도메인에서 `id="foobar"`를 가진 요소를 숨깁니다.
     *   → 결과: `{ selector: "#foobar", domain: "example.com" }`
     *
     * - `example.com#@##foobar`
     *   ❌ 예외 필터 → 이 메서드에서는 무시됩니다.
     *
     * ### 파싱 방식:
     * - `###`는 ID 셀렉터로 해석되어 `#foobar` 형태로 변환됩니다.
     * - `##`는 일반 CSS 셀렉터 전체 (`.class`, `tag`, `[attr=val]` 등)를 그대로 사용합니다.
     * - 도메인이 붙은 경우는 `domain` 필드에 저장됩니다.
     *
     * @param {Array<{ selector: string, action: { type: string, value?: string } }>} ruleset
     *   원본 Adblock 코스메틱 필터 룰셋 배열 (원시 셀렉터 문자열 포함)
     *
     * @returns {Array<{ selector: string, domain: string | null, action: { type: string, value?: string } }>}
     *   파싱된 필터 정보 배열. CSS 셀렉터와 도메인, 액션을 포함합니다.
     */
    parseSelectors(ruleset) {
        const parsed = [];

        for (const rule of ruleset) {
            const raw = rule.selector;
            const action = rule.action;

            // ❌ 예외 필터 무시
            if (raw.includes('#@#')) continue;

            // 정확히 ### 또는 ## 를 구분하여 셀렉터 추출
            const tripleMatch = raw.match(/^([^#]*)###([^#].*)$/);
            const doubleMatch = raw.match(/^([^#]*)##([^#].*)$/);

            let matchType = null;
            let domainPart, selectorPart;

            if (tripleMatch) {
                matchType = 'id';
                domainPart = tripleMatch[1].trim();
                selectorPart = tripleMatch[2].trim();
            } else if (doubleMatch) {
                matchType = 'css';
                domainPart = doubleMatch[1].trim();
                selectorPart = doubleMatch[2].trim();
            } else {
                continue;
            }

            if (!selectorPart) continue;

            const domain = domainPart === '' ? null : domainPart;
            const selector = matchType === 'id'
                ? `#${selectorPart}`
                : selectorPart;

            parsed.push({
                selector,
                domain,
                action
            });
        }

        console.log("===========================")
        console.log("[*] CosmeticFilter class init rule set")
        console.dir(parsed);
        console.log("===========================")
        return parsed;
    }

    parseCSS(styleString) {
        const styleObj = {};
        const parts = styleString.split(';');
        for (const part of parts) {
            const [prop, value] = part.split(':').map(s => s && s.trim());
            if (prop && value) styleObj[prop] = value;
        }
        return styleObj;
    }

    /**
     * 각 selector에 대해 현재 도메인에 적용 가능한 DOM 요소들을 반환합니다.
     *
     * 도메인이 일치하지 않는 룰은 결과에 포함되지 않습니다.
     *
     * @returns {Promise<Object<string, { element: HTMLElement, css: Object<string, string>, domain: string | null }[]>>}
     */
    async getMatchedSelector() {
        const result = {};
        const currentDomain = location.hostname;

        /**
         * 현재 도메인이 필터에 지정된 도메인과 일치하는지 검사
         * - 도메인이 없으면 항상 true
         * - 정확히 일치하거나, 하위 도메인일 경우 true
         */
        function isDomainMatch(current, ruleDomain) {
            return (
                !ruleDomain ||
                current === ruleDomain ||
                current.endsWith('.' + ruleDomain)
            );
        }

        for (const rule of this.ruleset) {
            const {selector, domain, action} = rule;

            // ✅ 현재 도메인과 일치하는 룰만 처리
            if (!isDomainMatch(currentDomain, domain)) continue;

            // CSS 스타일 결정
            let css = {};
            if (action.type === 'hide') {
                css = {display: 'none'};
            } else if (action.type === 'style') {
                css = this.parseCSS(action.value);
            } else {
                continue;
            }

            // 셀렉터 매칭
            let elements;
            try {
                elements = document.querySelectorAll(selector);
            } catch (e) {
                console.warn(`Invalid selector skipped: "${selector}"`, e);
                continue;
            }

            const matched = Array.from(elements).map(el => ({
                element: el,
                css,
                domain // 정보 용도로 유지
            }));

            if (matched.length > 0) {
                if (!result[selector]) result[selector] = [];
                result[selector].push(...matched);
            }
        }

        return result;
    }


    /**
     * 엘리먼트 분류하는 걸 만들 수 있을까 -> 이거 분류되면 어떤 기능을 사용할지 나오지 않을까 햇는데 만들기 좀 어려운데
     * 여기는 AD 엘리먼트마다 어떤 기능 하도록 할 건지 분류하는 거
     */
    async classifyElements() {
    }

    /**
     * 각 셀렉터에 매칭된 엘리먼트에 CSS 속성을 인라인으로 적용합니다.
     *
     * @param {Object<string, { element: HTMLElement, css: Object<string, string>, domain: string | null }[]>} matchedSelectors
     * @returns {Promise<void>}
     */
    async applyInlineCSS(matchedSelectors) {
        for (const selector in matchedSelectors) {
            const entries = matchedSelectors[selector];

            for (const {element, css} of entries) {
                for (const [key, value] of Object.entries(css)) {
                    element.style.setProperty(key, value, 'important');
                }
            }
        }
    }

    /**
     * matchedSelectors에 포함된 모든 요소를 DOM에서 제거합니다.
     *
     * @param {Object<string, { element: HTMLElement, css: Object<string, string>, domain: string | null }[]>} matchedSelectors
     * @returns {void}
     */
    async removeElements(matchedSelectors) {
        for (const selector in matchedSelectors) {
            const entries = matchedSelectors[selector];

            for (const {element} of entries) {
                try {
                    element.remove();
                } catch (e) {
                    console.warn(`[Adblock] Failed to remove element for selector: "${selector}"`, e);
                }
            }
        }
    }

    /**
     * matchedSelectors 기반으로 한 번만 광고 요소를 숨깁니다.
     *
     * @param {Object<string, { element: HTMLElement, css: Object<string, string>, domain: string | null }[]>} matchedSelectors
     * @returns {Promise<void>}
     *
     * @TODO 동적으로 계속 광고가 삽입되는 페이지에서는 MutationObserver를 사용하여 지속적으로 감시할 수 있습니다.
     *       단, 이 경우 감시 범위가 크면 메모리 누수나 성능 저하가 발생할 수 있으므로 반드시 disconnect()로 해제 처리도 필요합니다.
     */
    async observeDynamicContent(matchedSelectors) {
        for (const selector in matchedSelectors) {
            const entries = matchedSelectors[selector];

            for (const {element, css} of entries) {
                try {
                    if (!element.dataset.adHidden) {
                        for (const [prop, value] of Object.entries(css)) {
                            element.style.setProperty(prop, value, 'important');
                        }
                        element.dataset.adHidden = 'true';
                    }
                } catch (e) {
                    console.warn(`[Adblock] Failed to hide dynamic element for selector: "${selector}"`, e);
                }
            }
        }
    }

    /**
     * 새로 추가되는 shadow DOM 중 최초 1회만 감지하여 처리 후 감시 종료
     *
     * @param {Object<string, { element: HTMLElement, css: Object<string, string>, domain: string | null }[]>} matchedSelectors
     * @returns {Promise<void>}
     */
    async observeShadowDOM(matchedSelectors) {
        const observer = new MutationObserver(async mutations => {
            for (const mutation of mutations) {
                if (mutation.target.shadowRoot) {
                    await this.observeDynamicContentInShadow(mutation.target.shadowRoot, matchedSelectors);
                    observer.disconnect();
                    break;
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * shadowRoot 내부에서 matchedSelectors 기반 요소를 찾아 숨깁니다.
     *
     * @param {ShadowRoot} shadowRoot
     * @param {Object<string, { element: HTMLElement, css: Object<string, string>, domain: string | null }[]>} matchedSelectors
     * @returns {Promise<void>}
     */
    async observeDynamicContentInShadow(shadowRoot, matchedSelectors) {
        for (const selector in matchedSelectors) {
            let elements = [];
            try {
                elements = shadowRoot.querySelectorAll(selector);
            } catch (e) {
                console.warn(`[Adblock] Invalid selector in shadow root: "${selector}"`, e);
                continue;
            }

            elements.forEach(el => {
                for (const {css} of matchedSelectors[selector]) {
                    for (const [key, value] of Object.entries(css)) {
                        el.style.setProperty(key, value, 'important');
                    }
                }
            });
        }
    }

}


chrome.runtime.sendMessage({type: 'GET_COSMETIC_RULESET'}, async (response) => {
    if (response?.ruleset?.length) {
        // 인스턴스 생성
        const cosmeticFilter = new CosmeticFilter(response.ruleset, {});

        // 룰셋 적용 대상 요소 추출
        const matchedSelectors = await cosmeticFilter.getMatchedSelector();
        console.log("=========================")
        console.log("[*] Matched selectors")
        console.dir(matchedSelectors);
        console.log("=========================")

        // 정적 광고 요소에 스타일 적용
        await cosmeticFilter.applyInlineCSS(matchedSelectors);

        // 광고 복원 시도 우회: DOM에서 직접 제거
        await cosmeticFilter.removeElements(matchedSelectors);

        // 스크롤/동적 렌더링 대응 (최초 1회 실행)
        await cosmeticFilter.observeDynamicContent(matchedSelectors);

        // Shadow DOM 내부 광고 대응 (최초 1회만 감시)
        await cosmeticFilter.observeShadowDOM(matchedSelectors);
    } else {
        console.warn('[Adblock] 룰셋이 없습니다.');
    }
});