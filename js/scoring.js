function norm(s) {
  return (s || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .toLowerCase();
}

function matchesAny(answer, accepted) {
  const n = norm(answer);
  if (!n) return false;
  return accepted.some((a) => norm(a) === n || norm(a).replace(/\s/g, "") === n.replace(/\s/g, ""));
}

function matchesBlank(answer, acceptedList) {
  const n = norm(answer);
  if (!n) return false;
  return acceptedList.some((a) => norm(a) === n);
}

function hasReason(text) {
  const t = (text || "").trim();
  if (t.length < 12) return false;
  return /\b(because|since|so that|as|to help|want to)\b/i.test(t);
}

const Q8_REWRITES = {
  2: ["enjoyed", "ends too soon", "needs one more", "liked", "too soon"],
  4: ["after", "played"],
  5: ["jean", "drew", "background music", "monster sounds", "sujin made"],
};

function scoreQ8Row(numStr, rewrite) {
  const num = parseInt(String(numStr).replace(/[^\d]/g, ""), 10);
  if (![2, 4, 5].includes(num)) return { ok: false, partial: false };
  const r = norm(rewrite);
  if (!r) return { ok: false, partial: true };
  const keys = Q8_REWRITES[num];
  const hit = keys.some((k) => r.includes(k.toLowerCase()));
  return { ok: hit, partial: !hit && r.length > 8 };
}

function scoreMultiBlank(userBlanks, acceptedMap, pointsPerBlank) {
  let earned = 0;
  const max = Object.keys(acceptedMap).length * pointsPerBlank;
  const details = [];
  for (const key of Object.keys(acceptedMap)) {
    const ok = matchesBlank(userBlanks[key], acceptedMap[key]);
    if (ok) earned += pointsPerBlank;
    details.push({ key, ok, expected: acceptedMap[key][0] });
  }
  return { earned, max, details };
}

function scoreQ10Sections(sections, userValues) {
  let earned = 0;
  let max = 0;
  const details = [];
  let idx = 0;
  for (const sec of sections) {
    for (let b = 0; b < sec.blanks; b++) {
      max += 1;
      const val = userValues[idx] || "";
      const acc = sec.accepted[b];
      const alt = sec.alt && sec.alt[b];
      const lists = alt ? [acc, alt] : [acc];
      const ok = lists.some((list) => matchesBlank(val, list));
      if (ok) earned += 1;
      details.push({ idx, ok, expected: acc[0] });
      idx++;
    }
  }
  return { earned, max, details };
}

window.QuizScoring = {
  norm,
  matchesAny,
  matchesBlank,
  hasReason,
  scoreQ8Row,
  scoreMultiBlank,
  scoreQ10Sections,
};
