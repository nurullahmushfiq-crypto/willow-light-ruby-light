import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shots = [
  { file: "og.html", width: 1200, height: 630, out: "og-raw.png" },
  { file: "banner.html", width: 1200, height: 264, out: "banner-raw.png" },
];

const browser = await chromium.launch({
  args: ["--allow-file-access-from-files", "--disable-web-security"],
});

for (const shot of shots) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 1,
  });
  const url = `file://${resolve(here, shot.file)}`;
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 250));
  const buf = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: shot.width, height: shot.height },
    animations: "disabled",
  });
  const dest = resolve(here, shot.out);
  writeFileSync(dest, buf);
  console.log("wrote", dest, buf.length);
  await page.close();
}

await browser.close();
