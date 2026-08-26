import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repo = path.resolve(import.meta.dirname, "..");
const indexHtml = fs.readFileSync(path.join(repo, "notes/index.html"), "utf8");
const dataSource = fs.readFileSync(path.join(repo, "data.js"), "utf8");
const sandbox = { window: {} };

vm.runInNewContext(dataSource, sandbox, { filename: "data.js" });

const notes = sandbox.window.SITE_DATA?.journal?.notes ?? [];
const failures = [];
const repeatedPathPattern = /https:\/\/rhinocount\.cn\/(?:notes\/notes|notes\/articles|articles\/articles)\//;

if (!indexHtml.includes(`href="../' + n.href`)) {
  failures.push(
    "notes/index.html must prefix journal hrefs with ../ so notes/foo.html does not resolve to /notes/notes/foo.html",
  );
}

for (const note of notes) {
  const href = note.href ?? "";
  const target = path.join(repo, href);
  const resolved = new URL(`../${href}`, "https://rhinocount.cn/notes/");

  if (!href || !fs.existsSync(target)) {
    failures.push(`missing target for ${href || "<empty href>"}`);
  }
  if (resolved.pathname.includes("/notes/notes/") || resolved.pathname.includes("/notes/articles/")) {
    failures.push(`bad browser path: ${resolved.pathname}`);
  }
}

for (const directory of ["notes", "articles"]) {
  const files = fs.readdirSync(path.join(repo, directory), { recursive: true });
  for (const file of files) {
    if (!file.endsWith(".html")) continue;
    const relative = path.join(directory, file);
    const source = fs.readFileSync(path.join(repo, relative), "utf8");
    if (repeatedPathPattern.test(source)) {
      failures.push(`repeated directory segment in ${relative}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`checked ${notes.length} journal links`);
