/* dnr_generator.js */

import { fileURLToPath } from "url";
import path  from "path";
import fs    from "fs";
import { downloadFile, calcFileHash } from "./dnr_utils.js";
import { DNRRuleGenerator }                from "./parser.js";

/* ──  "프로젝트 루트" = dnr_generator.js에서 한 단계 위 디렉터리 ── */
const __filename = fileURLToPath(import.meta.url);
const ROOT       = path.resolve(path.dirname(__filename), "..");

/* ──  모든 경로를 ROOT 기준으로 고정 ── */
const SRC_URL   = "https://easylist.to/easylist/easylist.txt";
const TXT_TMP   = path.join(ROOT, "easylist.txt");
const HASH_FILE = path.join(ROOT, "easylist.sha256");
const OUT_JSON  = path.join(ROOT, "ruleset", "block1.json");
const FLAG_FILE = path.join(ROOT, "ruleset", "updated.flag");

/* ruleset 폴더 없으면 생성 */
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });

downloadFile(SRC_URL, TXT_TMP, async () => {
  const newHash = await calcFileHash(TXT_TMP);
  const oldHash = fs.existsSync(HASH_FILE) ? fs.readFileSync(HASH_FILE, "utf8").trim() : "";

  if (newHash !== oldHash) {
    const gen = new DNRRuleGenerator();
    gen.loadFromFile(TXT_TMP);
    gen.exportToFile(OUT_JSON);
    fs.writeFileSync(HASH_FILE, newHash);
    console.log("block1.json 갱신:", newHash.slice(0, 16), "…");
  } else {
    console.log("동일 해시 재생성 생략");
  }
});
