// Deterministic event log for Lexi (spec §11).
//
// The orchestration code (run.mjs) calls these methods to record every action,
// API call, and run-lifecycle event. The log is the system of record — separate
// from Lexi's self-reports (report.json, longlist.json) so that when something
// goes wrong, we can reconstruct what actually happened from a source other
// than the thing that broke.
//
// Format: NDJSON. One event per line, append-only, never rewritten.
// Crash-safe: each line is flushed before the next call returns.

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// Build a stable short hash of a prompt string. Lets each log entry record
// which version of the prompt produced the call, so prompt changes are
// traceable in the historical record.
export function promptVersion(label, promptText) {
  const hash = crypto.createHash("sha1").update(promptText).digest("hex").slice(0, 8);
  return `${label}:${hash}`;
}

// Factory — one logger per run. Pass in the runId, phase, and the path to the
// log file. The logger writes JSON lines into that file, creating it (and the
// parent directory) if needed.
export function createLogger({ runId, phase, logPath }) {
  let initialised = false;

  async function ensureReady() {
    if (initialised) return;
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    initialised = true;
  }

  async function append(record) {
    await ensureReady();
    const enriched = {
      ts: new Date().toISOString(),
      runId,
      phase,
      ...record,
      // selfEval is stubbed null until spec §15 (self-check) is implemented.
      // Field is present in every record so consumers can rely on the shape.
      selfEval: record.selfEval ?? null
    };
    await fs.appendFile(logPath, `${JSON.stringify(enriched)}\n`, "utf8");
  }

  return {
    runId,
    phase,
    logPath,

    // Lifecycle
    async runStart(meta = {}) {
      await append({ kind: "run_start", ...meta });
    },
    async runEnd(meta = {}) {
      await append({ kind: "run_end", ...meta });
    },
    async runErrored(error, meta = {}) {
      await append({
        kind: "run_errored",
        errorMessage: error?.message ?? String(error),
        errorStack: error?.stack ?? null,
        ...meta
      });
    },

    // API calls (extract, review). inputs/outputs are caller-shaped — keep
    // them small enough that the log stays scannable; full content lives
    // elsewhere (proposals.json, longlist.json).
    async apiCall({ call, promptVersion, inputs, outputs, durationMs, usage, errored = false, errorMessage = null }) {
      await append({
        kind: "api_call",
        call,
        promptVersion,
        inputs,
        outputs,
        durationMs,
        usage: usage ?? null,
        errored,
        errorMessage
      });
    },

    // Actions routed through the permissions matrix. The action name comes
    // from actions.mjs ACTIONS; outcome is applied | proposed | dropped | errored.
    async action({ action, source, gate, outcome, target, payload, reason, errorMessage = null, promptVersion = null }) {
      await append({
        kind: "action",
        action,
        source,
        gate,
        outcome,
        target,
        payload,
        reason,
        promptVersion,
        errorMessage
      });
    },

    // Generic event escape hatch. Used by the auditor (audit.mjs) to write
    // events with kinds outside the agent's lifecycle vocabulary —
    // audit_start, audit_flag, audit_end, etc. The append() helper still adds
    // the standard fields (ts, runId, phase, selfEval).
    async event(kind, payload = {}) {
      await append({ kind, ...payload });
    }
  };
}
