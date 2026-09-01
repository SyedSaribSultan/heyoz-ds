// HeyOz Token Rebind
//
// Repoints every variable binding that references an unreachable variable at
// the reachable variable with the same name and type. "Reachable" means a
// variable this file can legitimately bind: one of its own LOCAL variables,
// or a variable from an enabled team LIBRARY (the design-system file
// published as a library). This is the fix for pasting a screen between
// files: Figma binds by variable ID, not name, so a pasted layer keeps
// referencing the source file's variables even when this file can reach
// identically-named ones.
//
// Matching is by full variable name (e.g. "fill/brand", "font-size/body-md").
// A local match beats a library match; when two candidates share a name, the
// one whose collection name matches the foreign variable's collection wins;
// a still-ambiguous name is reported, never guessed.

figma.showUI(__html__, { width: 380, height: 560 });

figma.ui.onmessage = (msg) => {
  if (msg && msg.type === "run") run(msg.allPages === true);
};

run(false);

async function run(allPages) {
  // --- Everything this file can bind to, by name+type -------------------
  const localVars = await figma.variables.getLocalVariablesAsync();
  const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
  const localCollectionName = new Map(localCollections.map((c) => [c.id, c.name]));
  const localById = new Set(localVars.map((v) => v.id));

  const byName = new Map(); // "name TYPE" -> [{kind, variable|key, collectionName}]
  function addCandidate(name, type, entry) {
    const k = name + " " + type;
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(entry);
  }
  for (const v of localVars) {
    addCandidate(v.name, v.resolvedType, {
      kind: "local",
      variable: v,
      collectionName: localCollectionName.get(v.variableCollectionId) || null,
    });
  }

  let libraryVarCount = 0;
  let libraryError = null;
  const libraryKeys = new Set();
  try {
    const libCollections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
    for (const c of libCollections) {
      const vars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(c.key);
      for (const v of vars) {
        libraryVarCount++;
        libraryKeys.add(v.key);
        addCandidate(v.name, v.resolvedType, {
          kind: "library",
          key: v.key,
          collectionName: c.name,
        });
      }
    }
  } catch (e) {
    libraryError = String(e && e.message ? e.message : e);
  }

  // --- The layers to sweep ----------------------------------------------
  let roots, scope;
  if (allPages) {
    // Every page must be loaded before findAll can see it — files open with
    // only the current page in memory under dynamic-page access.
    await figma.loadAllPagesAsync();
    roots = figma.root.children;
    scope = "all pages (" + roots.length + ")";
  } else {
    const selection = figma.currentPage.selection;
    roots = selection.length ? selection : [figma.currentPage];
    scope = selection.length ? "selection" : "page";
  }
  const nodes = new Set();
  for (const root of roots) {
    nodes.add(root);
    if ("findAll" in root) {
      for (const n of root.findAll(() => true)) nodes.add(n);
    }
  }

  const stats = {
    scope,
    nodesScanned: nodes.size,
    checked: 0,
    rebound: 0,
    renamed: 0,
    alreadyConnected: 0,
    dangling: 0,
    unmatched: new Map(), // name -> count
    ambiguous: new Map(), // name -> count
    failed: [], // "node → field: error"
  };

  const varCache = new Map();
  async function getVariable(id) {
    if (!varCache.has(id)) {
      varCache.set(id, await figma.variables.getVariableByIdAsync(id).catch(() => null));
    }
    return varCache.get(id);
  }

  const collCache = new Map();
  async function collectionNameOf(variable) {
    const id = variable.variableCollectionId;
    if (!collCache.has(id)) {
      const c = await figma.variables.getVariableCollectionByIdAsync(id).catch(() => null);
      collCache.set(id, c ? c.name : null);
    }
    return collCache.get(id);
  }

  // A library variable must be imported into the file before it can be
  // bound; importing is idempotent, but cache it anyway.
  const importCache = new Map();
  async function materialize(entry) {
    if (entry.kind === "local") return entry.variable;
    if (!importCache.has(entry.key)) {
      importCache.set(entry.key, await figma.variables.importVariableByKeyAsync(entry.key));
    }
    return importCache.get(entry.key);
  }

  async function choose(candidates, oldVar) {
    if (candidates.length === 1) return candidates[0];
    const locals = candidates.filter((c) => c.kind === "local");
    const pool = locals.length ? locals : candidates;
    if (pool.length === 1) return pool[0];
    const oldCollection = await collectionNameOf(oldVar);
    const same = pool.filter((c) => c.collectionName === oldCollection);
    if (same.length === 1) return same[0];
    return null;
  }

  // --- Renames: the old design system's names for today's tokens. Where an
  // old single role was split into several (content/fixed became
  // fixed-primary AND fixed-inverse), every candidate is listed and the
  // winner is picked by comparing actual resolved values — never by
  // spelling distance.
  function renameCandidateNames(name) {
    const table = {
      "content/fixed": ["color/content/fixed-primary", "color/content/fixed-inverse"],
      "content/inverse": ["color/content/inverse-primary", "color/content/inverse-secondary"],
      "content/disabled": ["color/content/primary-disabled", "color/content/secondary-disabled"],
    };
    const out = table[name] ? table[name].slice() : [];
    const spacing = name.match(/^spacing\/(\d+)$/);
    if (spacing) out.push("spacing/spacing-" + spacing[1]);
    const radius = name.match(/^(?:radius|roundness)\/(\d+|full)$/);
    if (radius) out.push("roundness/radius-" + radius[1]);
    // "sroke width" is a typo that shipped in the old file's group name.
    if (/^(sroke|stroke)[ -]width\//.test(name)) {
      out.push(name.replace(/^(sroke|stroke)[ -]width\//, "stroke-width/"));
    }
    return out;
  }

  // Every value a variable takes across its modes, aliases resolved, as
  // comparable strings. Used to pick between rename candidates.
  async function resolveValue(v, depth) {
    if (v == null || depth > 10) return null;
    if (typeof v === "object" && v.type === "VARIABLE_ALIAS") {
      const target = await getVariable(v.id);
      if (!target) return null;
      const modes = Object.keys(target.valuesByMode);
      const results = [];
      for (const m of modes) results.push(await resolveValue(target.valuesByMode[m], depth + 1));
      return results.filter((r) => r != null).join("|");
    }
    if (typeof v === "object" && "r" in v) {
      const a = v.a === undefined ? 1 : v.a;
      return [v.r, v.g, v.b].map((c) => Math.round(c * 255)).join(",") + "/" + a.toFixed(3);
    }
    return String(v);
  }
  async function valueSet(variable) {
    const out = new Set();
    for (const modeId of Object.keys(variable.valuesByMode)) {
      const parts = String((await resolveValue(variable.valuesByMode[modeId], 0)) || "").split("|");
      for (const p of parts) if (p) out.add(p);
    }
    return out;
  }

  async function chooseByValue(entries, oldVar) {
    let oldValues;
    try {
      oldValues = await valueSet(oldVar);
    } catch (e) {
      return null;
    }
    if (oldValues.size === 0) return null;
    const hits = [];
    for (const entry of entries) {
      try {
        const candidate = await materialize(entry);
        const values = await valueSet(candidate);
        if ([...oldValues].some((v) => values.has(v))) hits.push(entry);
      } catch (e) {
        /* an uninspectable candidate simply doesn't win */
      }
    }
    return hits.length === 1 ? hits[0] : null;
  }

  // Returns the variable to rebind to, or a string tag when there is
  // nothing safe to do: "connected" (already fine), "dangling",
  // "unmatched", "ambiguous", "failed".
  async function resolveTarget(alias) {
    if (!alias || !alias.id) return null;
    stats.checked++;
    const oldVar = await getVariable(alias.id);
    if (!oldVar) {
      stats.dangling++;
      return "dangling";
    }
    // Already pointing at something this file can legitimately reach:
    // its own local variable, or an enabled library's variable.
    if (localById.has(oldVar.id) || (oldVar.remote && libraryKeys.has(oldVar.key))) {
      stats.alreadyConnected++;
      return "connected";
    }
    let candidates = byName.get(oldVar.name + " " + oldVar.resolvedType) || [];
    let renamed = false;
    if (candidates.length === 0) {
      // Screens from before the colour families gained their "color/" prefix
      // bind names like "content/primary"; the current set holds
      // "color/content/primary". Accept the prefixed name when it exists.
      candidates = byName.get("color/" + oldVar.name + " " + oldVar.resolvedType) || [];
      renamed = candidates.length > 0;
    }
    let entry = null;
    if (candidates.length > 0) {
      entry = await choose(candidates, oldVar);
    } else {
      // The old design system's names, mapped explicitly. A one-to-many
      // rename (content/fixed → fixed-primary or fixed-inverse) is settled
      // by comparing resolved values, so a wrong-but-plausible name can
      // never win.
      const renameEntries = [];
      for (const newName of renameCandidateNames(oldVar.name)) {
        renameEntries.push(...(byName.get(newName + " " + oldVar.resolvedType) || []));
      }
      if (renameEntries.length === 0) {
        stats.unmatched.set(oldVar.name, (stats.unmatched.get(oldVar.name) || 0) + 1);
        return "unmatched";
      }
      entry = renameEntries.length === 1 ? renameEntries[0] : await chooseByValue(renameEntries, oldVar);
      renamed = entry != null;
    }
    if (!entry) {
      stats.ambiguous.set(oldVar.name, (stats.ambiguous.get(oldVar.name) || 0) + 1);
      return "ambiguous";
    }
    try {
      const target = await materialize(entry);
      if (renamed) stats.renamed++;
      return target;
    } catch (e) {
      stats.failed.push('import "' + oldVar.name + '": ' + String(e && e.message ? e.message : e));
      return "failed";
    }
  }

  async function loadTextFonts(node) {
    if (node.type !== "TEXT" || node.characters.length === 0) return;
    if (node.hasMissingFont) throw new Error("missing font");
    const fonts = node.getRangeAllFontNames(0, node.characters.length);
    await Promise.all(fonts.map((f) => figma.loadFontAsync(f)));
  }

  for (const node of nodes) {
    // --- Paint bindings: fills and strokes. The alias lives on the paint
    // object itself, and paints are replaced immutably.
    for (const prop of ["fills", "strokes"]) {
      if (!(prop in node)) continue;
      const paints = node[prop];
      if (!Array.isArray(paints)) continue; // figma.mixed — per-range text fills, skipped
      let changed = false;
      const next = [];
      for (const paint of paints) {
        const alias = paint.boundVariables && paint.boundVariables.color;
        const target = await resolveTarget(alias);
        if (target && typeof target !== "string") {
          next.push(figma.variables.setBoundVariableForPaint(paint, "color", target));
          changed = true;
          stats.rebound++;
        } else {
          next.push(paint);
        }
      }
      if (changed) {
        try {
          node[prop] = next;
        } catch (e) {
          stats.failed.push(nodeLabel(node) + " → " + prop + ": " + String(e && e.message ? e.message : e));
        }
      }
    }

    // --- Effect bindings: shadow colour, radius, spread, offsets.
    if ("effects" in node && Array.isArray(node.effects)) {
      let changed = false;
      const next = [];
      for (const effect of node.effects) {
        let current = effect;
        const bound = effect.boundVariables || {};
        for (const field of Object.keys(bound)) {
          const target = await resolveTarget(bound[field]);
          if (target && typeof target !== "string") {
            current = figma.variables.setBoundVariableForEffect(current, field, target);
            changed = true;
            stats.rebound++;
          }
        }
        next.push(current);
      }
      if (changed) {
        try {
          node.effects = next;
        } catch (e) {
          stats.failed.push(nodeLabel(node) + " → effects: " + String(e && e.message ? e.message : e));
        }
      }
    }

    // --- Everything else on node.boundVariables: numbers (radii, spacing,
    // width/height, strokeWeight), text properties, strings, booleans.
    const bv = node.boundVariables;
    if (!bv) continue;
    for (const field of Object.keys(bv)) {
      // Handled above, or not rebindable through setBoundVariable:
      if (field === "fills" || field === "strokes" || field === "effects") continue;
      if (field === "layoutGrids" || field === "componentProperties" || field === "textRangeFills") continue;
      const alias = bv[field];
      if (Array.isArray(alias)) continue;
      const target = await resolveTarget(alias);
      if (!target || typeof target === "string") continue;
      try {
        await loadTextFonts(node);
        node.setBoundVariable(field, target);
        stats.rebound++;
      } catch (e) {
        stats.failed.push(nodeLabel(node) + " → " + field + ": " + String(e && e.message ? e.message : e));
      }
    }
  }

  figma.ui.postMessage({
    type: "result",
    scope: stats.scope,
    nodesScanned: stats.nodesScanned,
    checked: stats.checked,
    rebound: stats.rebound,
    renamed: stats.renamed,
    alreadyConnected: stats.alreadyConnected,
    dangling: stats.dangling,
    unmatched: [...stats.unmatched.entries()].sort((a, b) => b[1] - a[1]),
    ambiguous: [...stats.ambiguous.entries()].sort((a, b) => b[1] - a[1]),
    failed: stats.failed.slice(0, 50),
    failedTotal: stats.failed.length,
    localVariableCount: localVars.length,
    libraryVariableCount: libraryVarCount,
    libraryError,
  });

  figma.notify(
    stats.rebound + " binding" + (stats.rebound === 1 ? "" : "s") + " repointed" +
      (stats.unmatched.size ? " — " + stats.unmatched.size + " name(s) had no match" : "")
  );
}

function nodeLabel(node) {
  return '"' + node.name + '" (' + node.type.toLowerCase() + ")";
}
