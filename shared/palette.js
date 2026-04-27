// ═══════════════════════════════════════════════════════════════
// Harmonized OKLCH palette
// — Same lightness + chroma; only hue varies
// — Mixing happens in OKLCH for clean perceptual midpoints
// ═══════════════════════════════════════════════════════════════
//
// Cluster identities are preserved (same set of cluster ids → same
// rough hue family as the original), but every swatch sits on the
// same lightness/chroma plane so mixed colors stay clean.
//
// Three palette modes are defined and selectable at runtime:
//   - "light"        for paper-on-cream backgrounds
//   - "dark"         for ink-on-near-black backgrounds
//   - "muted-paper"  slightly lower chroma, for a cooler editorial look
//
// Output: hex strings per cluster, plus a mix() that averages OKLCH.

(function (root) {
  // ── OKLCH ↔ sRGB conversion ───────────────────────────────────
  // Adapted from Björn Ottosson's reference impl.
  function oklch_to_oklab(L, C, h) {
    const a = Math.cos((h * Math.PI) / 180) * C;
    const b = Math.sin((h * Math.PI) / 180) * C;
    return [L, a, b];
  }
  function oklab_to_linear_srgb(L, a, b) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;
    return [
      +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
  }
  function linear_to_srgb(c) {
    if (c <= 0.0031308) return 12.92 * c;
    return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  }
  function clamp01(x) { return Math.min(1, Math.max(0, x)); }
  function oklchToHex(L, C, h) {
    const [Lk, a, b] = oklch_to_oklab(L, C, h);
    let [r, g, bl] = oklab_to_linear_srgb(Lk, a, b);
    // gamut-clip by reducing chroma if any channel is out of [0,1]
    let scale = 1;
    while (
      (r < -0.0005 || g < -0.0005 || bl < -0.0005 ||
       r > 1.0005 || g > 1.0005 || bl > 1.0005) && scale > 0
    ) {
      scale -= 0.04;
      const Cn = C * scale;
      const [La, aa, bb] = oklch_to_oklab(L, Cn, h);
      [r, g, bl] = oklab_to_linear_srgb(La, aa, bb);
      if (scale <= 0) break;
    }
    r = clamp01(linear_to_srgb(clamp01(r)));
    g = clamp01(linear_to_srgb(clamp01(g)));
    bl = clamp01(linear_to_srgb(clamp01(bl)));
    const to2 = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
    return '#' + to2(r) + to2(g) + to2(bl);
  }

  // ── Cluster definitions: hue per cluster (degrees) ────────────
  // Reordered so neighbors on the wheel are conceptually related.
  // (Hue spacing is roughly even; a few clusters are intentionally
  // grouped — e.g. "models" / "landscape" near each other.)
  const HUES = {
    critical:  20,   // red (hype/critical)
    safety:    340,  // pink-magenta
    security:  10,   // deep red
    agentic:   45,   // orange (agency)
    work:      60,   // amber
    landscape: 70,   // gold
    models:    80,   // ochre
    technical: 110,  // chartreuse
    context:   135,  // green-yellow
    human:     150,  // green
    business:  165,  // teal-green
    dyadic:    195,  // teal
    autonomy:  215,  // cyan-blue
    tools:     225,  // sky blue
    evolved:   250,  // periwinkle
    core:      275,  // violet
    lifecycle: 300,  // magenta-violet
    companies: 0,    // chromatic-near-zero, used only at low chroma
  };

  // Companies/evolved are deliberately quieter (lower chroma).
  const CHROMA_OVERRIDES = {
    companies: 0.04,
    evolved:   0.09,
  };

  // ── Palette presets ───────────────────────────────────────────
  const PRESETS = {
    light:       { L: 0.66, C: 0.155 },  // on cream/paper
    dark:        { L: 0.74, C: 0.165 },  // on near-black; brighter
    'muted-paper': { L: 0.68, C: 0.105 }, // editorial / dusty
  };

  function buildPalette(presetName, baseCL) {
    const { L, C } = PRESETS[presetName] || PRESETS.light;
    const out = {};
    Object.keys(baseCL).forEach((id) => {
      const h = HUES[id] != null ? HUES[id] : 0;
      const c = CHROMA_OVERRIDES[id] != null ? CHROMA_OVERRIDES[id] : C;
      out[id] = {
        ...baseCL[id],
        // keep cx,cy from the original CL definition for force-layout target
        L, C: c, h,
        hex: oklchToHex(L, c, h),
      };
    });
    return out;
  }

  // Mix: average OKLCH lightness + chroma, but average hue with
  // proper circular mean. Keep L/C of the preset stable for visual
  // consistency.
  function mixIds(ids, palette) {
    if (!ids || !ids.length) return '#888888';
    const swatches = ids.map((id) => palette[id]).filter(Boolean);
    if (!swatches.length) return '#888888';
    if (swatches.length === 1) return swatches[0].hex;
    // circular mean of hue using vectors
    let x = 0, y = 0, L = 0, C = 0;
    swatches.forEach((s) => {
      const r = (s.h * Math.PI) / 180;
      x += Math.cos(r);
      y += Math.sin(r);
      L += s.L;
      C += s.C;
    });
    L /= swatches.length;
    C /= swatches.length;
    // when hues nearly cancel (near-opposite), drop chroma so we
    // don't end up at a muddy gray-brown by coincidence.
    const vecLen = Math.sqrt(x * x + y * y) / swatches.length;
    const C_eff = C * Math.max(0.55, vecLen); // 0.55 floor keeps it lively
    let h = (Math.atan2(y, x) * 180) / Math.PI;
    if (h < 0) h += 360;
    return oklchToHex(L, C_eff, h);
  }

  function mixIdsFull(ids, palette) {
    if (!ids || !ids.length) return { hex: '#888888', L: 0.6, C: 0, h: 0 };
    const swatches = ids.map((id) => palette[id]).filter(Boolean);
    if (!swatches.length) return { hex: '#888888', L: 0.6, C: 0, h: 0 };
    if (swatches.length === 1) {
      const s = swatches[0];
      return { hex: s.hex, L: s.L, C: s.C, h: s.h };
    }
    let x = 0, y = 0, L = 0, C = 0;
    swatches.forEach((s) => {
      const r = (s.h * Math.PI) / 180;
      x += Math.cos(r);
      y += Math.sin(r);
      L += s.L;
      C += s.C;
    });
    L /= swatches.length;
    C /= swatches.length;
    const vecLen = Math.sqrt(x * x + y * y) / swatches.length;
    const C_eff = C * Math.max(0.55, vecLen);
    let h = (Math.atan2(y, x) * 180) / Math.PI;
    if (h < 0) h += 360;
    return { hex: oklchToHex(L, C_eff, h), L, C: C_eff, h };
  }

  root.PaletteEngine = { buildPalette, mixIds, mixIdsFull, oklchToHex, HUES, PRESETS };
})(typeof window !== 'undefined' ? window : globalThis);
