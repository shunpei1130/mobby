export const DIAGNOSIS_KNOWLEDGE = {
  "mobby_mbti_shadow": {
    label: "モビー診断",
    pagePath: "/mobby/",
    description: "ユーザーが選んだMBTIを表の自己像として受け取り、40問のシナリオ設問でよく見せメーター、不都合隠しメーター、闇スイッチを出す診断です。",
    questionCount: 40,
    answerScale: "5択",
    axes: [
      "よく見せメーター: MBTIで自分をどれだけ都合よく説明しているか",
      "不都合隠しメーター: 人に見せたくない本音や反応をどれだけ隠しているか",
      "闇スイッチ: 隠していた反応が出やすい場面"
    ],
    types: [
      { code: "ISTJ", name: "ISTJの皮をかぶったモビー", summary: "不安を予定・ルール・正しさで押さえ込みやすいタイプ。" },
      { code: "ISFJ", name: "ISFJの皮をかぶったモビー", summary: "嫌われ不安と承認欲求を献身で隠しやすいタイプ。" },
      { code: "INFJ", name: "INFJの皮をかぶったモビー", summary: "理解されたいのに見抜かれるのは怖いタイプ。" },
      { code: "INTJ", name: "INTJの皮をかぶったモビー", summary: "弱さを見せたくなさを合理性で守りやすいタイプ。" },
      { code: "ISTP", name: "ISTPの皮をかぶったモビー", summary: "責任や感情処理が深くなる前に距離を取りやすいタイプ。" },
      { code: "ISFP", name: "ISFPの皮をかぶったモビー", summary: "衝突を飲み込み、限界で静かにシャッターを下ろしやすいタイプ。" },
      { code: "INFP", name: "INFPの皮をかぶったモビー", summary: "理解されたい飢えと傷つきやすさを理想で守りやすいタイプ。" },
      { code: "INTP", name: "INTPの皮をかぶったモビー", summary: "感情で負けないように分析で距離を取りやすいタイプ。" },
      { code: "ESTP", name: "ESTPの皮をかぶったモビー", summary: "止まると不安が来るので、刺激やノリで上書きしやすいタイプ。" },
      { code: "ESFP", name: "ESFPの皮をかぶったモビー", summary: "盛り上げている間だけ寂しさを見なくて済むタイプ。" },
      { code: "ENFP", name: "ENFPの皮をかぶったモビー", summary: "自由さの裏で、選ばれたい欲と反応への敏感さが出やすいタイプ。" },
      { code: "ENTP", name: "ENTPの皮をかぶったモビー", summary: "重くなる前に冗談や論破で逃げ道を作りやすいタイプ。" },
      { code: "ESTJ", name: "ESTJの皮をかぶったモビー", summary: "正しさで押すことで、不安や弱さを見せないようにしやすいタイプ。" },
      { code: "ESFJ", name: "ESFJの皮をかぶったモビー", summary: "空気を読んでいるようで、空気に支配されやすいタイプ。" },
      { code: "ENFJ", name: "ENFJの皮をかぶったモビー", summary: "必要とされることで自分の価値を確認しやすいタイプ。" },
      { code: "ENTJ", name: "ENTJの皮をかぶったモビー", summary: "主導権を失うことへの不安を強さで隠しやすいタイプ。" }
    ]
  },
  "16school": {
    label: "学校モビー診断",
    pagePath: "/16school/",
    description: "学校での立ち位置、友だちとの距離感、クラスでの動き方を見る診断です。40問の7段階回答で、男子版・女子版それぞれ16タイプに分かれます。",
    questionCount: 40,
    answerScale: "7段階",
    axes: [
      "男子A: キャラタイプ（陽キャラ / 陰キャラ）",
      "男子B: 雰囲気（やんちゃ / 真面目）",
      "男子C: 行動スタイル（仲間重視 / 個人行動重視）",
      "男子D: 評価基準（他者評価 / 自己基準）",
      "女子A: キャラタイプ（陽キャラ / 陰キャラ）",
      "女子B: 雰囲気（清楚 / ギャル）",
      "女子C: 関係性（友達優先 / 恋愛優先）",
      "女子D: 評価基準（評価重視 / 自分基準）"
    ],
    maleTypes: [
      { code: "がやみそ", name: "文化祭センターステージモビー", summary: "場の空気を読み、自分から動いて盛り上げるタイプ。" },
      { code: "がやみう", name: "体育祭モビー", summary: "勝ち負け以上に、本気で燃え切ることを大事にするタイプ。" },
      { code: "がやこそ", name: "廊下ランウェイモビー", summary: "見られるほど調子が出る、自己プロデュース型。" },
      { code: "がやこう", name: "屋上自由時間モビー", summary: "明るさとマイペースさを両方持つ、自分基準タイプ。" },
      { code: "がおみそ", name: "応援団長モビー", summary: "責任を背負い、周りをまとめる信頼型リーダー。" },
      { code: "がおみう", name: "学級委員モビー", summary: "派手さより全体がうまく回ることに満足する調整役。" },
      { code: "がおこそ", name: "成績掲示板モビー", summary: "順位や点数など、目に見える成果で証明したいタイプ。" },
      { code: "がおこう", name: "理科室研究モビー", summary: "好きなことを納得いくまで掘る探究者タイプ。" },
      { code: "なやみそ", name: "裏アカ拡散モビー", summary: "前に出ず、情報と空気で場を動かすタイプ。" },
      { code: "なやみう", name: "部室たまり場モビー", summary: "信頼できる少人数との安心感を大事にするタイプ。" },
      { code: "なやこそ", name: "制服アレンジモビー", summary: "直接アピールは控えめでも、わかる人には評価されたいタイプ。" },
      { code: "なやこう", name: "教科書裏落書きモビー", summary: "外に出さない内側の世界観と熱量が強いタイプ。" },
      { code: "なおみそ", name: "舞台袖実行委員モビー", summary: "目立たなくても、成功の裏側を支える縁の下タイプ。" },
      { code: "なおみう", name: "図書委員モビー", summary: "派手さより、安定した日常と自分のペースを好むタイプ。" },
      { code: "なおこそ", name: "模試ランキングモビー", summary: "表では淡々、内側では勝ち筋を計算する努力型。" },
      { code: "なおこう", name: "自習室モビー", summary: "評価より自分が納得できるまで積み上げるタイプ。" }
    ],
    femaleTypes: [
      { code: "がおみそ", name: "文化祭広報モビー", summary: "全体の見せ方を考えながら、場を回して盛り上げるタイプ。" },
      { code: "がおみう", name: "昼休みお弁当会モビー", summary: "落ち着く仲間との日常時間を大事にするタイプ。" },
      { code: "がおこそ", name: "帰り道デートモビー", summary: "恋も友達も大事にしつつ、毎日をきらめかせたいタイプ。" },
      { code: "がおこう", name: "屋上ひみつ恋モビー", summary: "二人だけの秘密を静かに育てたい慎重派。" },
      { code: "がやみそ", name: "プリクラ拡散モビー", summary: "友達と今この瞬間を全力で楽しみ、盛れた反応も楽しむタイプ。" },
      { code: "がやみう", name: "購買前たまり場モビー", summary: "見せびらかすより、気分よく自分のノリで過ごしたいタイプ。" },
      { code: "がやこそ", name: "カップル自撮りモビー", summary: "恋愛も見せ方もこだわりたい、発信力のあるタイプ。" },
      { code: "がやこう", name: "放課後即レスモビー", summary: "好きなら即行動。自分の気持ちでまっすぐ動くタイプ。" },
      { code: "なおみそ", name: "クラスアルバム映えモビー", summary: "控えめでも、ここぞという場面ではきちんと整えるタイプ。" },
      { code: "なおみう", name: "図書室まったりモビー", summary: "派手さより安心できる空間と無理しない関係を好むタイプ。" },
      { code: "なおこそ", name: "ストーリー匂わせモビー", summary: "直接は言えないけど、恋の空気には気づいてほしいタイプ。" },
      { code: "なおこう", name: "ロッカー手紙モビー", summary: "大事な気持ちを静かに育て、誠実さで距離を詰めるタイプ。" },
      { code: "なやみそ", name: "ストーリー撮影班モビー", summary: "裏方でも、いい絵を作るセンスに自信があるタイプ。" },
      { code: "なやみう", name: "ネイルこだわりモビー", summary: "人に見せるより、自分の機嫌を上げるこだわりを持つタイプ。" },
      { code: "なやこそ", name: "匂わせプリクラモビー", summary: "控えめに見えて、反応を見ながら勝ち筋を作るタイプ。" },
      { code: "なやこう", name: "放課後こっそり通話モビー", summary: "周りには見せず、二人だけの時間を本気で大事にするタイプ。" }
    ]
  },
  "16stan": {
    label: "推し活モビー診断",
    pagePath: "/16stan/",
    description: "推し活の追い方、現場/在宅、発信/静観、単体/周辺への関心を見る診断です。40問の7段階回答で16タイプに分かれます。",
    questionCount: 40,
    answerScale: "7段階",
    axes: [
      "A: 追い方（日常派 / まとめ派）",
      "B: 接点（現場派 / 在宅派）",
      "C: 関わり方（発信派 / 静観派）",
      "D: 焦点（単体派 / 周辺派）"
    ],
    types: [
      { code: "こうしひ", name: "やさしい見守り推しモビー", displayName: "優しい見守りモビー", summary: "距離感を守り、推しにも自分にもやさしく長く応援するタイプ。" },
      { code: "こうしみ", name: "尊い記録係推しモビー", displayName: "記録係モビー", summary: "スクショやメモで尊い瞬間を残し、推しを資産化するタイプ。" },
      { code: "こうはひ", name: "リアクション職人推しモビー", displayName: "即レスサポーターモビー", summary: "供給を拾い、小さな反応の積み上げで推しを支えるタイプ。" },
      { code: "こうはみ", name: "布教うまい推しモビー", displayName: "沼案内人モビー", summary: "相手に合わせて刺さる入口を作り、推しの世界を広げるタイプ。" },
      { code: "こなしひ", name: "ソロ神聖視推しモビー", displayName: "ソロ神聖視モビー", summary: "騒がず比較せず、自分の中で推しの尊さを守るタイプ。" },
      { code: "こなしみ", name: "作品反復推しモビー", displayName: "作品反復推しモビー", summary: "体験を何度も味わい直し、推しの世界観を深めるタイプ。" },
      { code: "こなはひ", name: "現場至上主義推しモビー", displayName: "現場至上主義モビー", summary: "現場の熱を取りに行き、その瞬間の体験で愛を証明するタイプ。" },
      { code: "こなはみ", name: "箱推し熱心モビー", displayName: "箱推し熱心モビー", summary: "推し単体だけでなく、箱や作品ごと好きの熱を循環させるタイプ。" },
      { code: "まうしひ", name: "ガチ分析推しモビー", displayName: "ガチ分析モビー", summary: "推しの凄さを構造で捉えて言語化し、価値を守るタイプ。" },
      { code: "まうしみ", name: "箱ごと見守り推しモビー", displayName: "箱ごと見守りモビー", summary: "推しも作品もチームも、長い物語として抱きしめるタイプ。" },
      { code: "まうはひ", name: "一気見感想投下推しモビー", displayName: "感情投下モビー", summary: "まとめ視聴で刺さった熱を、言葉にして一気に返すタイプ。" },
      { code: "まうはみ", name: "情報収集ガチ推しモビー", displayName: "情報収集ガチモビー", summary: "出演や記事、背景まで拾い、正確な情報で安心を作るタイプ。" },
      { code: "まなしひ", name: "1コンテンツ一点突破推しモビー", displayName: "最重要一転突破モビー", summary: "本当に大事な一点を選び、濃い満足を取りに行くタイプ。" },
      { code: "まなしみ", name: "成長見守り推しモビー", displayName: "成長見守りモビー", summary: "推しの変化と成長を長期で見届け、物語として愛するタイプ。" },
      { code: "まなはひ", name: "ご褒美課金推しモビー", displayName: "勝負所全力投下モビー", summary: "普段は抑え、節目で一気に熱や課金を集中投下するタイプ。" },
      { code: "まなはみ", name: "まとめ読み推しモビー", displayName: "情報整理モビー", summary: "情報に溺れず、追える形に整えて推し活を続けるタイプ。" }
    ]
  },
  "16love": {
    label: "メンヘラモビー診断",
    pagePath: "/16love/",
    description: "好きな人への不安、返信待ち、匂わせ、失恋後の引きずり方などを見る恋愛メンヘラタイプ診断です。40問の7段階回答で16タイプに分かれます。",
    questionCount: 40,
    answerScale: "7段階",
    axes: [
      "A: 恋愛メンヘラ度（余裕女子 / 一途暴走）",
      "B: 恋の依存度（マイペース / 彼氏ガチ勢）",
      "C: 恋のアピール度（隠す派 / 匂わせ全開）",
      "D: 失恋回復力（即切り替え / 元カレ沼）"
    ],
    types: [
      { code: "あじすふ", name: "余裕ぶっこきモビー", summary: "好きでも自分のペースを崩さず、追いすぎない恋愛強者タイプ。" },
      { code: "あじすひ", name: "メンタル紙モビー", summary: "表では落ち着いて見えるけど、内側では返信ひとつで揺れやすいタイプ。" },
      { code: "あじもふ", name: "病みスト即消しモビー", summary: "落ち込むと病みストを上げたくなるけど、切り替えも早いタイプ。" },
      { code: "あじもひ", name: "黒背景ポエムモビー", summary: "恋の痛みを深夜テンションで言語化しやすい、退廃系詩人タイプ。" },
      { code: "あつすふ", name: "即レス命モビー", summary: "返信速度で安心を作るけど、立て直しもできるバランス型。" },
      { code: "あつすひ", name: "返信こないと死モビー", summary: "好きな人の返信が命綱のように感じやすく、不安を外に出さず耐えがちなタイプ。" },
      { code: "あつもふ", name: "量産型メンヘラモビー", summary: "恋愛の喜怒哀楽を出しやすく、共感や友達の力で回復するタイプ。" },
      { code: "あつもひ", name: "共依存沼モビー", summary: "相手への集中が強く、監視や執着に寄りやすいので距離の作り方が大事なタイプ。" },
      { code: "ゆじすふ", name: "情緒ジェットコースターモビー", summary: "感情の上下は激しいけれど、依存しすぎず一人で回復しやすいタイプ。" },
      { code: "ゆじすひ", name: "闇堕ちモビー", summary: "好きになるほど怖くなり、黙って消えたり自己否定に入りやすいタイプ。" },
      { code: "ゆじもふ", name: "メンヘラ発動モビー", summary: "恋をすると衝動投稿や長文LINEに走りやすいけど、正気に戻るのも早いタイプ。" },
      { code: "ゆじもひ", name: "好きすぎて滅モビー", summary: "一途さが強く、相手中心で生活が崩れやすいタイプ。" },
      { code: "ゆつすふ", name: "独占欲バグモビー", summary: "相手を把握したい気持ちが強く、確認できると落ち着きやすいタイプ。" },
      { code: "ゆつすひ", name: "イカ焼きモビー", summary: "痛みを外に出せず抱え込みやすいので、安全な逃がし方と相談先が大事なタイプ。" },
      { code: "ゆつもふ", name: "情緒バグモビー", summary: "泣く、怒る、笑うが同時に来るような感情豊かなタイプ。相談先の分散が大事。" },
      { code: "ゆつもひ", name: "恋愛ゾンビモビー", summary: "恋愛で何度沈んでも戻る力はあるけど、まず生活を守ることが大事なタイプ。" }
    ]
  },
  "16renai": {
    label: "恋愛モビー診断",
    pagePath: "/16renai/",
    description: "恋愛での立ち位置、好きな人との距離感、恋に求める温度、恋の見せ方を見る診断です。40問の7段階回答で16タイプに分かれます。",
    questionCount: 40,
    answerScale: "7段階",
    axes: [
      "A: 恋愛での立ち位置（ヒロイン型 / 支え役型）",
      "B: 恋人との距離感（離したくない型 / 自由もほしい型）",
      "C: 恋に求める温度（ときめき重視型 / 安心重視型）",
      "D: 恋の見せ方（見せたい恋型 / 内にしまう恋型）"
    ],
    types: [
      { code: "HLTO", name: "花束の主人公", characterName: "花束の主人公モビー", summary: "恋の主役感、ときめき、見せたくなる幸せを持つタイプ。" },
      { code: "HLTC", name: "秘密の星", characterName: "秘密の星モビー", summary: "特別に愛されたいけど、その恋は二人だけで大切にしたいタイプ。" },
      { code: "HLAO", name: "ひなたの愛され人", characterName: "ひなたの愛され人モビー", summary: "離したくない安心と、周りにも伝わる愛され感を求めやすいタイプ。" },
      { code: "HLAC", name: "雨宿りの待ち人", characterName: "雨宿りの待ち人モビー", summary: "大切にされている実感を、静かに深く受け取りたいタイプ。" },
      { code: "HFTO", name: "風まかせの小悪魔", characterName: "風まかせの小悪魔モビー", summary: "自由さとときめき、少し見せたくなる魅力を持つタイプ。" },
      { code: "HFTC", name: "月影のミューズ", characterName: "月影のミューズモビー", summary: "自由でいたいけど、恋の特別感は二人だけで味わいたいタイプ。" },
      { code: "HFAO", name: "晴れ間の本命", characterName: "晴れ間の本命モビー", summary: "自分の時間も大事にしながら、安心できる本命感を求めるタイプ。" },
      { code: "HFAC", name: "静かな灯", characterName: "静かな灯モビー", summary: "自由と安心を大事にしながら、二人だけの深い愛情を育てるタイプ。" },
      { code: "SLTO", name: "恋に旗を振る人", characterName: "恋に旗を振る人モビー", summary: "相手を支えながら、一緒にときめく時間を外にも残したいタイプ。" },
      { code: "SLTC", name: "胸奥のロマン", characterName: "胸奥のロマンモビー", summary: "相手を支えながら、二人だけのロマンチックな世界を大切にするタイプ。" },
      { code: "SLAO", name: "陽だまりを分ける人", characterName: "陽だまりを分ける人モビー", summary: "支え合う安心感を、周りにも伝わる形で残したいタイプ。" },
      { code: "SLAC", name: "毛布をかける守り人", characterName: "毛布をかける守り人モビー", summary: "離したくない気持ちで支えながら、二人だけの安心できる関係を大事にするタイプ。" },
      { code: "SFTO", name: "地図を広げる冒険家", characterName: "地図を広げる冒険家モビー", summary: "自由さとときめきを大切にしながら、楽しい恋を形に残したいタイプ。" },
      { code: "SFTC", name: "夜風のロマンチスト", characterName: "夜風のロマンチストモビー", summary: "自由な距離感の中で、二人だけのロマンを静かに育てるタイプ。" },
      { code: "SFAO", name: "余白を飾る演出家", characterName: "余白を飾る演出家モビー", summary: "自由で自然体だけど、関係性の見せ方にもセンスが出るタイプ。" },
      { code: "SFAC", name: "静かな港の相棒", characterName: "静かな港の相棒モビー", summary: "自由と安心、二人だけの信頼を長く育てるタイプ。" }
    ]
  }
};

const SOURCE_ALIASES = {
  "16school": ["学校", "スクール", "school", "クラス", "友達", "友だち", "男子", "女子"],
  "16stan": ["推し", "推し活", "stan", "オタク", "現場", "在宅", "布教"],
  "16love": ["メンヘラ", "返信こない", "即レス", "病み", "共依存", "独占欲", "恋愛ゾンビ"],
  "mobby_mbti_shadow": ["モビー診断", "mbti", "MBTI", "よく見せ", "不都合隠し", "闇スイッチ", "皮をかぶったモビー"],
  "16renai": ["恋愛モビー", "恋愛診断", "恋愛タイプ", "片思い", "好きな人", "相性", "花束", "夜風"]
};

export function getDiagnosisMeta(source) {
  const item = DIAGNOSIS_KNOWLEDGE[source];
  return item ? { label: item.label, pagePath: item.pagePath } : null;
}

function allTypes(item) {
  return [
    ...(Array.isArray(item.types) ? item.types : []),
    ...(Array.isArray(item.maleTypes) ? item.maleTypes : []),
    ...(Array.isArray(item.femaleTypes) ? item.femaleTypes : [])
  ];
}

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, "");
}

export function findTypeMatches(message) {
  const normalized = normalizeText(message);
  const matches = [];
  Object.entries(DIAGNOSIS_KNOWLEDGE).forEach(([source, item]) => {
    allTypes(item).forEach((type) => {
      const names = [type.name, type.displayName, type.characterName, type.code].filter(Boolean);
      if (names.some((name) => normalized.includes(normalizeText(name)))) {
        matches.push({ source, diagnosis: item, type });
      }
    });
  });
  return matches.slice(0, 4);
}

function detectSources(message) {
  const normalized = normalizeText(message);
  const sources = new Set();

  Object.entries(SOURCE_ALIASES).forEach(([source, aliases]) => {
    if (aliases.some((alias) => normalized.includes(normalizeText(alias)))) {
      sources.add(source);
    }
  });

  if (/恋愛/.test(message) && !/メンヘラ/.test(message)) {
    sources.add("16renai");
  }
  if (/恋愛/.test(message) && /メンヘラ|病み|返信|依存/.test(message)) {
    sources.add("16love");
  }

  findTypeMatches(message).forEach((match) => sources.add(match.source));
  return [...sources];
}

function compactIntentText(message) {
  return normalizeText(message).replace(/[!?？！。,.、]/g, "");
}

function isBareOwnResultQuestion(message) {
  const text = compactIntentText(message);
  return /^(私の|自分の|俺の|おれの|僕の|ぼくの|わたしの)?診断結果(は|って|教えて|知りたい|見たい|みたい|確認したい)?$/.test(text) ||
    /^(診断)?結果(教えて|知りたい|見たい|みたい|確認したい)$/.test(text);
}

function isResultShorthand(message) {
  return /^(結果|結果は|結果って)$/.test(compactIntentText(message));
}

function isLinkedAffirmation(message) {
  const text = compactIntentText(message);
  return /^(もう)?(line)?連携(済み?|した|できてる|できた|してる)(だよ|です|よ)?$/.test(text) ||
    /^(line)?連携済み?(だよ|です|よ)?$/.test(text);
}

function recentMessages(history, limit = 5) {
  return Array.isArray(history)
    ? history.slice(-limit).filter((item) => item?.role === "user" || item?.role === "assistant")
    : [];
}

function hasRecentOwnResultCue(history) {
  return recentMessages(history).some((item) => {
    const text = String(item?.text || "");
    if (item.role === "user") {
      return isBareOwnResultQuestion(text) ||
        /(私|自分|俺|おれ|僕|ぼく|わたし)の?(診断)?結果/.test(text);
    }
    return /私の診断結果|診断結果ページからLINE連携|診断結果.*連携|LINE連携.*診断結果|結果をふまえて話せる/.test(text);
  });
}

export function isOwnResultQuestion(message, history = []) {
  const text = String(message || "");
  const explicitOwnResultQuestion =
    /(私|自分|俺|おれ|僕|ぼく|わたし)の?(診断)?結果.*(覚えて|わかる|分かる|知って|何|教えて)|(私|自分|俺|おれ|僕|ぼく|わたし)(って|は|の).*(何タイプ|どのタイプ|診断結果|結果)|結果.*覚えて|診断結果.*覚えて/.test(text);

  if (explicitOwnResultQuestion || isBareOwnResultQuestion(text)) return true;
  if ((isResultShorthand(text) || isLinkedAffirmation(text)) && hasRecentOwnResultCue(history)) return true;
  return false;
}

export function getDiagnosisTypes(source) {
  const item = DIAGNOSIS_KNOWLEDGE[source];
  return item ? allTypes(item) : [];
}

function wantsDiagnosisOverview(message) {
  return /モビー診断|診断.*(何|どれ|種類|一覧|ある|教えて)|何種類|通常公開|公開.*診断/.test(String(message || ""));
}

function wantsTypeList(message) {
  return /タイプ一覧|全タイプ|16タイプ|種類.*タイプ|タイプ.*教えて/.test(String(message || ""));
}

function formatTypeList(types) {
  return types.map((type) => type.displayName || type.name).join(" / ");
}

function formatKnowledgeForSource(source, item, { includeTypes = false } = {}) {
  const lines = [
    `- ${item.label} (${item.pagePath}): ${item.description}`,
    `  質問: ${item.questionCount}問 / 回答: ${item.answerScale}`,
    `  軸: ${item.axes.join("、")}`
  ];

  if (includeTypes) {
    if (item.maleTypes || item.femaleTypes) {
      lines.push(`  男子タイプ: ${formatTypeList(item.maleTypes || [])}`);
      lines.push(`  女子タイプ: ${formatTypeList(item.femaleTypes || [])}`);
    } else {
      lines.push(`  タイプ: ${formatTypeList(item.types || [])}`);
    }
  }

  return lines.join("\n");
}

export function buildDiagnosisKnowledgeContext({ user, message, history } = {}) {
  const text = String(message || "");
  const matchedTypes = findTypeMatches(text);
  const sources = detectSources(text);
  const includeOverview = wantsDiagnosisOverview(text);
  const includeTypes = wantsTypeList(text) || matchedTypes.length > 0;
  const asksOwnResult = isOwnResultQuestion(text, history);

  if (!includeOverview && !includeTypes && !sources.length && !asksOwnResult) {
    return "";
  }

  const selectedSources = includeOverview && !sources.length
    ? Object.keys(DIAGNOSIS_KNOWLEDGE)
    : sources;

  const lines = [];

  if (includeOverview || includeTypes || sources.length) {
    lines.push(
      "診断知識（診断について聞かれた時だけ使う。ここにない仕様やタイプ名は推測しない）:",
      "- 通常公開のモビー診断は5種類: モビー診断、学校モビー診断、推し活モビー診断、メンヘラモビー診断、恋愛モビー診断。",
      "- このナレッジをそのまま固定文として返さず、ユーザーの聞き方に合わせて自然に言い換える。"
    );

    selectedSources.forEach((source) => {
      const item = DIAGNOSIS_KNOWLEDGE[source];
      if (item) lines.push(formatKnowledgeForSource(source, item, { includeTypes }));
    });

    matchedTypes.forEach(({ diagnosis, type }) => {
      lines.push(`該当タイプ: ${diagnosis.label}の「${type.name}」 (${type.code}) は、${type.summary}`);
    });
  }

  if (asksOwnResult) {
    lines.push("個別診断結果の質問文脈: 「診断結果」だけの短い聞き方や「連携済み」だけの返事も、直近文脈があれば自分の診断結果確認として扱う。");
    if (user?.personalResultLinked && user?.resultName) {
      lines.push("ユーザーの診断結果が連携済みの場合は、保存済み結果を会話の背景として参照してよい。");
    } else {
      lines.push("ユーザーの診断結果が未連携の場合は、診断結果ページからLINE連携すると結果をふまえて話せると案内する。");
    }
  }

  return lines.join("\n");
}
