import fs from "fs";
import https from "https";
import crypto from "crypto";     

export function downloadFile(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  https.get(url, res => {
    if (res.statusCode !== 200) return console.error("DL fail", res.statusCode);
    res.pipe(file).on("finish", () => file.close(cb));
  });
}

export function calcFileHash(path) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    fs.createReadStream(path)
      .on("data", d => hash.update(d))
      .on("end",  () => resolve(hash.digest("hex")))
      .on("error",reject);
  });
}
