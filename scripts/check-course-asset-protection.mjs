import { existsSync, readdirSync } from "node:fs";
import { resolve, relative, extname, sep } from "node:path";
import { readFileSync } from "node:fs";

const root = process.cwd();
const workerPath = resolve(root, "_worker.js");
if (!existsSync(workerPath)) throw new Error("Missing _worker.js");
const workerSource = readFileSync(workerPath, "utf8");
if (!workerSource.includes("lesson-(?:[2-9]|1[01])")) {
  throw new Error("Worker must protect lesson-2 through lesson-11 while leaving lesson-1 free");
}

function isProtected(pathname) {
  let normalized = pathname;
  try { normalized = decodeURIComponent(pathname); } catch { /* fail closed below */ }
  normalized = normalized.replace(/\\/g, "/");
  const lessonFile = /(?:^|\\/)lesson-(?:[2-9]|1[01])(?:[-./]|$)/i.test(normalized);
  const courseDirectory = /^\\/(?:lessons?|course-assets?|downloads?|pdf|pptx|videos?)\\/.+$/i.test(normalized);
  return lessonFile || courseDirectory;
}

function walk(directory, result = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".wrangler-dry-run") continue;
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, result);
    else if (entry.isFile()) result.push("/" + relative(root, absolute).split(sep).join("/"));
  }
  return result;
}

const files = walk(root);
const errors = [];
if (isProtected("/lesson-1.html")) errors.push("Lesson 1 free preview must not be paid-gated");
for (let lesson = 2; lesson <= 11; lesson++) {
  const path = "/lesson-" + lesson + ".html";
  if (!files.includes(path)) errors.push("missing lesson page: " + path);
  if (!isProtected(path)) errors.push("paid lesson page is not protected: " + path);
}

let protectedResources = 0;
for (const path of files) {
  const lower = path.toLowerCase();
  const inCourseDirectory = /^\\/(?:lessons?|course-assets?|downloads?|pdf|pptx|videos?)\\//i.test(path);
  const paidLessonNamed = /(?:^|\\/)lesson[-_](?:[2-9]|1[01])(?:[-_./]|$)/i.test(path);
  const resourceType = [".pdf", ".pptx", ".mp4", ".mov", ".webm", ".zip"].includes(extname(lower));
  if ((inCourseDirectory || (paidLessonNamed && resourceType)) && !isProtected(path)) {
    errors.push("course resource path is not protected: " + path);
  }
  if (isProtected(path) && (resourceType || /lesson-(?:[2-9]|1[01])\\.html$/i.test(path))) protectedResources++;
}

if (errors.length) {
  console.error("Course asset protection inventory failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("Course asset protection inventory OK: Lesson 1 free; Lessons 2–11 protected; " + protectedResources + " paid lesson/resource paths covered.");
