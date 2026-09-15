(function () {
  const S = window.QuizScoring;
  const EX = window.QUIZ_EXPLAIN_KO;
  const form = document.getElementById("quiz-form");
  const resultsEl = document.getElementById("results");
  const scoreBanner = document.getElementById("score-banner");
  const breakdownEl = document.getElementById("score-breakdown");
  const mistakesEl = document.getElementById("mistakes-list");

  const QUESTION_MAX = {
    1: 7,
    2: 8,
    3: 8,
    4: 8,
    5: 10,
    6: 12,
    7: 5,
    8: 9,
    9: 10,
    10: 10,
    11: 4,
    12: 9,
  };

  /** @type {Array<object>} */
  let allParts = [];

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s || "(비어 있음)";
    return d.innerHTML;
  }

  function meta(part) {
    const m = EX[part.id] || { correct: part.correct, explain: "지문과 보기를 다시 읽어 보세요." };
    return m;
  }

  function addPart(part) {
    allParts.push(part);
    return part;
  }

  function blankPart(id, qNum, label, max, student, acceptedList, fb) {
    const ok = S.matchesBlank(student, acceptedList);
    const { correct, explain } = meta({ id, correct: acceptedList[0] });
    return addPart({
      id,
      qNum,
      label,
      max,
      earned: ok ? max : 0,
      ok,
      partial: false,
      student: (student || "").trim(),
      correct,
      explain,
      fb,
      practice: false,
    });
  }

  function textPart(id, qNum, label, max, student, acceptedList, fb, extraOk) {
    const ok = S.matchesAny(student, acceptedList) || (extraOk && extraOk(student));
    const { correct, explain } = meta({ id, correct: acceptedList[0] });
    return addPart({
      id,
      qNum,
      label,
      max,
      earned: ok ? max : 0,
      ok,
      partial: false,
      student: (student || "").trim(),
      correct,
      explain,
      fb,
      practice: false,
    });
  }

  function renderPartHtml(p) {
    if (p.practice) {
      if (p.ok) {
        return (
          `<p class="result-line ok-line">✓ ${esc(p.label)} — 연습 답안 인정</p>` +
          `<details class="explain-toggle"><summary>해설 보기</summary><p>${esc(p.explain)}</p>` +
          `<p class="answer-key">예시: ${esc(p.correct)}</p></details>`
        );
      }
      return (
        `<p class="result-line warn-line">△ ${esc(p.label)}</p>` +
        `<p><strong>내 답:</strong> ${esc(p.student)}</p>` +
        `<p class="explain-ko">${esc(p.explain)}</p>` +
        `<p class="tip-ko">💡 이유를 꼭 넣으세요. <em>because</em>, <em>since</em> 등으로 ‘왜?’에 답하면 좋습니다.</p>`
      );
    }

    if (p.ok) {
      return (
        `<p class="result-line ok-line">✓ ${esc(p.label)} (${p.earned}/${p.max}점)</p>` +
        `<details class="explain-toggle"><summary>해설 보기</summary><p>${esc(p.explain)}</p></details>`
      );
    }

    const partialNote = p.partial ? ` <span class="partial-tag">부분 점수 ${p.earned}/${p.max}점</span>` : "";
    return (
      `<div class="mistake-inline">` +
      `<p class="result-line bad-line">✗ ${esc(p.label)}${partialNote} (${p.earned}/${p.max}점)</p>` +
      `<p><strong>내 답:</strong> ${esc(p.student)}</p>` +
      `<p><strong>정답:</strong> ${esc(p.correct)}</p>` +
      `<p class="explain-ko"><strong>해설:</strong> ${esc(p.explain)}</p>` +
      `</div>`
    );
  }

  function flushFeedbackGroups() {
    const byFb = {};
    for (const p of allParts) {
      if (!byFb[p.fb]) byFb[p.fb] = [];
      byFb[p.fb].push(p);
    }
    for (const [fb, parts] of Object.entries(byFb)) {
      const el = document.getElementById("fb-" + fb);
      if (!el) continue;
      const allOk = parts.every((x) => x.ok || (x.practice && x.ok));
      const anyBad = parts.some((x) => !x.ok);
      el.innerHTML = parts.map(renderPartHtml).join("");
      el.className = "feedback show " + (anyBad ? (parts.some((x) => x.partial) ? "practice" : "incorrect") : "correct");
    }
  }

  function renderSummary(earnedObjective, maxObjective, openEarned, openMax) {
    const totalEarned = earnedObjective + openEarned;
    const totalMax = maxObjective + openMax;
    const pct = totalMax ? Math.round((totalEarned / totalMax) * 100) : 0;
    scoreBanner.innerHTML =
      `<div class="score-main">${totalEarned} / ${totalMax} 점</div>` +
      `<div class="score-percent">${pct}%</div>` +
      `<div class="score-sub">객관식·빈칸 ${earnedObjective} / ${maxObjective}점 · 서술형 연습 ${openEarned} / ${openMax}점</div>`;
  }

  function renderBreakdown() {
    const byQ = {};
    for (const p of allParts) {
      if (!byQ[p.qNum]) byQ[p.qNum] = { earned: 0, max: QUESTION_MAX[p.qNum] || 0 };
      byQ[p.qNum].earned += p.earned;
    }
    let html = '<table class="breakdown-table"><thead><tr><th>문항</th><th>받은 점수</th><th>만점</th><th>비율</th></tr></thead><tbody>';
    for (let q = 1; q <= 12; q++) {
      const row = byQ[q] || { earned: 0, max: QUESTION_MAX[q] };
      const qp = row.max ? Math.round((row.earned / row.max) * 100) : 0;
      const cls = row.earned === row.max ? "row-full" : row.earned === 0 ? "row-zero" : "row-part";
      html += `<tr class="${cls}"><td>${q}번</td><td>${row.earned}</td><td>${row.max}</td><td>${qp}%</td></tr>`;
    }
    html += "</tbody></table>";
    breakdownEl.innerHTML = html;
  }

  function renderMistakesList() {
    const mistakes = allParts.filter((p) => !p.ok && !p.practice);
    const partials = allParts.filter((p) => p.partial && !p.ok);
    const practiceMiss = allParts.filter((p) => p.practice && !p.ok);

    if (!mistakes.length && !partials.length && !practiceMiss.length) {
      mistakesEl.innerHTML = '<p class="no-mistakes">모든 객관식·빈칸 문항을 맞혔습니다. 서술형도 이유를 잘 썼어요!</p>';
      return;
    }

    let html = "";
    if (mistakes.length || partials.length) {
      html += '<h3 class="mistakes-heading">틀린 항목 · 부분 오답</h3><ul class="mistakes-ul">';
      for (const p of [...mistakes, ...partials.filter((x) => !mistakes.includes(x))]) {
        html +=
          `<li><strong>${esc(p.qNum)}번 ${esc(p.label)}</strong> (${p.earned}/${p.max}점)<br>` +
          `내 답: <em>${esc(p.student)}</em> → 정답: <strong>${esc(p.correct)}</strong><br>` +
          `<span class="explain-ko">${esc(p.explain)}</span></li>`;
      }
      html += "</ul>";
    }
    if (practiceMiss.length) {
      html += '<h3 class="mistakes-heading">서술형 (5번) — 이유 추가 연습</h3><ul class="mistakes-ul practice-ul">';
      for (const p of practiceMiss) {
        html +=
          `<li><strong>${esc(p.label)}</strong><br>` +
          `내 답: <em>${esc(p.student)}</em><br>` +
          `<span class="explain-ko">${esc(p.explain)}</span><br>` +
          `<span class="tip-ko">💡 영어로 답한 뒤 <em>because …</em> 로 이유를 붙여 보세요.</span></li>`;
      }
      html += "</ul>";
    }
    mistakesEl.innerHTML = html;
  }

  function grade() {
    allParts = [];
    document.querySelectorAll(".feedback").forEach((el) => {
      el.className = "feedback";
      el.innerHTML = "";
    });

    // 1-1
    const a11 = document.querySelector('[name="1-1"]').value;
    textPart("1-1", 1, "1-1 우체국 번호", 2, a11, ["2", "②", "2번"], "1-1");

    // 1-2
    const acc12 = { 1: ["Go"], 2: ["straight"], 3: ["turn"], 4: ["on"], 5: ["left"] };
    const labels12 = ["(1) 첫 단어", "(2) straight", "(3) turn", "(4) on", "(5) left"];
    for (let i = 1; i <= 5; i++) {
      blankPart(
        `1-2-${i}`,
        1,
        `1-2 빈칸 ${labels12[i - 1]}`,
        1,
        document.querySelector(`[name="1-2-${i}"]`).value,
        acc12[i],
        "1-2"
      );
    }

    // 2-1
    const a21 = document.querySelector('[name="2-1"]').value;
    textPart(
      "2-1",
      2,
      "2-1 ㉠ 완성",
      4,
      a21,
      ["I'm interested in", "I am interested in", "I'm really interested in", "I am really interested in"],
      "2-1",
      (v) => /\b(i'm|i am)\s+.*interested in/i.test(v)
    );

    // 2-2
    const a22 = document.querySelector('[name="2-2"]').value;
    textPart(
      "2-2",
      2,
      "2-2 ㉡ 완성",
      4,
      a22,
      ["I'm not good at playing games", "I am not good at playing games", "I'm not good at play games"],
      "2-2"
    );

    // 3
    const acc3 = {
      1: ["going"],
      2: ["Sounds", "sounds"],
      3: ["until"],
      4: ["If", "if"],
    };
    const lab3 = ["① going", "② Sounds", "③ until", "④ If"];
    for (let i = 1; i <= 4; i++) {
      blankPart(`3-${i}`, 3, `3번 ${lab3[i - 1]}`, 2, document.querySelector(`[name="3-${i}"]`).value, acc3[i], "3");
    }

    // 4-1
    blankPart("4-1-1", 4, "4-1 role", 2, document.querySelector('[name="4-1-1"]').value, ["role"], "4-1");
    blankPart("4-1-2", 4, "4-1 model", 2, document.querySelector('[name="4-1-2"]').value, ["model"], "4-1");

    // 4-2
    const a42 = document.querySelector('[name="4-2"]').value;
    textPart(
      "4-2",
      4,
      "4-2 Jessica & Jane",
      4,
      a42,
      [
        "They are interested in VR games and adventure games.",
        "They are interested in VR games and making adventure games.",
        "are interested in VR games and adventure games",
      ],
      "4-2",
      (v) => /interested in vr games and (making )?adventure games/i.test(v) || /interested in vr games and (making )?adventure games/i.test("They " + v)
    );

    // 5 practice
    const a51 = document.querySelector('[name="5-1"]').value;
    const a52 = document.querySelector('[name="5-2"]').value;
    const ok51 = S.hasReason(a51);
    const ok52 = S.hasReason(a52);
    addPart({
      id: "5-1",
      qNum: 5,
      label: "5-1 미래의 꿈 + Why",
      max: 5,
      earned: ok51 ? 5 : 0,
      ok: ok51,
      partial: false,
      student: a51.trim(),
      correct: EX["5-1"].correct,
      explain: EX["5-1"].explain,
      fb: "5-1",
      practice: true,
    });
    addPart({
      id: "5-2",
      qNum: 5,
      label: "5-2 친구가 슬플 때 + Why",
      max: 5,
      earned: ok52 ? 5 : 0,
      ok: ok52,
      partial: false,
      student: a52.trim(),
      correct: EX["5-2"].correct,
      explain: EX["5-2"].explain,
      fb: "5-2",
      practice: true,
    });

    // 6-1
    const acc61 = {
      1: ["smelled sweet", "smell sweet"],
      2: ["tasted delicious", "taste delicious"],
      3: ["looked blue and clean", "look blue and clean"],
      4: ["sounded beautiful", "sound beautiful"],
    };
    for (let i = 1; i <= 4; i++) {
      blankPart(
        `6-1-${i}`,
        6,
        `6-1 ①~④ 중 ${i}번`,
        2,
        document.querySelector(`[name="6-1-${i}"]`).value,
        acc61[i],
        "6-1"
      );
    }

    // 6-2
    const a62 = document.querySelector('[name="6-2"]').value;
    textPart(
      "6-2",
      6,
      "6-2 (1) 배열",
      4,
      a62,
      ["Walking in the park felt wonderful.", "I felt wonderful walking in the park.", "Walking in the park, I felt wonderful."],
      "6-2"
    );

    // 7
    blankPart("7-1-1", 7, "7-1 higher", 1, document.querySelector('[name="7-1-1"]').value, ["higher"], "7-1");
    blankPart("7-1-2", 7, "7-1 than", 1, document.querySelector('[name="7-1-2"]').value, ["than"], "7-1");
    blankPart("7-2-1", 7, "7-2 more", 1, document.querySelector('[name="7-2-1"]').value, ["more"], "7-2");
    blankPart("7-2-2", 7, "7-2 colorful", 1, document.querySelector('[name="7-2-2"]').value, ["colorful"], "7-2");
    blankPart("7-2-3", 7, "7-2 than", 1, document.querySelector('[name="7-2-3"]').value, ["than"], "7-2");

    // 8 rows
    const foundNums = new Set();
    for (let row = 1; row <= 3; row++) {
      const num = document.querySelector(`[name="8-num-${row}"]`).value;
      const rew = document.querySelector(`[name="8-rew-${row}"]`).value;
      const s = S.scoreQ8Row(num, rew);
      const n = parseInt(String(num).replace(/[^\d]/g, ""), 10);
      if ([2, 4, 5].includes(n) && s.ok) foundNums.add(n);
      let earned = 0;
      if (s.ok) earned = 3;
      else if (s.partial) earned = 1;
      const rowId = `8-row-${row}`;
      const { correct, explain } = meta({ id: rowId });
      addPart({
        id: rowId,
        qNum: 8,
        label: `8번 표 ${row}줄 (번호+고친 문장)`,
        max: 3,
        earned,
        ok: s.ok,
        partial: s.partial && !s.ok,
        student: `번호: ${num || "(없음)"} / 문장: ${rew || "(없음)"}`,
        correct,
        explain,
        fb: "8",
        practice: false,
      });
    }
    if (foundNums.size < 3) {
      addPart({
        id: "8-missing",
        qNum: 8,
        label: "8번 — 틀린 문장 ②·④·⑤ 모두 찾기",
        max: 0,
        earned: 0,
        ok: false,
        partial: false,
        student: `찾은 번호: ${foundNums.size ? [...foundNums].join(", ") : "없음"}`,
        correct: "②, ④, ⑤",
        explain: EX["8-missing"].explain,
        fb: "8",
        practice: false,
      });
    }

    // 9-1
    const acc91 = {
      1: ["Hearing the monster sound", "When I hear the monster sound", "I hear the monster sound"],
      2: ["Wearing the new life jacket", "When I wear the new life jacket", "I wear the new life jacket"],
      3: ["Seeing the giant tower", "When I see the giant tower", "I see the giant tower"],
      4: ["Meeting the monsters", "When I meet the monsters", "I meet the monsters"],
    };
    for (let i = 1; i <= 4; i++) {
      blankPart(`9-1-${i}`, 9, `9-1 빈칸 ${i}`, 2, document.querySelector(`[name="9-1-${i}"]`).value, acc91[i], "9-1");
    }

    // 9-2
    blankPart("9-2-1", 9, "9-2 ㉠", 1, document.querySelector('[name="9-2-1"]').value, ["better"], "9-2");
    blankPart("9-2-2", 9, "9-2 ㉡", 1, document.querySelector('[name="9-2-2"]').value, ["easier"], "9-2");

    // 10
    const q10labels = [
      "wood",
      "cutting",
      "game",
      "salmon",
      "sandwiches",
      "Giant",
      "Vegetables",
      "pumpkins",
      "Midnight",
      "Sun",
    ];
    const q10acc = [
      ["wood"],
      ["cutting"],
      ["game"],
      ["salmon"],
      ["sandwiches"],
      ["Giant", "giant"],
      ["Vegetables", "vegetables"],
      ["pumpkins"],
      ["Midnight", "midnight"],
      ["Sun", "sun"],
    ];
    for (let i = 0; i < 10; i++) {
      blankPart(`10-${i + 1}`, 10, `10번 빈칸 «${q10labels[i]}»`, 1, document.querySelector(`[name="10-${i}"]`).value, q10acc[i], "10");
    }

    // 11
    const a11q = document.querySelector('[name="11"]').value;
    textPart(
      "11",
      11,
      "11번 사진 찍은 시각",
      4,
      a11q,
      ["It was 9 p.m.", "It was 9 pm.", "It was 9 o'clock at night.", "It was 9:00 p.m.", "It was nine p.m."],
      "11"
    );

    // 12
    blankPart(
      "12-1",
      12,
      "12 ①",
      3,
      document.querySelector('[name="12-1"]').value,
      ["finished doing my homework", "finished my homework"],
      "12"
    );
    blankPart("12-2", 12, "12 ②", 3, document.querySelector('[name="12-2"]').value, ["enjoyed reading books"], "12");
    blankPart(
      "12-3",
      12,
      "12 ③",
      3,
      document.querySelector('[name="12-3"]').value,
      ["should not avoid answering", "shouldn't avoid answering"],
      "12"
    );

    flushFeedbackGroups();

    const objective = allParts.filter((p) => !p.practice && p.max > 0);
    const earnedObjective = objective.reduce((s, p) => s + p.earned, 0);
    const maxObjective = objective.reduce((s, p) => s + p.max, 0);
    const openParts = allParts.filter((p) => p.practice);
    const openEarned = openParts.reduce((s, p) => s + p.earned, 0);
    const openMax = openParts.reduce((s, p) => s + p.max, 0);

    renderSummary(earnedObjective, maxObjective, openEarned, openMax);
    renderBreakdown();
    renderMistakesList();

    resultsEl.classList.add("visible");
    resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    grade();
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    form.reset();
    resultsEl.classList.remove("visible");
    scoreBanner.innerHTML = "";
    breakdownEl.innerHTML = "";
    mistakesEl.innerHTML = "";
    document.querySelectorAll(".feedback").forEach((el) => {
      el.className = "feedback";
      el.innerHTML = "";
    });
  });
})();
