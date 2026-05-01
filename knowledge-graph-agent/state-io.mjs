// File I/O + graph-data loading helpers for the agent's state files.

import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

/** Ensure the parent directory of a file path exists (mkdir -p). */
export async function ensureParent(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

/**
 * Load a JSON file, returning a fallback value on any error
 * (file missing, invalid JSON, etc.). Defensive — used at startup.
 */
export async function loadJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

/**
 * Load the canonical graph (graph-data.js) by evaluating it inside a
 * sandboxed VM context. graph-data.js declares top-level `const`s
 * (NODES, CL, GRAPH_META) — we capture them via `this.__graph =`
 * after the script runs. Returns deep copies so the caller can mutate
 * freely without leaking back into the loaded module.
 */
export async function loadGraphData(filePath) {
  const code = await fs.readFile(filePath, "utf8");
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${code}\nthis.__graph = { NODES, CL, GRAPH_META };`, context);
  return {
    nodes: JSON.parse(JSON.stringify(context.__graph.NODES)),
    clusters: JSON.parse(JSON.stringify(context.__graph.CL)),
    meta: JSON.parse(JSON.stringify(context.__graph.GRAPH_META))
  };
}

/**
 * Merge the agent overlay (patch) into the base graph nodes.
 * - definitionOverrides patch existing nodes by id (id stays, other fields
 *   merged in).
 * - Patch nodes (new ones) are appended if their id isn't already present.
 *
 * Returns an array of node copies (caller can mutate without aliasing).
 */
export function mergeNodes(baseNodes, patch) {
  const nodes = baseNodes.map(node => ({ ...node }));
  const byId = new Map(nodes.map(node => [node.id, node]));
  for (const override of patch.definitionOverrides || []) {
    const target = byId.get(override.id);
    if (!target) continue;
    const { id, ...rest } = override;
    Object.assign(target, rest);
  }
  for (const node of patch.nodes || []) {
    if (node?.id && !byId.has(node.id)) {
      const copy = { ...node };
      nodes.push(copy);
      byId.set(copy.id, copy);
    }
  }
  return nodes;
}

/**
 * Write a JSON file with a trailing newline (POSIX-friendly).
 * Convenience for the many "write JSON state" calls in the agent.
 */
export async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
