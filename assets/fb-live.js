/* fb-live.js - the Flow Bench for learn-yoga-flow-design-with-phoebe
 *
 * CONSTRUCTED, end to end. Rosa, the Harbour Room studio, the 32-item library, every state,
 * kind and effort level (a 1 to 5 teaching scale), the transition-unit rules and every draft are
 * invented for teaching; none is a measurement of real people. Data: assets/fb-data.js, generated
 * by materials/build_fb_data.py. Python reference: materials/fb_reference.py, which must agree
 * with this file exactly (integer arithmetic throughout).
 *
 * The rules, in plain words:
 *   - Class time = holds + transitions + a fixed 10-minute talk budget (welcome, demos, props).
 *   - Hold = breaths x rounds x seconds per breath; Final rest is timed by the clock (300 s).
 *   - Transition units, from one item's out-state to the next item's in-state: +1 base change,
 *     +|tier change| (3 standing, 2 hands and feet, 1 kneeling or seated, 0 lying), +1 front/side
 *     facing change, +1 side change between one-sided poses. One unit costs one breath.
 *   - Floor trip: a transition across tier 2+ and tier 1 or below.
 *   - Side balance: breaths right = breaths left for every one-sided pose.
 *   - Uncountered strong backbend: effort 3+ backbend, no fold or rest in the next 3 items.
 *   - Peak: first item at the top effort, start as a whole percent of moving time.
 *   - Cool-down: the unbroken run of effort-2-or-less items at the end, in seconds.
 * Break lever: the breath clock, 4, 5 or 6 seconds a breath.
 */
(function (root) {
  "use strict";

  var D = root.FB_DATA || (typeof require === "function" ? require("./fb-data.js") : null);
  var POSE = {};
  D.poses.forEach(function (p) { POSE[p.code] = p; });
  var RU = D.rules;

  function units(a, b) {
    var pa = POSE[a[0]], pb = POSE[b[0]], o = pa.out, i = pb["in"], u = 0;
    if (o.base !== i.base) u += 1;
    u += Math.abs(o.tier - i.tier);
    if (o.face !== "none" && i.face !== "none" && o.face !== i.face) u += 1;
    if (pa.sided && pb.sided && a[1] && b[1] && a[1] !== b[1]) u += 1;
    return u;
  }

  function analyse(sq, spb) {
    var items = sq.map(function (x) { var p = POSE[x[0]]; return [x[0], x[1], x[2] === null || x[2] === undefined ? p.breaths : x[2], x[3] || 1]; });
    var t = 0, starts = [], secs = [], unitsBefore = [], trUnits = 0, maxU = 0, trips = 0, tripAt = [];
    items.forEach(function (it, k) {
      var p = POSE[it[0]], u = 0;
      if (k > 0) {
        u = units(items[k - 1], it);
        trUnits += u; if (u > maxU) maxU = u;
        t += u * spb;
        if ((POSE[items[k - 1][0]].out.tier >= 2) !== (p["in"].tier >= 2)) { trips += 1; tripAt.push(k); }
      }
      unitsBefore.push(u);
      starts.push(t);
      var s = p.fixed ? p.fixed : it[2] * it[3] * spb;
      secs.push(s); t += s;
    });
    var flowEnd = t, total = t + RU.talkSec;
    var lr = {}, order = [];
    items.forEach(function (it) {
      var p = POSE[it[0]];
      if (!p.sided) return;
      if (!lr[it[0]]) { lr[it[0]] = [0, 0]; order.push(it[0]); }
      if (it[1] === "R") lr[it[0]][0] += it[2] * it[3];
      else if (it[1] === "L") lr[it[0]][1] += it[2] * it[3];
    });
    var unbalanced = order.filter(function (c) { return lr[c][0] !== lr[c][1]; }).map(function (c) { return [c, lr[c][0], lr[c][1]]; });
    var unc = [];
    items.forEach(function (it, k) {
      var p = POSE[it[0]];
      if (p.kind === "backbend" && p.effort >= RU.strongBackbend) {
        var nxt = items.slice(k + 1, k + 1 + RU.counterWindow);
        if (!nxt.some(function (n) { return RU.counterKinds.indexOf(POSE[n[0]].kind) >= 0; })) unc.push([k + 1, it[0]]);
      }
    });
    var top = 0; items.forEach(function (it) { if (POSE[it[0]].effort > top) top = POSE[it[0]].effort; });
    var pk = 0; for (var q = 0; q < items.length; q++) { if (POSE[items[q][0]].effort === top) { pk = q; break; } }
    var peakPct = flowEnd ? Math.floor(starts[pk] * 100 / flowEnd) : 0;
    var cool = 0;
    for (var k2 = items.length - 1; k2 >= 0; k2--) {
      if (POSE[items[k2][0]].effort <= RU.coolEffort) cool = flowEnd - starts[k2]; else break;
    }
    var hold = secs.reduce(function (a, b) { return a + b; }, 0);
    var diff = total - RU.targetSec;
    return {
      spb: spb, items: items.length, totalSec: total, holdSec: hold, transSec: flowEnd - hold, talkSec: RU.talkSec,
      transUnits: trUnits, maxUnits: maxU, floorTrips: trips, unbalanced: unbalanced, uncountered: unc,
      peakEffort: top, peakCode: items[pk][0], peakPct: peakPct, coolSec: cool, diffSec: diff, onTime: Math.abs(diff) <= RU.tolSec,
      _items: items, _starts: starts, _secs: secs, _unitsBefore: unitsBefore, _tripAt: tripAt, _flowEnd: flowEnd, _pk: pk
    };
  }

  function strip(a) { var o = {}; Object.keys(a).forEach(function (k) { if (k.charAt(0) !== "_") o[k] = a[k]; }); return o; }
  function canon() {
    return D.rungs.map(function (r) { return { id: r.id, runs: RU.spbOptions.map(function (s) { return strip(analyse(r.seq, s)); }) }; });
  }

  /* own sequence: one item per line or comma, "code-or-name [R|L] [breaths] [xRounds]" */
  function parseSeq(txt) {
    var byName = {};
    D.poses.forEach(function (p) { byName[p.code.toLowerCase()] = p.code; byName[p.name.toLowerCase()] = p.code; });
    var out = [], bad = [];
    (txt || "").split(/[\n,]/).forEach(function (raw) {
      var s = raw.trim(); if (!s) return;
      var side = "", br = null, reps = 1;
      var toks = s.split(/\s+/), keep = [];
      toks.forEach(function (tk) {
        if (/^[LR]$/i.test(tk)) side = tk.toUpperCase();
        else if (/^x\d+$/i.test(tk)) reps = parseInt(tk.slice(1), 10);
        else if (/^\d+$/.test(tk)) br = parseInt(tk, 10);
        else keep.push(tk);
      });
      var c = byName[keep.join(" ").toLowerCase()];
      if (!c) { bad.push(s); return; }
      if (POSE[c].sided && !side) side = "R";
      out.push([c, POSE[c].sided ? side : "", br, reps]);
    });
    return { seq: out, bad: bad };
  }

  var api = { D: D, POSE: POSE, units: units, analyse: analyse, canon: canon, parseSeq: parseSeq };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.FB = api;

  /* ------------------------------------------------------------------ browser UI */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function mmss(s) { var n = Math.abs(s); return (s < 0 ? "-" : "") + Math.floor(n / 60) + ":" + ("0" + (n % 60)).slice(-2); }
  function nm(c) { return POSE[c].name; }

  var state = { rung: 1, spb: RU.spbDefault, who: "r", own: null };
  var els = {}, rootEl;

  function currentSeq() { return state.who === "o" && state.own ? state.own : D.rungs[state.rung - 1].seq; }

  var TIER_FILL = ["#E5F3F2", "#FAF0F8", "#E6C3DF", "#9E4F92"];
  var TIER_NAME = ["lying", "kneeling or seated", "hands and feet", "standing"];

  function chart(a) {
    var W = 880, H = 330, X0 = 70, X1 = 840, Y0 = 220, Y1 = 64;
    var T = a._flowEnd || 1;
    var x = function (s) { return X0 + (X1 - X0) * s / T; };
    var y = function (e) { return Y0 - (Y0 - Y1) * e / 5; };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Effort across the moving part of the class, ' + mmss(a._flowEnd) +
      ' long. Peak effort ' + a.peakEffort + ' at ' + a.peakPct + ' percent, in ' + esc(nm(a.peakCode)) + '. Floor trips: ' + a.floorTrips +
      '. Uncountered strong backbends: ' + a.uncountered.length + '. Cool-down ' + mmss(a.coolSec) + '.">';
    s += '<path d="M30 20 h22" stroke="#9E4F92" stroke-width="2.6"/><text class="ab-cap" x="58" y="24">effort, 1 to 5</text>';
    s += '<path d="M176 13 v14" stroke="#0F6B6B" stroke-width="2"/><text class="ab-cap" x="184" y="24">floor trip</text>';
    s += '<circle cx="270" cy="20" r="6" fill="none" stroke="#991B1B" stroke-width="2"/><text class="ab-cap" x="282" y="24">backbend with no counter</text>';
    s += '<path d="M450 20 l6 -7 l6 7 l-6 7 z" fill="#0F6B6B"/><text class="ab-cap" x="468" y="24">peak</text>';
    s += '<text class="ab-cap" x="520" y="24">band: body level (standing to lying)</text>';
    [1, 3, 5].forEach(function (v) {
      s += '<path d="M' + (X0 - 5) + ' ' + y(v).toFixed(1) + ' H' + X0 + '" stroke="#66566A" stroke-width="1.2"/>';
      s += '<text class="ab-tick" x="' + (X0 - 8) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>';
    });
    // level band
    a._items.forEach(function (it, k) {
      var x0 = x(a._starts[k]), x1 = x(a._starts[k] + a._secs[k]);
      var tier = POSE[it[0]]["in"].tier;
      s += '<rect x="' + x0.toFixed(1) + '" y="' + (Y0 + 30) + '" width="' + Math.max(0.6, x1 - x0).toFixed(1) + '" height="14" fill="' + TIER_FILL[tier] + '"/>';
    });
    s += '<rect x="' + X0 + '" y="' + (Y0 + 30) + '" width="' + (X1 - X0) + '" height="14" fill="none" stroke="#D9C9D6" stroke-width="1"/>';
    // effort step line
    var d = "";
    a._items.forEach(function (it, k) {
      var e = POSE[it[0]].effort, x0 = x(a._starts[k]), x1 = x(a._starts[k] + a._secs[k]);
      d += (k ? " L" : "M") + x0.toFixed(1) + " " + y(e).toFixed(1) + " L" + x1.toFixed(1) + " " + y(e).toFixed(1);
    });
    s += '<path d="' + d + '" fill="none" stroke="#9E4F92" stroke-width="2.4" stroke-linejoin="round"/>';
    a._tripAt.forEach(function (k) { var xx = x(a._starts[k]).toFixed(1); s += '<path d="M' + xx + ' ' + (Y0 + 26) + ' v22" stroke="#0F6B6B" stroke-width="2"/>'; });
    a.uncountered.forEach(function (u) { var k = u[0] - 1; s += '<circle cx="' + x(a._starts[k] + a._secs[k] / 2).toFixed(1) + '" cy="' + (y(POSE[u[1]].effort) - 14).toFixed(1) + '" r="8" fill="none" stroke="#991B1B" stroke-width="2.2"/>'; });
    var px = x(a._starts[a._pk]), py = y(a.peakEffort) - 16;
    if (a.uncountered.some(function (u) { return u[0] - 1 === a._pk; })) py -= 22;
    s += '<path d="M' + px.toFixed(1) + ' ' + (py - 7).toFixed(1) + ' l6 7 l-6 7 l-6 -7 z" fill="#0F6B6B"/>';
    s += '<path d="M' + X0 + ' ' + Y0 + ' H' + X1 + ' M' + X0 + ' ' + Y0 + ' V' + Y1 + '" stroke="#66566A" stroke-width="1.2"/>';
    for (var m = 0; m * 600 <= T; m++) {
      var xm = x(m * 600);
      s += '<path d="M' + xm.toFixed(1) + ' ' + Y0 + ' v5" stroke="#66566A" stroke-width="1.2"/>';
      s += '<text class="ab-tick" x="' + xm.toFixed(1) + '" y="' + (Y0 + 20) + '" text-anchor="middle">' + (m * 10) + ' min</text>';
    }
    s += '<text class="ab-cap" x="' + X0 + '" y="' + (Y0 + 64) + '">Moving time only: the 10-minute talk budget is not drawn. Constructed library and effort levels.</text>';
    s += '<text class="ab-cap" x="' + X0 + '" y="' + (Y0 + 82) + '">Band, darkest to lightest: standing, hands and feet, kneeling or seated, lying.</text>';
    return s + '</svg>';
  }

  function table(a) {
    var unc = {}; a.uncountered.forEach(function (u) { unc[u[0] - 1] = true; });
    var trip = {}; a._tripAt.forEach(function (k) { trip[k] = true; });
    var h = '<table class="fb-grid"><thead><tr><th scope="col">#</th><th scope="col">Starts</th><th scope="col">Item</th><th scope="col">Side</th><th scope="col">Breaths</th><th scope="col">Effort</th><th scope="col">Units in</th><th scope="col">Note</th></tr></thead><tbody>';
    a._items.forEach(function (it, k) {
      var p = POSE[it[0]], note = [];
      if (trip[k]) note.push("floor trip");
      if (unc[k]) note.push("no counter-pose");
      if (k === a._pk) note.push("peak");
      h += '<tr class="' + (unc[k] ? "is-once" : "") + '"><td class="fb-n">' + (k + 1) + '</td><td class="fb-n">' + mmss(a._starts[k]) + '</td><td class="fb-pose">' + esc(p.name) +
        '</td><td>' + (it[1] || "-") + '</td><td>' + (p.fixed ? "clock " + mmss(p.fixed) : it[2] + (it[3] > 1 ? " x" + it[3] : "")) + '</td><td>' + p.effort + '</td><td>' + (k ? a._unitsBefore[k] : "-") +
        '</td><td class="fb-n">' + note.join(", ") + '</td></tr>';
    });
    return h + '</tbody></table>';
  }

  function metric(label, val, unit) {
    return '<div class="mb-metric"><span class="mb-mkind is-heuristic">modelled</span><span class="mb-mlabel">' + esc(label) + '</span><span class="mb-mvalue">' + esc(val) + '</span><span class="mb-munit">' + esc(unit) + '</span></div>';
  }

  function render() {
    var a = analyse(currentSeq(), state.spb);
    var name = state.who === "o" ? "Your sequence" : "Rung " + state.rung;
    var problems = a.unbalanced.length + a.uncountered.length + (a.onTime ? 0 : 1) + (a.floorTrips > 2 ? 1 : 0);
    var cls = problems === 0 ? "is-good" : (a.uncountered.length || Math.abs(a.diffSec) > 300) ? "is-bad" : "is-ok";
    els.verdict.className = "mb-verdict " + cls;
    els.verdict.textContent = name + " at " + state.spb + " s a breath: " + mmss(a.totalSec) + " (" + (a.diffSec >= 0 ? "+" : "") + mmss(a.diffSec) + " against 60:00), " +
      a.unbalanced.length + " unbalanced " + (a.unbalanced.length === 1 ? "pose" : "poses") + ", " + a.uncountered.length + " uncountered " + (a.uncountered.length === 1 ? "backbend" : "backbends") +
      ", " + a.floorTrips + " floor " + (a.floorTrips === 1 ? "trip" : "trips");
    els.metrics.innerHTML =
      metric("Class time", mmss(a.totalSec), (a.onTime ? "on time: " : "target 60:00, off by ") + mmss(Math.abs(a.diffSec))) +
      metric("Holds, transitions, talk", mmss(a.holdSec) + " · " + mmss(a.transSec) + " · " + mmss(a.talkSec), "where the minutes go") +
      metric("Transition units", a.transUnits, "largest single move: " + a.maxUnits) +
      metric("Floor trips", a.floorTrips, "times the room goes down or up") +
      metric("Side balance", a.unbalanced.length ? a.unbalanced.map(function (u) { return nm(u[0]) + " " + u[1] + " R / " + u[2] + " L"; }).join("; ") : "even", "breaths right vs left") +
      metric("Uncountered backbends", a.uncountered.length, a.uncountered.length ? a.uncountered.map(function (u) { return nm(u[1]) + " (item " + u[0] + ")"; }).join(", ") : "every strong backbend is followed by a fold or rest") +
      metric("Peak", nm(a.peakCode) + " at " + a.peakPct + "%", "effort " + a.peakEffort + " of 5, share of moving time") +
      metric("Cool-down", mmss(a.coolSec), "unbroken effort 2 or less at the end");
    els.chart.innerHTML = chart(a);
    els.table.innerHTML = table(a);
    els.rungs.forEach(function (x) { x.parentNode.classList.toggle("is-on", +x.value === state.rung && state.who === "r"); x.checked = +x.value === state.rung; });
    els.spbs.forEach(function (x) { x.parentNode.classList.toggle("is-on", +x.value === state.spb); x.checked = +x.value === state.spb; });
  }

  function seqText(sq) {
    return sq.map(function (x) { return x[0] + (x[1] ? " " + x[1] : "") + (x[2] !== null && x[2] !== undefined ? " " + x[2] : "") + (x[3] > 1 ? " x" + x[3] : ""); }).join("\n");
  }

  function readOwn() {
    var r = parseSeq(els.own.value);
    if (r.bad.length || !r.seq.length) {
      els.ownMsg.textContent = "Not run: " + (r.seq.length ? "unknown item " + r.bad.slice(0, 4).join("; ") : "write at least one item") + ". Codes are in the library below.";
      return false;
    }
    state.own = r.seq;
    els.ownMsg.textContent = "Running your sequence: " + r.seq.length + " items. It stays in this tab; nothing is stored or sent.";
    return true;
  }

  function build() {
    rootEl.innerHTML = "";
    var wrap = document.createElement("div"); wrap.className = "mb-wrap"; rootEl.appendChild(wrap);
    wrap.innerHTML = '<h4>The Flow Bench <span class="mb-mkind is-heuristic">constructed</span></h4><p class="mb-intro">Rosa\'s 60-minute Thursday flow at the Harbour Room, computed in your browser. The library, its effort levels, the transition-unit rules and every draft are constructed for teaching; none is a measurement of real people. Not medical advice.</p>';

    var who = document.createElement("div"); who.className = "ab-top";
    who.innerHTML = '<div class="ab-pick" role="radiogroup" aria-label="Whose sequence">Whose sequence <label class="fb-who"><input type="radio" name="fb-who" value="r" checked> Rosa\'s drafts</label><label class="fb-who"><input type="radio" name="fb-who" value="o"> My own sequence</label></div>';
    wrap.appendChild(who);

    var own = document.createElement("div"); own.className = "fb-own"; own.hidden = true;
    own.innerHTML = '<div class="mb-edit"><label for="fb-seq">One item per line: code or name, then R or L, breaths, and xN for rounds (for example: w2 R 5, sunA x3)</label>' +
      '<textarea id="fb-seq" rows="10" spellcheck="false"></textarea></div>' +
      '<p class="fb-row"><button class="btn primary" type="button" id="fb-run">Run my sequence</button> <span class="mb-hint" id="fb-ownmsg">Starts as a copy of rung 5. Your sequence stays in this browser tab.</span></p>';
    wrap.appendChild(own);

    var panel = document.createElement("div"); panel.className = "mb-presets"; els.rungs = [];
    D.rungs.forEach(function (g) {
      var l = document.createElement("label"); l.className = "mb-preset";
      l.innerHTML = '<input type="radio" name="fb-rung" value="' + g.id + '"><span class="mb-pname">' + g.id + " · " + esc(g.label) + '</span><span class="mb-pnote">' + esc(g.note) + "</span>";
      panel.appendChild(l); els.rungs.push(l.querySelector("input"));
    });
    wrap.appendChild(panel);

    var clock = document.createElement("div"); clock.className = "mb-presets"; els.spbs = [];
    RU.spbOptions.forEach(function (v) {
      var l = document.createElement("label"); l.className = "mb-preset" + (v === RU.spbDefault ? "" : " is-anti");
      l.innerHTML = '<input type="radio" name="fb-spb" value="' + v + '"><span class="mb-pname">' + v + ' seconds a breath</span><span class="mb-pnote">' +
        (v === RU.spbDefault ? "The planning default (constructed)" : v < RU.spbDefault ? "Break: the room breathes faster" : "Break: the room breathes slower") + "</span>";
      clock.appendChild(l); els.spbs.push(l.querySelector("input"));
    });
    wrap.appendChild(clock);

    els.verdict = document.createElement("div"); wrap.appendChild(els.verdict);
    els.metrics = document.createElement("div"); els.metrics.className = "mb-metrics"; wrap.appendChild(els.metrics);
    var card = document.createElement("div"); card.className = "ab-card";
    card.innerHTML = '<h4>Effort and body level across the class <span class="mb-mkind is-heuristic">modelled</span></h4>';
    els.chart = document.createElement("div"); els.chart.className = "mb-stage"; card.appendChild(els.chart);
    wrap.appendChild(card);
    var card2 = document.createElement("details"); card2.className = "card fb-lib";
    card2.innerHTML = '<summary><span class="mode self">Detail</span>Item by item: start time, breaths, transition units<span class="caret">▶</span></summary>';
    els.table = document.createElement("div"); els.table.className = "fb-gridwrap body"; card2.appendChild(els.table);
    wrap.appendChild(card2);

    var lib = document.createElement("details"); lib.className = "card fb-lib";
    lib.innerHTML = '<summary><span class="mode self">Reference</span>The library: codes, body level, facing, effort<span class="caret">▶</span></summary><div class="body"><div class="fb-gridwrap"><table class="fb-grid fb-libt"><thead><tr><th scope="col">Code</th><th scope="col">Item</th><th scope="col">Starts at</th><th scope="col">Ends at</th><th scope="col">Facing</th><th scope="col">One side</th><th scope="col">Kind</th><th scope="col">Effort</th><th scope="col">Breaths</th></tr></thead><tbody>' +
      D.poses.map(function (p) {
        return '<tr><td><code>' + p.code + '</code></td><td>' + esc(p.name) + '</td><td>' + TIER_NAME[p["in"].tier] + '</td><td>' + TIER_NAME[p.out.tier] + '</td><td>' + p["in"].face + '</td><td>' + (p.sided ? "yes" : "-") + '</td><td>' + p.kind + '</td><td>' + p.effort + '</td><td>' + (p.fixed ? "clock " + mmss(p.fixed) : p.breaths) + '</td></tr>';
      }).join("") +
      '</tbody></table></div><p class="mb-hint">Constructed teaching levels. Effort is a 1 to 5 planning scale, not a heart-rate measurement.</p></div>';
    wrap.appendChild(lib);

    els.own = own.querySelector("#fb-seq"); els.ownMsg = own.querySelector("#fb-ownmsg");
    els.own.value = seqText(D.rungs[4].seq);
    els.rungs.forEach(function (x) { x.addEventListener("change", function () { state.rung = +x.value; if (state.who === "o") { state.who = "r"; who.querySelector('input[value="r"]').checked = true; own.hidden = true; } render(); }); });
    els.spbs.forEach(function (x) { x.addEventListener("change", function () { state.spb = +x.value; render(); }); });
    who.querySelectorAll("input").forEach(function (x) {
      x.addEventListener("change", function () {
        state.who = x.value; own.hidden = state.who !== "o";
        if (state.who === "o" && !state.own) readOwn();
        render();
      });
    });
    own.querySelector("#fb-run").addEventListener("click", function () { if (readOwn()) render(); });
    render();
  }

  function init() { rootEl = document.getElementById("flow-bench"); if (rootEl) build(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(this);
