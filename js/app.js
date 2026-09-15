(function () {
  const S = window.QuizScoring;
  const form = document.getElementById("quiz-form");
  const resultsEl = document.getElementById("results");
  const scoreBanner = document.getElementById("score-banner");

  const TOTAL_OBJECTIVE = 100; // per exam: 7+8+8+8+10+12+5+9+10+10+4+9 = 100? Let's calculate
  // 1:7, 2:8, 3:8, 4:8, 5:10 (open), 6:12, 7:5, 8:9, 9:10, 10:10, 11:4, 12:9 = 100

  function setFeedback(id, html, kind) {
    const el = document.getElementById("fb-" + id);
    if (!el) return;
    el.innerHTML = html;
    el.className = "feedback show " + kind;
  }

  function grade() {
    let earned = 0;
    let maxObjective = 90; // excluding Q5 open 10 pts — practice scored separately
    let openPractice = 0;
    let openMax = 10;

    // 1-1
    const a11 = document.querySelector('[name="1-1"]').value;
    const ok11 = S.matchesAny(a11, ["2", "②", "2번"]);
    if (ok11) earned += 2;
    setFeedback(
      "1-1",
      ok11
        ? "정답입니다."
        : '<span class="answer-key">정답: ② (Hospital 옆 건물)</span><br>우체국은 병원(Hospital) 옆에 있습니다.',
      ok11 ? "correct" : "incorrect"
    );

    // 1-2
    const b12 = {};
    for (let i = 1; i <= 5; i++) b12[String(i)] = document.querySelector(`[name="1-2-${i}"]`).value;
    const acc12 = { 1: ["Go"], 2: ["straight"], 3: ["turn"], 4: ["on"], 5: ["left"] };
    const r12 = S.scoreMultiBlank(b12, acc12, 1);
    earned += r12.earned;
    setFeedback(
      "1-2",
      r12.earned === 5
        ? "정답입니다."
        : `<span class="answer-key">정답: Go / straight / turn / on / left</span><br>START에서 직진 두 블록 후 우회전하면 Hospital이 왼쪽에 있습니다.`,
      r12.earned === 5 ? "correct" : "incorrect"
    );

    // 2-1
    const a21 = document.querySelector('[name="2-1"]').value;
    const ok21 =
      S.matchesAny(a21, [
        "I'm interested in",
        "I am interested in",
        "I'm really interested in",
        "I am really interested in",
        "I'm interested in cooking these days.",
        "I am interested in cooking these days.",
      ]) || /\b(i'm|i am)\s+.*interested in/i.test(a21);
    if (ok21) earned += 4;
    setFeedback(
      "2-1",
      ok21
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: I'm interested in</span><br>대화2의 interested를 활용합니다.",
      ok21 ? "correct" : "incorrect"
    );

    // 2-2
    const a22 = document.querySelector('[name="2-2"]').value;
    const ok22 = S.matchesAny(a22, [
      "I'm not good at playing games",
      "I am not good at playing games",
      "I'm not good at play games",
    ]);
    if (ok22) earned += 4;
    setFeedback(
      "2-2",
      ok22
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: I'm not good at playing games</span>",
      ok22 ? "correct" : "incorrect"
    );

    // 3
    const b3 = {};
    for (let i = 1; i <= 4; i++) b3[String(i)] = document.querySelector(`[name="3-${i}"]`).value;
    const acc3 = { 1: ["going"], 2: ["Sounds", "sounds"], 3: ["until"], 4: ["If", "if"] };
    const r3 = S.scoreMultiBlank(b3, acc3, 2);
    earned += r3.earned;
    setFeedback(
      "3",
      r3.earned === 8
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: going / Sounds / until / If</span><br>① going to, ② Sounds fun, ③ until the 23rd, ④ If I have time…",
      r3.earned === 8 ? "correct" : "incorrect"
    );

    // 4-1
    const b41 = { 1: document.querySelector('[name="4-1-1"]').value, 2: document.querySelector('[name="4-1-2"]').value };
    const r41 = S.scoreMultiBlank(b41, { 1: ["role"], 2: ["model"] }, 2);
    earned += r41.earned;
    setFeedback(
      "4-1",
      r41.earned === 4
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: role / model (role model)</span>",
      r41.earned === 4 ? "correct" : "incorrect"
    );

    // 4-2
    const a42 = document.querySelector('[name="4-2"]').value;
    const full42 = ("They " + a42).trim();
    const ok42 =
      S.matchesAny(a42, [
        "They are interested in VR games and adventure games.",
        "They are interested in VR games and making adventure games.",
        "are interested in VR games and adventure games",
        "are interested in VR games and making adventure games",
      ]) ||
      S.matchesAny(full42, [
        "They are interested in VR games and adventure games.",
        "They are interested in VR games and making adventure games.",
      ]) ||
      /interested in vr games and (making )?adventure games/i.test(a42);
    if (ok42) earned += 4;
    setFeedback(
      "4-2",
      ok42
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: They are interested in VR games and adventure games.</span>",
      ok42 ? "correct" : "incorrect"
    );

    // 5 open
    const a51 = document.querySelector('[name="5-1"]').value;
    const a52 = document.querySelector('[name="5-2"]').value;
    const ok51 = S.hasReason(a51);
    const ok52 = S.hasReason(a52);
    if (ok51) openPractice += 5;
    if (ok52) openPractice += 5;
    setFeedback(
      "5-1",
      ok51
        ? "연습 답안으로 인정됩니다. (이유 포함)<br><span class=\"answer-key\">예시: I want to be a doctor because I want to help sick people.</span>"
        : "이유(because 등)를 포함한 영어 문장을 써 보세요. (채점 감점 항목)",
      ok51 ? "practice" : "practice"
    );
    setFeedback(
      "5-2",
      ok52
        ? "연습 답안으로 인정됩니다. (이유 포함)<br><span class=\"answer-key\">예시: I am going to call my friend and cheer him up because I care about him.</span>"
        : "이유(because 등)를 포함한 영어 문장을 써 보세요.",
      ok52 ? "practice" : "practice"
    );

    // 6-1
    const b61 = {};
    for (let i = 1; i <= 4; i++) b61[String(i)] = document.querySelector(`[name="6-1-${i}"]`).value;
    const acc61 = {
      1: ["smelled sweet", "smell sweet"],
      2: ["tasted delicious", "taste delicious"],
      3: ["looked blue and clean", "look blue and clean"],
      4: ["sounded beautiful", "sound beautiful"],
    };
    const r61 = S.scoreMultiBlank(b61, acc61, 2);
    earned += r61.earned;
    setFeedback(
      "6-1",
      r61.earned === 8
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: smelled sweet / tasted delicious / looked blue and clean / sounded beautiful</span>",
      r61.earned === 8 ? "correct" : "incorrect"
    );

    // 6-2
    const a62 = document.querySelector('[name="6-2"]').value;
    const ok62 = S.matchesAny(a62, [
      "Walking in the park felt wonderful.",
      "I felt wonderful walking in the park.",
      "Walking in the park, I felt wonderful.",
    ]);
    if (ok62) earned += 4;
    setFeedback(
      "6-2",
      ok62
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: Walking in the park felt wonderful.</span>",
      ok62 ? "correct" : "incorrect"
    );

    // 7-1
    const b71 = { 1: document.querySelector('[name="7-1-1"]').value, 2: document.querySelector('[name="7-1-2"]').value };
    const r71 = S.scoreMultiBlank(b71, { 1: ["higher"], 2: ["than"] }, 1);
    earned += r71.earned;
    setFeedback(
      "7-1",
      r71.earned === 2
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: higher / than</span>",
      r71.earned === 2 ? "correct" : "incorrect"
    );

    // 7-2
    const b72 = {
      1: document.querySelector('[name="7-2-1"]').value,
      2: document.querySelector('[name="7-2-2"]').value,
      3: document.querySelector('[name="7-2-3"]').value,
    };
    const r72 = S.scoreMultiBlank(b72, { 1: ["more"], 2: ["colorful"], 3: ["than"] }, 1);
    earned += r72.earned;
    setFeedback(
      "7-2",
      r72.earned === 3
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: more / colorful / than</span>",
      r72.earned === 3 ? "correct" : "incorrect"
    );

    // 8 — up to 3 rows, 3 pts each if number+rewrite ok
    let e8 = 0;
    const q8msgs = [];
    for (let row = 1; row <= 3; row++) {
      const num = document.querySelector(`[name="8-num-${row}"]`).value;
      const rew = document.querySelector(`[name="8-rew-${row}"]`).value;
      const s = S.scoreQ8Row(num, rew);
      if (s.ok) e8 += 3;
      else if (s.partial) e8 += 1;
    }
    earned += e8;
    setFeedback(
      "8",
      `받은 점수: ${e8}/9점<br><span class="answer-key">틀린 문장: ②, ④, ⑤<br>② Sumin enjoyed the game, but it ends too soon.<br>④ The team added the ice lake stage after Sumin played the game.<br>⑤ Jean drew the main character and NPCs. (Sujin made the music/sounds)</span>`,
      e8 >= 6 ? "correct" : e8 > 0 ? "practice" : "incorrect"
    );

    // 9-1
    const b91 = {};
    for (let i = 1; i <= 4; i++) b91[String(i)] = document.querySelector(`[name="9-1-${i}"]`).value;
    const acc91 = {
      1: ["Hearing the monster sound", "When I hear the monster sound", "I hear the monster sound"],
      2: ["Wearing the new life jacket", "When I wear the new life jacket", "I wear the new life jacket"],
      3: ["Seeing the giant tower", "When I see the giant tower", "I see the giant tower"],
      4: ["Meeting the monsters", "When I meet the monsters", "I meet the monsters"],
    };
    const r91 = S.scoreMultiBlank(b91, acc91, 2);
    earned += r91.earned;
    setFeedback(
      "9-1",
      r91.earned === 8
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: Hearing the monster sound / Wearing the new life jacket / Seeing the giant tower / Meeting the monsters</span>",
      r91.earned === 8 ? "correct" : "incorrect"
    );

    // 9-2
    const b92 = { 1: document.querySelector('[name="9-2-1"]').value, 2: document.querySelector('[name="9-2-2"]').value };
    const r92 = S.scoreMultiBlank(b92, { 1: ["better"], 2: ["easier"] }, 1);
    earned += r92.earned;
    setFeedback(
      "9-2",
      r92.earned === 2
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: better / easier</span>",
      r92.earned === 2 ? "correct" : "incorrect"
    );

    // 10
    const q10vals = [];
    for (let i = 0; i < 10; i++) q10vals.push(document.querySelector(`[name="10-${i}"]`).value);
    const q10sections = [
      { blanks: 3, accepted: [["wood"], ["cutting"], ["game"]] },
      { blanks: 2, accepted: [["salmon"], ["sandwiches"]] },
      {
        blanks: 3,
        accepted: [["Giant"], ["Vegetables"], ["pumpkins"]],
        alt: [["giant"], ["vegetables"], ["pumpkins"]],
      },
      {
        blanks: 2,
        accepted: [["Midnight"], ["Sun"]],
        alt: [["midnight"], ["sun"]],
      },
    ];
    const r10 = S.scoreQ10Sections(q10sections, q10vals);
    earned += r10.earned;
    setFeedback(
      "10",
      r10.earned === 10
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: wood cutting game / salmon sandwiches / Giant Vegetables + pumpkins / Midnight Sun</span>",
      r10.earned === 10 ? "correct" : "incorrect"
    );

    // 11
    const a11q = document.querySelector('[name="11"]').value;
    const ok11q = S.matchesAny(a11q, [
      "It was 9 p.m.",
      "It was 9 pm.",
      "It was 9 o'clock at night.",
      "It was 9:00 p.m.",
      "It was nine p.m.",
    ]);
    if (ok11q) earned += 4;
    setFeedback(
      "11",
      ok11q
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: It was 9 p.m.</span><br>밤 9시에도 해가 떠 있었습니다.",
      ok11q ? "correct" : "incorrect"
    );

    // 12
    const b12q = {
      1: document.querySelector('[name="12-1"]').value,
      2: document.querySelector('[name="12-2"]').value,
      3: document.querySelector('[name="12-3"]').value,
    };
    const acc12q = {
      1: ["finished doing my homework", "finished my homework"],
      2: ["enjoyed reading books"],
      3: ["should not avoid answering", "shouldn't avoid answering"],
    };
    const r12q = S.scoreMultiBlank(b12q, acc12q, 3);
    earned += r12q.earned;
    setFeedback(
      "12",
      r12q.earned === 9
        ? "정답입니다."
        : "<span class=\"answer-key\">정답: finished doing my homework / enjoyed reading books / should not avoid answering</span>",
      r12q.earned === 9 ? "correct" : "incorrect"
    );

    const totalDisplay = earned + openPractice;
    scoreBanner.textContent = `점수: ${totalDisplay} / 100 (객관식·빈칸 ${earned}/90, 서술형 연습 ${openPractice}/${openMax})`;
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
    document.querySelectorAll(".feedback").forEach((el) => {
      el.className = "feedback";
      el.innerHTML = "";
    });
  });
})();
