"""fb_reference.py - Python reference for the Flow Bench (assets/fb-live.js must agree exactly).

Integer arithmetic throughout. Constructed rules, in plain words:
  - A sequence is an ordered list of items: a pose (or a composite round), a side, breaths, rounds.
  - Class time = holds + transitions + a fixed talk budget (welcome, demos, props: 600 s).
  - Hold time = breaths x rounds x seconds per breath; Final rest is timed by the clock (300 s).
  - Transition units between two items (the out-state of one to the in-state of the next):
      +1 if the base changes (feet, hands and feet, knees, seat, back, front)
      +|tier difference| (3 standing, 2 hands and feet, 1 kneeling or seated, 0 lying)
      +1 if both face the mat and one faces front while the other faces side
      +1 if both are one-sided and the side changes
    and each unit costs one breath of class time.
  - Floor trip: a transition that crosses between tier 2+ and tier 1 or below.
  - Side balance: for every one-sided pose, breaths on the right must equal breaths on the left.
  - Uncountered strong backbend: a backbend at effort 3+ with no fold, neutral or rest pose in
    the next 3 items.
  - Peak: the first item at the highest effort; its start as a whole percent of the moving time.
  - Cool-down: the unbroken run of items at effort 2 or less at the end, in seconds.

    python3 materials/fb_reference.py --json      # canon for every rung at 4, 5 and 6 s a breath
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_fb_data import build  # noqa: E402

D = build()
POSE = {p["code"]: p for p in D["poses"]}
RU = D["rules"]


def units(a, b):
    pa, pb = POSE[a[0]], POSE[b[0]]
    o, i = pa["out"], pb["in"]
    u = 0
    if o["base"] != i["base"]:
        u += 1
    u += abs(o["tier"] - i["tier"])
    if o["face"] != "none" and i["face"] != "none" and o["face"] != i["face"]:
        u += 1
    if pa["sided"] and pb["sided"] and a[1] and b[1] and a[1] != b[1]:
        u += 1
    return u


def analyse(sq, spb):
    items = []
    for code, side, br, reps in sq:
        p = POSE[code]
        b = p["breaths"] if br is None else br
        items.append([code, side, b, reps or 1])
    t = 0
    starts, secs = [], []
    tr_units, max_u, trips = 0, 0, 0
    for k, it in enumerate(items):
        p = POSE[it[0]]
        if k > 0:
            u = units(items[k - 1], it)
            tr_units += u
            if u > max_u:
                max_u = u
            t += u * spb
            if (POSE[items[k - 1][0]]["out"]["tier"] >= 2) != (p["in"]["tier"] >= 2):
                trips += 1
        starts.append(t)
        s = p["fixed"] if p["fixed"] else it[2] * it[3] * spb
        secs.append(s)
        t += s
    flow_end = t
    total = t + RU["talkSec"]
    # side balance
    lr = {}
    for it in items:
        p = POSE[it[0]]
        if p["sided"]:
            d = lr.setdefault(it[0], [0, 0])
            if it[1] == "R":
                d[0] += it[2] * it[3]
            elif it[1] == "L":
                d[1] += it[2] * it[3]
    order = []
    for it in items:
        if POSE[it[0]]["sided"] and it[0] not in order:
            order.append(it[0])
    unbalanced = [[c, lr[c][0], lr[c][1]] for c in order if lr[c][0] != lr[c][1]]
    # counter-poses
    unc = []
    for k, it in enumerate(items):
        p = POSE[it[0]]
        if p["kind"] == "backbend" and p["effort"] >= RU["strongBackbend"]:
            nxt = items[k + 1:k + 1 + RU["counterWindow"]]
            if not any(POSE[n[0]]["kind"] in RU["counterKinds"] for n in nxt):
                unc.append([k + 1, it[0]])
    # peak and cool-down
    top = max(POSE[it[0]]["effort"] for it in items)
    pk = next(k for k, it in enumerate(items) if POSE[it[0]]["effort"] == top)
    peak_pct = (starts[pk] * 100) // flow_end if flow_end else 0
    cool = 0
    for k in range(len(items) - 1, -1, -1):
        if POSE[items[k][0]]["effort"] <= RU["coolEffort"]:
            cool = flow_end - starts[k]
        else:
            break
    hold = sum(secs)
    flow = flow_end
    diff = total - RU["targetSec"]
    return {
        "spb": spb,
        "items": len(items),
        "totalSec": total,
        "holdSec": hold,
        "transSec": flow - hold,
        "talkSec": RU["talkSec"],
        "transUnits": tr_units,
        "maxUnits": max_u,
        "floorTrips": trips,
        "unbalanced": unbalanced,
        "uncountered": unc,
        "peakEffort": top,
        "peakCode": items[pk][0],
        "peakPct": peak_pct,
        "coolSec": cool,
        "diffSec": diff,
        "onTime": abs(diff) <= RU["tolSec"],
    }


def canon():
    return [{"id": r["id"], "runs": [analyse(r["seq"], s) for s in RU["spbOptions"]]} for r in D["rungs"]]


if __name__ == "__main__":
    c = canon()
    if "--json" in sys.argv:
        print(json.dumps(c, sort_keys=True, separators=(",", ":")))
    else:
        for r in c:
            for x in r["runs"]:
                print("rung %d spb %d: %d:%02d (%+ds) items %d trans %du max %d trips %d unbal %s unc %s peak %s@%d%% cool %ds" % (
                    r["id"], x["spb"], x["totalSec"] // 60, x["totalSec"] % 60, x["diffSec"], x["items"],
                    x["transUnits"], x["maxUnits"], x["floorTrips"], x["unbalanced"], x["uncountered"],
                    x["peakCode"], x["peakPct"], x["coolSec"]))
