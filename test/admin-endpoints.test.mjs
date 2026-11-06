// Tests for the Basic-auth admin endpoints (/api/mark-*): CSRF guard
// (SEC-043), auth, and the must-read endpoint. GitHub is stubbed; nothing
// leaves the machine. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const worker = (await import("../src/worker.js")).default;
const PW = "a-long-test-password-123";
const env = { MARK_NOTE_PASSWORD: PW, GITHUB_TOKEN: "t" };
const AUTH = "Basic " + Buffer.from("x:" + PW).toString("base64");
const ORIGIN = "https://ai-terminology.com";

let file, commits;
test.beforeEach(() => {
  file = JSON.parse(fs.readFileSync(new URL("../knowledge-graph-agent/must-reads.json", import.meta.url), "utf8"));
  commits = [];
  globalThis.fetch = async (_url, init = {}) => {
    if (init.method === "PUT") {
      const b = JSON.parse(init.body);
      file = JSON.parse(Buffer.from(b.content, "base64").toString("utf8"));
      commits.push(b.message);
      return new Response(JSON.stringify({ commit: { sha: "abc" } }), { status: 200 });
    }
    return new Response(JSON.stringify({ sha: "s1", content: Buffer.from(JSON.stringify(file)).toString("base64") }), { status: 200 });
  };
});

function post(path, body, headers = {}) {
  return worker.fetch(new Request(ORIGIN + path, {
    method: "POST",
    headers: { authorization: AUTH, "content-type": "application/json", "sec-fetch-site": "same-origin", origin: ORIGIN, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body)
  }), env, {});
}

test("cross-site text/plain form POST is refused, even with cached credentials", async () => {
  for (const path of ["/api/mark-note", "/api/mark-proposal", "/api/mark-must-read"]) {
    const r = await post(path, '{"all":true,"status":"read"}', {
      "content-type": "text/plain", "sec-fetch-site": "cross-site", origin: "https://evil.example"
    });
    assert.equal(r.status, 403, path);
  }
  assert.equal(commits.length, 0);
});

test("foreign Origin without Sec-Fetch-Site is refused", async () => {
  const r = await post("/api/mark-must-read", { all: true, status: "read" }, { "sec-fetch-site": "", origin: "https://evil.example" });
  assert.equal(r.status, 403);
});

test("non-JSON body is refused with 415 even same-origin", async () => {
  const r = await post("/api/mark-must-read", '{"all":true,"status":"read"}', { "content-type": "text/plain" });
  assert.equal(r.status, 415);
  assert.equal(commits.length, 0);
});

test("wrong or missing password is 401", async () => {
  assert.equal((await post("/api/mark-must-read", { all: true, status: "read" }, { authorization: "" })).status, 401);
  const wrong = "Basic " + Buffer.from("x:" + PW.slice(0, -1) + "X").toString("base64");
  assert.equal((await post("/api/mark-must-read", { all: true, status: "read" }, { authorization: wrong })).status, 401);
});

test("must-read: validation", async () => {
  assert.equal((await post("/api/mark-must-read", { id: "x", status: "actioned" })).status, 400);
  assert.equal((await post("/api/mark-must-read", { status: "read" })).status, 400);
  assert.equal((await post("/api/mark-must-read", { id: "nope", status: "read" })).status, 404);
  const get = await worker.fetch(new Request(ORIGIN + "/api/mark-must-read"), env, {});
  assert.equal(get.status, 405);
});

test("must-read: one article, then all unread", async () => {
  const first = file.entries.find(e => e.status === "unread");
  const key = first.id || first.url;
  const before = file.entries.filter(e => e.status === "unread").length;
  let r = await post("/api/mark-must-read", { id: key, status: "dismissed" });
  assert.equal(r.status, 200);
  assert.equal(file.entries.find(e => (e.id || e.url) === key).status, "dismissed");
  assert.equal(file.meta.unreadCount, before - 1);
  r = await post("/api/mark-must-read", { all: true, status: "read" });
  assert.equal(r.status, 200);
  assert.equal(file.meta.unreadCount, 0);
  assert.match(commits.at(-1), /^Mark \d+ must-read\(s\) read/);
});
