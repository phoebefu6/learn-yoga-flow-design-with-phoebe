"""build_fb_data.py - writes assets/fb-data.js for the Flow Bench.

CONSTRUCTED, end to end. The pose library, every state, kind and effort level (a 1 to 5 teaching
scale), Rosa's five sequence drafts and the transition-unit rules are invented for teaching.
None is a measurement of real people. Run from the repo root:

    python3 materials/build_fb_data.py

JS data is generated with json.dumps, never string interpolation.
"""
import json
import os

# code, name, base, tier, face, sided, kind, effort, default breaths, fixed seconds (0 = breath-timed)
# base: stand, hands-feet, kneel, seat, supine, prone
# tier: 3 standing, 2 hands and feet, 1 kneeling or seated, 0 lying
# face: front (hips to the short edge of the mat), side (hips open to the long edge), none (floor)
# Composite items (a round of sun salutation, a vinyasa) carry separate in and out states.
POSES = [
    # code      name                        base         tier face     sided  kind        eff br  fixed
    ("easy",    "Easy seat (arrival)",      "seat",       1, "none",  False, "neutral",   1, 15, 0),
    ("catcow",  "Cat-cow",                  "kneel",      1, "none",  False, "neutral",   1, 10,  0),
    ("table",   "Tabletop",                 "kneel",      1, "none",  False, "neutral",   1, 3,  0),
    ("child",   "Child's pose",             "kneel",      1, "none",  False, "rest",      1, 8,  0),
    ("dog",     "Downward dog",             "hands-feet", 2, "front", False, "neutral",   2, 6,  0),
    ("plank",   "Plank",                    "hands-feet", 2, "front", False, "core",      3, 3,  0),
    ("mtn",     "Mountain",                 "stand",      3, "front", False, "neutral",   1, 3,  0),
    ("fold",    "Standing forward fold",    "stand",      3, "front", False, "fold",      2, 3,  0),
    ("chair",   "Chair",                    "stand",      3, "front", False, "strength",  3, 5,  0),
    ("lowlg",   "Low lunge",                "kneel",      1, "front", True,  "lunge",     2, 5,  0),
    ("cresc",   "Crescent lunge",           "stand",      3, "front", True,  "lunge",     3, 5,  0),
    ("w1",      "Warrior I",                "stand",      3, "front", True,  "lunge",     3, 5,  0),
    ("w2",      "Warrior II",               "stand",      3, "side",  True,  "lunge",     3, 5,  0),
    ("sideang", "Extended side angle",      "stand",      3, "side",  True,  "lunge",     3, 5,  0),
    ("tri",     "Triangle",                 "stand",      3, "side",  True,  "side-bend", 2, 5,  0),
    ("revcr",   "Revolved crescent lunge",  "stand",      3, "front", True,  "twist",     4, 5,  0),
    ("tree",    "Tree",                     "stand",      3, "front", True,  "balance",   2, 5,  0),
    ("w3",      "Warrior III",              "stand",      3, "front", True,  "balance",   4, 3,  0),
    ("cobra",   "Low cobra",                "prone",      0, "none",  False, "backbend",  2, 3,  0),
    ("locust",  "Locust",                   "prone",      0, "none",  False, "backbend",  3, 4,  0),
    ("camel",   "Camel",                    "kneel",      1, "none",  False, "backbend",  4, 4,  0),
    ("bridge",  "Bridge",                   "supine",     0, "none",  False, "backbend",  3, 5,  0),
    ("boat",    "Boat",                     "seat",       1, "none",  False, "core",      4, 4,  0),
    ("pigeon",  "Pigeon (hip opener)",      "seat",       1, "none",  True,  "fold",      2, 15,  0),
    ("sfold",   "Seated forward fold",      "seat",       1, "none",  False, "fold",      2, 15,  0),
    ("stwist",  "Seated twist",             "seat",       1, "none",  True,  "twist",     2, 5,  0),
    ("knees",   "Knees to chest",           "supine",     0, "none",  False, "fold",      1, 8,  0),
    ("suptw",   "Supine twist",             "supine",     0, "none",  True,  "twist",     1, 10,  0),
    ("rest",    "Final rest",               "supine",     0, "none",  False, "rest",      1, 0,  300),
]

# Composites: one round, its own in and out state. A sun salutation starts and ends in Mountain;
# Sun salutation B adds chair and Warrior I on each side; a vinyasa runs plank, lower, low cobra, downward dog and ends in Downward dog.
COMPOSITES = [
    # code   name                               in(base,tier,face)                 out(base,tier,face)                kind    eff br
    ("sunA", "Sun salutation A (one round)",   ("stand", 3, "front"),             ("stand", 3, "front"),             "flow", 3, 9),
    ("sunB", "Sun salutation B (one round)",   ("stand", 3, "front"),             ("stand", 3, "front"),             "flow", 3, 17),
    ("vin",  "Vinyasa (plank to dog)",         ("hands-feet", 2, "front"),        ("hands-feet", 2, "front"),        "flow", 3, 4),
]

RULES = {
    "strongBackbend": 3,          # a backbend at effort 3 or more needs a fold or rest after it
    "counterWindow": 3,           # within the next 3 items
    "counterKinds": ["fold", "rest"],
    "coolEffort": 2,              # trailing items at effort 2 or less count as cool-down
    "targetSec": 3600,            # a 60-minute class
    "tolSec": 60,                 # on time if within one minute of the target
    "talkSec": 600,               # welcome, demos, props: 10 minutes no breath count covers
    "spbOptions": [4, 5, 6],      # seconds per breath on the bench
    "spbDefault": 5,
}


def seq(*items):
    """item strings: 'code', 'code R', 'code L 5', 'code x3'"""
    out = []
    for s in items:
        t = s.split()
        code, side, br, reps = t[0], "", None, 1
        for x in t[1:]:
            if x in ("L", "R"):
                side = x
            elif x.startswith("x"):
                reps = int(x[1:])
            else:
                br = int(x)
        out.append([code, side, br, reps])
    return out


# Rosa's Thursday class (constructed): five drafts, each fixing one thing.
STAND_R = ["w1 R", "w2 R 6", "sideang R", "tri R 6", "vin", "dog 4"]
STAND_L = ["w1 L", "w2 L 6", "sideang L", "tri L 6", "vin", "dog 4"]
# Second pass, repeat-and-add: the same standing line again, 3 breaths a pose, then a vinyasa.
PASS2 = ["w1 R 3", "w2 R 3", "sideang R 3", "tri R 3", "vin", "dog 3",
         "w1 L 3", "w2 L 3", "sideang L 3", "tri L 3", "vin", "dog 3"]
R1 = seq(
    "easy 30", "catcow 16", "child", "dog", "mtn", "sunA x6", "sunB x5",
    "w1 R", "w2 R 10", "sideang R", "tri R 6", "vin", "dog 4",
    "w1 L", "w2 L 6", "sideang L", "tri L 6", "vin", "dog 4",
    *PASS2,
    "cobra", "locust", "dog", "mtn", "chair 8", "tree R 8", "tree L 8",
    "child", "camel", "child 8", "w3 R", "w3 L",
    "boat 4 x2", "bridge", "mtn", "cresc R", "revcr R", "cresc L", "revcr L",
    "locust", "dog", "pigeon R 20", "pigeon L 20", "sfold 20",
    "bridge", "suptw R 12", "suptw L 12", "stwist R 6", "stwist L 6", "rest",
)
R2 = [list(x) for x in R1]
for x in R2:
    if x[0] == "w2" and x[1] == "R" and x[2] == 10:
        x[2] = 6
R3 = seq(
    "easy 30", "catcow 16", "child", "dog", "mtn", "sunA x6", "sunB x5",
    *STAND_R, *STAND_L, *PASS2,
    "cobra", "locust", "child", "dog", "mtn", "chair 8", "tree R 8", "tree L 8",
    "child", "camel", "child 8", "w3 R", "w3 L",
    "boat 4 x2", "bridge", "knees", "mtn", "cresc R", "revcr R", "cresc L", "revcr L",
    "locust", "child", "dog", "pigeon R 20", "pigeon L 20", "sfold 20",
    "bridge", "knees", "suptw R 12", "suptw L 12", "stwist R 6", "stwist L 6", "rest",
)
# Rung 4: grouped by level. Standing work together, then down to the floor once.
R4 = seq(
    "easy 30", "catcow 16", "child", "dog", "fold", "mtn", "sunA x6", "sunB x5",
    *STAND_R, *STAND_L, *PASS2,
    "fold", "mtn", "chair 8", "tree R 8", "tree L 8", "w3 R", "w3 L",
    "cresc R", "revcr R", "vin", "dog 4", "cresc L", "revcr L", "vin", "dog 6",
    "child", "table", "camel", "child 8", "cobra", "locust", "child 8", "locust", "child 8",
    "boat 4 x2", "bridge", "knees", "bridge", "knees",
    "pigeon R 20", "pigeon L 20", "sfold 20", "stwist R 6", "stwist L 6", "suptw R 12", "suptw L 12", "rest",
)
# Rung 5: rung 4 cut to the hour at 5 seconds a breath: fewer rounds, one locust, shorter holds.
R5 = seq(
    "easy 24", "catcow 12", "child", "dog", "fold", "mtn", "sunA x4", "sunB x4",
    *STAND_R, *STAND_L, *PASS2,
    "fold", "mtn", "chair 6", "tree R 6", "tree L 6", "w3 R", "w3 L",
    "cresc R", "revcr R", "vin", "dog 4", "cresc L", "revcr L", "vin", "dog 6",
    "child", "table", "camel", "child 8", "cobra", "locust", "child 8",
    "boat 4 x2", "bridge", "knees", "bridge", "knees",
    "pigeon R 18", "pigeon L 18", "sfold 18", "stwist R 6", "stwist L 6", "suptw R", "suptw L", "rest",
)

RUNGS = [
    {"id": 1, "label": "First draft", "note": "Every pose she loves, in the order she thought of them", "seq": R1},
    {"id": 2, "label": "Sides balanced", "note": "Warrior II gets the same 5 breaths on both sides", "seq": R2},
    {"id": 3, "label": "Counter-poses added", "note": "A fold or rest after locust, camel and bridge", "seq": R3},
    {"id": 4, "label": "Grouped by level", "note": "Standing work together, then down to the floor once", "seq": R4},
    {"id": 5, "label": "Timed to the hour", "note": "Rung 4 cut to fit 60 minutes at 5 s a breath", "seq": R5},
]


def build():
    poses = []
    for code, name, base, tier, face, sided, kind, eff, br, fixed in POSES:
        st = {"base": base, "tier": tier, "face": face}
        poses.append({"code": code, "name": name, "in": st, "out": st, "sided": sided, "kind": kind,
                      "effort": eff, "breaths": br, "fixed": fixed})
    for code, name, i, o, kind, eff, br in COMPOSITES:
        poses.append({"code": code, "name": name, "in": dict(zip(("base", "tier", "face"), i)),
                      "out": dict(zip(("base", "tier", "face"), o)), "sided": False, "kind": kind,
                      "effort": eff, "breaths": br, "fixed": 0})
    known = {p["code"] for p in poses}
    for r in RUNGS:
        for it in r["seq"]:
            assert it[0] in known, it
    return {"poses": poses, "rules": RULES, "rungs": RUNGS}


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    data = build()
    js = ("/* fb-data.js - GENERATED by materials/build_fb_data.py. Constructed teaching data; "
          "do not edit by hand. */\n"
          "(function (r) { var D = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) +
          "; if (typeof module !== \"undefined\" && module.exports) module.exports = D; else r.FB_DATA = D; })(this);\n")
    with open(os.path.join(here, "..", "assets", "fb-data.js"), "w") as f:
        f.write(js)
    print("wrote assets/fb-data.js:", len(data["poses"]), "poses,", len(data["rungs"]), "rungs")
