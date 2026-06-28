(() => {
  const MBTI_TYPES = [
    { code: "ISTJ", label: "責任感があり、きちんと進めたい人" },
    { code: "ISFJ", label: "人を支え、空気を整えたい人" },
    { code: "INFJ", label: "深く考え、本音を大事にしたい人" },
    { code: "INTJ", label: "先を読み、筋道で進めたい人" },
    { code: "ISTP", label: "干渉されず、自分の手で確かめたい人" },
    { code: "ISFP", label: "感性と自分のペースを守りたい人" },
    { code: "INFP", label: "理想や気持ちの深さを大事にする人" },
    { code: "INTP", label: "納得できるまで考えたい人" },
    { code: "ESTP", label: "動きながら場を切り開きたい人" },
    { code: "ESFP", label: "その場を明るく楽しませたい人" },
    { code: "ENFP", label: "自由に広がり、人と熱を分けたい人" },
    { code: "ENTP", label: "面白さと可能性で流れを変えたい人" },
    { code: "ESTJ", label: "現実を動かし、結果につなげたい人" },
    { code: "ESFJ", label: "人とのつながりと場の調和を守りたい人" },
    { code: "ENFJ", label: "人を支え、前に進ませたい人" },
    { code: "ENTJ", label: "成果に向けて主導権を握りたい人" }
  ];

  const SCALE = [
    { value: 1, label: "まったく当てはまらない" },
    { value: 2, label: "ほとんど当てはまらない" },
    { value: 3, label: "あまり当てはまらない" },
    { value: 4, label: "どちらともいえない" },
    { value: 5, label: "少し当てはまる" },
    { value: 6, label: "かなり当てはまる" },
    { value: 7, label: "とても当てはまる" }
  ];

  const QUESTIONS = [
    {
      id: "Q01",
      number: 1,
      phase: "表の自己像",
      factor: "長所だけ拾う",
      text: "MBTIの説明を見ると、弱点よりも「自分の良さ」に見える部分を先に受け取りたくなる。",
      weights: { good_face: 3, clean_claim: 2, self_deception: 1 }
    },
    {
      id: "Q02",
      number: 2,
      phase: "表の自己像",
      factor: "印象の調整",
      text: "人に自分のMBTIを話す時、少しでも印象が良くなる言い方を選んでいる。",
      weights: { impression_management: 3, good_face: 2, approval_hunger: 1 }
    },
    {
      id: "Q03",
      number: 3,
      phase: "表の自己像",
      factor: "当てはまらなさの許容",
      text: "MBTIに当てはまらない自分も、無理に説明をつけずに認められる。",
      reverse: true,
      weights: { self_deception: 2, clean_claim: 2, hidden_truth: 1 },
      protectiveWeights: { self_awareness: 2 }
    },
    {
      id: "Q04",
      number: 4,
      phase: "表の自己像",
      factor: "タイプを言い訳にする",
      text: "「そういうタイプだから」と言うと、自分の面倒な部分まで許された気がする。",
      weights: { self_deception: 3, hidden_truth: 1, responsibility_escape: 1 }
    },
    {
      id: "Q05",
      number: 5,
      phase: "表の自己像",
      factor: "感情の隠し方",
      text: "本当は気にしているのに、気にしていない顔で済ませることが多い。",
      weights: { clean_claim: 2, emotional_suppression: 2, hidden_truth: 2 }
    },
    {
      id: "Q06",
      number: 6,
      phase: "闇スイッチ",
      factor: "比較",
      darkSwitchTag: "comparison",
      text: "誰かが自分以外を褒められていると、平気な顔をしながら少し比べてしまう。",
      weights: { jealousy: 3, reaction_sensitivity: 1, hidden_truth: 2, trigger_comparison: 1 }
    },
    {
      id: "Q07",
      number: 7,
      phase: "闇スイッチ",
      factor: "後回し",
      darkSwitchTag: "rejection",
      text: "返信が遅いだけでも、理由を探したり過去のやり取りを見返したりする。",
      weights: { abandonment_fear: 3, reaction_sensitivity: 3, trigger_rejection: 1 }
    },
    {
      id: "Q08",
      number: 8,
      phase: "闇スイッチ",
      factor: "努力の当然扱い",
      darkSwitchTag: "ignored_effort",
      text: "頑張ったことに気づかれないと、「別にいい」と思いながら少し冷める。",
      weights: { approval_hunger: 3, anger_stack: 1, hidden_truth: 2, validation_need: 1 }
    },
    {
      id: "Q09",
      number: 9,
      phase: "闇スイッチ",
      factor: "雑扱い",
      darkSwitchTag: "disrespect",
      text: "雑に扱われてもその場では笑って流し、あとで相手への見方だけ変える。",
      weights: { anger_stack: 3, emotional_suppression: 2, hidden_truth: 1, trigger_disrespect: 1 }
    },
    {
      id: "Q10",
      number: 10,
      phase: "闇スイッチ",
      factor: "主導権喪失",
      darkSwitchTag: "control_loss",
      text: "予定や役割を急に変えられると、表では合わせても内側では主導権を取り戻したくなる。",
      weights: { control_need: 3, rigidity: 1, anger_stack: 1, trigger_control_loss: 1 }
    },
    {
      id: "Q11",
      number: 11,
      phase: "闇スイッチ",
      factor: "踏み込み",
      darkSwitchTag: "intimacy",
      text: "本音を聞かれると、答える前に相手の反応を予測してしまう。",
      weights: { fear_of_intimacy: 2, control_need: 1, emotional_suppression: 1, trigger_intimacy: 1 }
    },
    {
      id: "Q12",
      number: 12,
      phase: "闇スイッチ",
      factor: "沈黙",
      darkSwitchTag: "silence",
      text: "会話が途切れると、自分が退屈だと思われていないか少し気になる。",
      weights: { reaction_sensitivity: 2, approval_hunger: 2, loneliness_avoidance: 1 }
    },
    {
      id: "Q13",
      number: 13,
      phase: "裏の反応",
      factor: "劣等感の処理",
      darkSwitchTag: "comparison",
      text: "比べられて下に見られたと感じると、相手の欠点も見つけたくなる。",
      weights: { superiority_defense: 3, jealousy: 1, anger_stack: 1, trigger_comparison: 1 }
    },
    {
      id: "Q14",
      number: 14,
      phase: "裏の反応",
      factor: "言い訳",
      text: "失敗した時、謝るより先に「でも事情があった」と説明したくなる。",
      weights: { self_deception: 2, impression_management: 2, responsibility_escape: 1 }
    },
    {
      id: "Q15",
      number: 15,
      phase: "裏の反応",
      factor: "曖昧さへの弱さ",
      darkSwitchTag: "ambiguity",
      text: "相手の態度が曖昧だと、はっきり聞くより先に行動を観察してしまう。",
      weights: { confirmation_need: 2, control_need: 1, reaction_sensitivity: 2 }
    },
    {
      id: "Q16",
      number: 16,
      phase: "裏の反応",
      factor: "必要とされたい気持ち",
      text: "自分がいなくても場が回っていると分かると、安心より先に少し寂しさが出る。",
      weights: { approval_hunger: 2, loneliness_avoidance: 2, abandonment_fear: 1 }
    },
    {
      id: "Q17",
      number: 17,
      phase: "矛盾チェック",
      factor: "見返りの否認",
      darkSwitchTag: "ignored_effort",
      text: "優しくしたことに見返りを求めていないつもりでも、感謝がないと引っかかる。",
      weights: { claim_no_reward: 2, approval_hunger: 3, people_pleasing: 1, validation_need: 1 }
    },
    {
      id: "Q18",
      number: 18,
      phase: "矛盾チェック",
      factor: "冷静さの演出",
      text: "感情的になるくらいなら、冷静な言い方に直してから出したい。",
      weights: { emotional_suppression: 3, claim_rational: 2, impression_management: 1 }
    },
    {
      id: "Q19",
      number: 19,
      phase: "矛盾チェック",
      factor: "自由と逃げ道",
      darkSwitchTag: "control_loss",
      text: "自由でいたいと言いながら、責任が重くなる前に逃げ道を残している。",
      weights: { claim_independent: 2, responsibility_escape: 3, avoidance: 1 }
    },
    {
      id: "Q20",
      number: 20,
      phase: "裏の反応",
      factor: "価値の揺れ",
      darkSwitchTag: "rejection",
      text: "相手に必要とされている実感がないと、自分の価値まで少し揺れる。",
      weights: { approval_hunger: 2, abandonment_fear: 2, hidden_truth: 1, trigger_rejection: 1 }
    },
    {
      id: "Q21",
      number: 21,
      phase: "裏の反応",
      factor: "寂しさの隠し方",
      darkSwitchTag: "silence",
      text: "寂しい時ほど、寂しいと言わずに反応が返ってくる場所を開く。",
      weights: { loneliness_avoidance: 3, reaction_sensitivity: 1, hidden_truth: 1 }
    },
    {
      id: "Q22",
      number: 22,
      phase: "矛盾チェック",
      factor: "怒りの保存",
      darkSwitchTag: "disrespect",
      text: "怒っていないふりをしていても、嫌だったことはかなり正確に覚えている。",
      weights: { claim_no_anger: 2, anger_stack: 3, hidden_truth: 1, trigger_disrespect: 1 }
    },
    {
      id: "Q23",
      number: 23,
      phase: "裏の反応",
      factor: "やさしさと支配",
      darkSwitchTag: "control_loss",
      text: "相手のためと言いながら、自分の思う形に動いてほしい気持ちが混ざる。",
      weights: { control_need: 3, people_pleasing: 1, hidden_truth: 2, trigger_control_loss: 1 }
    },
    {
      id: "Q24",
      number: 24,
      phase: "裏の反応",
      factor: "距離の取り方",
      darkSwitchTag: "intimacy",
      text: "深い関係になりそうな時ほど、少し距離を取りたくなる。",
      weights: { fear_of_intimacy: 3, avoidance: 2, abandonment_fear: 1, trigger_intimacy: 1 }
    },
    {
      id: "Q25",
      number: 25,
      phase: "表の自己像",
      factor: "弱さの見せ方",
      text: "自分の弱さを見せるより、できる人・大丈夫な人に見られる方が楽だ。",
      weights: { good_face: 2, impression_management: 2, emotional_suppression: 2 }
    },
    {
      id: "Q26",
      number: 26,
      phase: "裏の反応",
      factor: "試し行動",
      darkSwitchTag: "intimacy",
      text: "相手の本気度を確かめるために、少し引いたり反応を見たりすることがある。",
      weights: { testing_behavior: 3, control_need: 1, abandonment_fear: 1 }
    },
    {
      id: "Q27",
      number: 27,
      phase: "回復チェック",
      factor: "短く伝える力",
      text: "本当は嫌だったことを、その場で短く言葉にできる。",
      reverse: true,
      weights: { anger_stack: 2, emotional_suppression: 2, avoidance: 1 },
      protectiveWeights: { directness: 2, self_awareness: 1 }
    },
    {
      id: "Q28",
      number: 28,
      phase: "回復チェック",
      factor: "見直す力",
      text: "痛いところを突かれても、自分の反応をあとから見直せる。",
      reverse: true,
      weights: { self_deception: 2, hidden_truth: 1, superiority_defense: 1 },
      protectiveWeights: { self_awareness: 2, stability: 1 }
    }
  ];

  window.MOBBY_MBTI_TYPES = MBTI_TYPES;
  window.MOBBY_MBTI_LIKERT_SCALE = SCALE;
  window.MOBBY_QUESTIONS = QUESTIONS;
  window.MOBBY_QUESTIONS_BY_MBTI = Object.fromEntries(MBTI_TYPES.map((type) => [type.code, QUESTIONS]));
})();
