(() => {
  const TYPE_LENS = {
    ISTJ: {
      surface: "責任感があり、堅実で、きちんとしている人",
      translation: "不安を予定やルールで押さえ込みやすい。崩れる前に固めるので、想定外にかなり弱い。",
      snark: "ちゃんとしてるんじゃなくて、崩れた時の自分を見たくないだけの時があります。",
      darkSwitchCandidates: "予定が崩れる / 雑に扱われる / 努力を当然扱いされる",
      bias: { rigidity: 2, control_need: 2, anger_stack: 1, emotional_suppression: 1 }
    },
    ISFJ: {
      surface: "優しく、面倒見がよく、人を支える人",
      translation: "嫌われ不安と承認欲求を、献身や気配りで包みやすい。気づかれないと静かに傷つく。",
      snark: "見返りはいらない顔をしながら、感謝が薄い相手のことはちゃんと覚えています。",
      darkSwitchCandidates: "感謝されない / 自分だけ後回し / 頼られなくなる",
      bias: { people_pleasing: 2, approval_hunger: 2, anger_stack: 1, abandonment_fear: 1 }
    },
    INFJ: {
      surface: "深く考え、人の本質を見ようとする人",
      translation: "理解されたいのに、見抜かれるのは怖い。近づきたい気持ちと逃げたい気持ちが同居している。",
      snark: "人の奥を見る前に、自分の奥を見られるのをかなり警戒しています。",
      darkSwitchCandidates: "本音を踏み込まれる / 理解されない / 理想を雑に扱われる",
      bias: { avoidance: 2, self_deception: 2, abandonment_fear: 1, emotional_suppression: 1 }
    },
    INTJ: {
      surface: "戦略的で、独立していて、合理的な人",
      translation: "負けたくなさと弱みを見せたくなさが強い。冷静さは能力であり、防御でもある。",
      snark: "合理的に見えて、感情を見せた瞬間に負けると思っているだけの時があります。",
      darkSwitchCandidates: "無能扱いされる / 予測が外れる / 弱みを見られる",
      bias: { superiority_defense: 2, control_need: 2, emotional_suppression: 2 }
    },
    ISTP: {
      surface: "冷静で自由、必要な時だけ動く人",
      translation: "深い責任や感情処理に巻き込まれる前に距離を取りやすい。自由は強みだが、逃げ道にもなる。",
      snark: "自由が好きというより、重くなる前に出口を確認している時があります。",
      darkSwitchCandidates: "感情的に詰められる / 責任を迫られる / 距離を詰められる",
      bias: { avoidance: 2, responsibility_escape: 2, emotional_suppression: 1 }
    },
    ISFP: {
      surface: "穏やかで、自分の感性を大切にする人",
      translation: "衝突を避けるために嫌なことを飲み込みやすい。限界が来ると静かに冷める。",
      snark: "穏やかなんじゃなくて、言う前にあきらめているだけの場面があります。",
      darkSwitchCandidates: "価値観を否定される / 雑な扱い / 本音を流される",
      bias: { avoidance: 2, emotional_suppression: 1, anger_stack: 1, self_deception: 1 }
    },
    INFP: {
      surface: "理想があり、感受性が強く、純粋な人",
      translation: "理解されたい飢えが強い。傷つくと、分かってくれない相手より自分の物語を守りに行く。",
      snark: "繊細さを盾にして、刺さった事実を見ないようにする時があります。",
      darkSwitchCandidates: "否定される / 軽く扱われる / 理想を笑われる",
      bias: { fantasy_escape: 2, abandonment_fear: 1, self_deception: 2, approval_hunger: 1 }
    },
    INTP: {
      surface: "論理的で、独自の考えを持つ人",
      translation: "感情や責任の処理を、理屈で先延ばししやすい。説明できる場所に逃げる。",
      snark: "考えているようで、決めるのが怖くて思考に避難している時があります。",
      darkSwitchCandidates: "感情を求められる / 決断を迫られる / 矛盾を突かれる",
      bias: { emotional_suppression: 2, responsibility_escape: 2, self_deception: 1 }
    },
    ESTP: {
      surface: "行動力があり、ノリよく場を動かす人",
      translation: "退屈や重い話から逃げたい気持ちが出やすい。止まると見たくない不安が聞こえてくる。",
      snark: "行動力ではなく、立ち止まると面倒な感情が追いついてくるだけの時があります。",
      darkSwitchCandidates: "退屈 / 縛られる / 深刻な話を迫られる",
      bias: { responsibility_escape: 2, avoidance: 1, loneliness_avoidance: 1, impression_management: 1 }
    },
    ESFP: {
      surface: "明るく、人を楽しませ、今を楽しむ人",
      translation: "反応が薄いと自分の価値まで揺れやすい。明るさで孤独を聞こえにくくしている。",
      snark: "場を明るくしている間だけ、ひとりの不安を見なくて済んでいます。",
      darkSwitchCandidates: "反応が薄い / 一人にされる / 注目が移る",
      bias: { approval_hunger: 2, loneliness_avoidance: 2, reaction_sensitivity: 2 }
    },
    ENFP: {
      surface: "自由で、人懐こく、可能性を広げる人",
      translation: "選ばれたい欲と飽きやすさを、自由という言葉で包みやすい。反応が薄いと急に不安になる。",
      snark: "自由人の顔をしながら、選ばれている証拠をかなり欲しがっています。",
      darkSwitchCandidates: "反応が薄い / 後回し / 熱量差",
      bias: { approval_hunger: 2, reaction_sensitivity: 2, fantasy_escape: 1, testing_behavior: 1 }
    },
    ENTP: {
      surface: "発想力があり、議論に強く、型にはまらない人",
      translation: "負けたくなさと退屈への弱さが出やすい。責任が重くなると、面白さや言葉でずらす。",
      snark: "頭の回転で勝っているようで、正面から受け止めるのが嫌で言葉を増やす時があります。",
      darkSwitchCandidates: "論破される / 退屈 / 責任を固定される",
      bias: { superiority_defense: 2, responsibility_escape: 2, impression_management: 1 }
    },
    ESTJ: {
      surface: "実行力があり、現実を前に進める人",
      translation: "無能扱いとコントロール不能が怖い。正論は武器でもあり、不安を整える道具でもある。",
      snark: "正しいことを言っているようで、想定外の世界が怖いだけの時があります。",
      darkSwitchCandidates: "予定外 / 無責任な相手 / 自分の判断を疑われる",
      bias: { control_need: 2, rigidity: 2, superiority_defense: 1, anger_stack: 1 }
    },
    ESFJ: {
      surface: "社交的で気配りができ、周囲をまとめる人",
      translation: "評価されたい気持ちと外されたくない不安が強い。気配りが、関係を握る動きに変わることがある。",
      snark: "みんなのための顔をしながら、輪の中心から落ちるのをかなり怖がっています。",
      darkSwitchCandidates: "誘われない / 感謝されない / 空気を乱される",
      bias: { approval_hunger: 2, people_pleasing: 2, control_need: 1, reaction_sensitivity: 1 }
    },
    ENFJ: {
      surface: "人を導き、支え、場をよくする人",
      translation: "感謝されたい気持ちと影響力を持ちたい欲が混ざりやすい。救うことで自分の価値を確かめる。",
      snark: "相手のためと言いながら、必要とされることで自分を保っている時があります。",
      darkSwitchCandidates: "感謝されない / 頼られない / 自分抜きで進む",
      bias: { approval_hunger: 2, control_need: 1, people_pleasing: 2, self_deception: 1 }
    },
    ENTJ: {
      surface: "リーダーシップがあり、成果に向かって動ける人",
      translation: "弱さ・敗北・無価値化への恐怖が強い。成果で自分の価値を証明しようとする。",
      snark: "強いんじゃなくて、弱く見られた瞬間に終わると思っているだけの時があります。",
      darkSwitchCandidates: "負ける / 軽く扱われる / 主導権を失う",
      bias: { control_need: 2, superiority_defense: 2, emotional_suppression: 1, approval_hunger: 1 }
    }
  };

  const COMMON = {
    goodFaceHigh: "よく見せメーターが高い時：自分の面倒な部分まで、聞こえのいい言葉に置き換えるのがうまい状態です。",
    hiddenTruthHigh: "不都合隠しメーターが高い時：言葉では整っていても、行動には不安・嫉妬・支配欲が少し漏れています。",
    relief: "救い：面倒くささは欠陥ではなく、防衛反応です。ただし、気づかないままだと人間関係で同じ壊れ方をします。"
  };

  window.MOBBY_TYPE_LENS = TYPE_LENS;
  window.MOBBY_RESULT_COPY = Object.fromEntries(Object.entries(TYPE_LENS).map(([code, lens]) => [
    code,
    {
      headline: `${code}の皮をかぶったあなたへ`,
      mbtiSays: `MBTIでは「${lens.surface}」と説明されることが多いタイプです。`,
      mobbyTranslation: `モビー的には、${lens.translation}`,
      snark: lens.snark,
      darkSwitchText: `闇スイッチ候補：${lens.darkSwitchCandidates}`,
      ...COMMON
    }
  ]));

  window.MOBBY_METER_COPY = [
    {
      meter: "good_face",
      range: "0-39",
      displayLabel: "よく見せメーター 低",
      copy: "飾りは少なめ。よく見せるより、わりとそのまま出せています。"
    },
    {
      meter: "good_face",
      range: "40-69",
      displayLabel: "よく見せメーター 中",
      copy: "少し整えています。弱さをそのまま出すより、聞こえのいい言葉に置き換えがちです。"
    },
    {
      meter: "good_face",
      range: "70-100",
      displayLabel: "よく見せメーター 高",
      copy: "かなり整えています。自分の面倒なところまで、長所っぽく見せるのがうまいです。"
    },
    {
      meter: "hidden_truth",
      range: "0-39",
      displayLabel: "不都合隠しメーター 低",
      copy: "隠しているものは少なめ。痛い部分にも、比較的まっすぐ気づけています。"
    },
    {
      meter: "hidden_truth",
      range: "40-69",
      displayLabel: "不都合隠しメーター 中",
      copy: "それなりに隠しています。本人は普通のつもりでも、反応の端に本音が出ています。"
    },
    {
      meter: "hidden_truth",
      range: "70-100",
      displayLabel: "不都合隠しメーター 高",
      copy: "かなり隠しています。大人な言葉の裏で、不安・嫉妬・怒りがしっかり動いています。"
    },
    {
      meter: "dark_switch",
      range: "rejection",
      displayLabel: "闇スイッチ：後回し",
      copy: "後回しにされたと感じると、あなたの中のモビーが起きます。「大事にされていない」がいちばん刺さります。"
    },
    {
      meter: "dark_switch",
      range: "disrespect",
      displayLabel: "闇スイッチ：雑扱い",
      copy: "雑に扱われた瞬間、心の中で相手の点数を下げます。笑っていても、かなり正確に記録しています。"
    },
    {
      meter: "dark_switch",
      range: "ignored_effort",
      displayLabel: "闇スイッチ：努力の当然扱い",
      copy: "頑張りを当然扱いされると冷めます。見返りはいらない顔をしても、気づかれなさには弱いです。"
    },
    {
      meter: "dark_switch",
      range: "control_loss",
      displayLabel: "闇スイッチ：主導権喪失",
      copy: "思い通りに進まない時、不安が怒りや正論に変わります。支配したいというより、崩れるのが怖い。"
    },
    {
      meter: "dark_switch",
      range: "intimacy",
      displayLabel: "闇スイッチ：踏み込み",
      copy: "本音に踏み込まれると逃げたくなります。理解されたいのに、見抜かれるのは怖いタイプです。"
    },
    {
      meter: "dark_switch",
      range: "comparison",
      displayLabel: "闇スイッチ：比較",
      copy: "誰かと比べられた瞬間、平気な顔の裏で勝ち負けの処理が始まります。"
    },
    {
      meter: "dark_switch",
      range: "ambiguity",
      displayLabel: "闇スイッチ：曖昧な態度",
      copy: "曖昧な態度を向けられると、確認する前に観察が始まります。聞けば早いのに、傷つく可能性を先に計算します。"
    },
    {
      meter: "dark_switch",
      range: "silence",
      displayLabel: "闇スイッチ：沈黙",
      copy: "沈黙が続くと、自分の価値まで測り始めます。落ち着いているふりをしても、反応の薄さには弱いです。"
    }
  ];

  window.MOBBY_DRIVER_COPY = {
    approval_hunger: {
      condition: "approval_hunger 最大",
      snark: "見てほしいのに、見てほしいとは言わない。だから反応待ちが面倒な形で出ます。",
      relief: "承認欲求は悪ではありません。欲しい反応を言葉にできると、こじれにくくなります。"
    },
    abandonment_fear: {
      condition: "abandonment_fear 最大",
      snark: "相手の返信速度で、自分の価値まで測りに行っています。",
      relief: "不安は愛情の深さではなく、確認方法の癖として扱うと少し楽になります。"
    },
    jealousy: {
      condition: "jealousy 最大",
      snark: "平気な顔で全部覚えています。嫉妬していない人の記憶力ではありません。",
      relief: "嫉妬は「自分も大事にされたい」のサインです。責めるより翻訳した方が早いです。"
    },
    control_need: {
      condition: "control_need 最大",
      snark: "正しいことを言っている顔で、想定外を潰しに行く時があります。",
      relief: "握る範囲と任せる範囲を分けると、人間関係が壊れにくくなります。"
    },
    avoidance: {
      condition: "avoidance 最大",
      snark: "自由に見せながら、深くなる前に逃げ道を作っています。",
      relief: "距離を取る力は強みです。ただし毎回逃げると、欲しい関係も残りません。"
    },
    emotional_suppression: {
      condition: "emotional_suppression 最大",
      snark: "冷静なんじゃなくて、感情を出すと負けると思っているだけの時があります。",
      relief: "感情を言葉にすることは負けではありません。むしろ処理の精度が上がります。"
    },
    people_pleasing: {
      condition: "people_pleasing 最大",
      snark: "優しいんじゃなくて、嫌われたくないから先回りしている場面があります。",
      relief: "気配りと自己犠牲を分けるだけで、かなり楽になります。"
    },
    anger_stack: {
      condition: "anger_stack 最大",
      snark: "その場では笑う。でも心の中ではカウントしています。",
      relief: "溜めて爆発する前に、小さく不快を出す方が結果的にやさしいです。"
    },
    superiority_defense: {
      condition: "superiority_defense 最大",
      snark: "論理や正しさで勝とうとする時ほど、実は刺さっています。",
      relief: "勝つより、刺さった理由を見る方が強いです。"
    },
    responsibility_escape: {
      condition: "responsibility_escape 最大",
      snark: "自由と言いながら、重くなった瞬間に出口を探しています。",
      relief: "逃げ道を持つのは悪くありません。約束の前に条件を明確にした方が壊れにくいです。"
    },
    reaction_sensitivity: {
      condition: "reaction_sensitivity 最大",
      snark: "相手の小さな反応で、自分の立ち位置を何度も測り直しています。",
      relief: "反応を読む力は強みです。事実確認と妄想を分けるだけでかなり落ち着きます。"
    },
    testing_behavior: {
      condition: "testing_behavior 最大",
      snark: "確かめたいのに素直に聞けず、相手を試す方向に出やすいです。",
      relief: "試すより、軽く確認する方が関係は長持ちします。"
    },
    fear_of_intimacy: {
      condition: "fear_of_intimacy 最大",
      snark: "近づきたいのに、近づかれると逃げる準備を始めます。",
      relief: "怖さを言葉にできると、距離を取ることが拒絶に見えにくくなります。"
    },
    confirmation_need: {
      condition: "confirmation_need 最大",
      snark: "聞けば済むことを、相手の行動観察で解こうとします。",
      relief: "観察より短い確認の方が、余計な想像を増やしません。"
    },
    loneliness_avoidance: {
      condition: "loneliness_avoidance 最大",
      snark: "寂しいと言わずに、反応がある場所だけ開きます。",
      relief: "寂しさは弱さではありません。言える形に小さく変えるだけで十分です。"
    }
  };

  window.MOBBY_SCORING_KEYS = {
    good_face: { meaning: "よく見せ回答", high: "綺麗な自己像を選びやすい" },
    clean_claim: { meaning: "きれいごと主張", high: "嫉妬しない・依存しない・怒らないなどの自己美化が強い" },
    impression_management: { meaning: "印象操作", high: "人からどう見られるかを設計している" },
    hidden_truth: { meaning: "不都合な本音", high: "言葉にしづらい欲求や反応が出ている" },
    self_deception: { meaning: "自己欺瞞", high: "本人も都合よく信じている可能性がある" },
    approval_hunger: { meaning: "承認飢え", high: "見てほしい・認められたい欲が強い" },
    abandonment_fear: { meaning: "見捨て不安", high: "離れられる・後回しにされることへの不安" },
    jealousy: { meaning: "嫉妬", high: "比較・独占・一番でいたい欲" },
    control_need: { meaning: "支配/管理欲", high: "不安を整えるために主導権を握りたい" },
    avoidance: { meaning: "逃避", high: "深くなる前に距離を置く" },
    responsibility_escape: { meaning: "責任回避", high: "重い役割や固定から逃げ道を作る" },
    emotional_suppression: { meaning: "感情抑圧", high: "冷静に見せるために本音を切る" },
    people_pleasing: { meaning: "いい人演技", high: "嫌われないために合わせる" },
    anger_stack: { meaning: "怒り蓄積", high: "その場では出さず後から溜まる" },
    superiority_defense: { meaning: "優位性防衛", high: "負けや劣等感を正しさ・論理で守る" },
    reaction_sensitivity: { meaning: "反応過敏", high: "返信・リアクション・温度差に敏感" },
    testing_behavior: { meaning: "試し行動", high: "相手の愛情や本気度を試す" },
    loneliness_avoidance: { meaning: "孤独回避", high: "一人の不安を明るさや反応で埋める" },
    fear_of_intimacy: { meaning: "親密さへの怖さ", high: "近づきたいのに踏み込まれると逃げやすい" },
    confirmation_need: { meaning: "確認欲求", high: "曖昧さに弱く、相手の反応を読み続ける" },
    rigidity: { meaning: "硬さ", high: "予定外や変更に弱い" },
    pride: { meaning: "プライド防衛", high: "負けや軽視を受け流しにくい" },
    validation_need: { meaning: "価値確認", high: "認められることで安心しやすい" },
    fantasy_escape: { meaning: "理想逃避", high: "現実の痛さを物語や理想で包みやすい" },
    claim_no_reward: { meaning: "見返り否認", high: "見返りはいらないという自己像が強い" },
    claim_rational: { meaning: "冷静主張", high: "感情より冷静さを見せたい" },
    claim_independent: { meaning: "自立主張", high: "一人でも平気な自己像が強い" },
    claim_no_anger: { meaning: "怒り否認", high: "怒っていないことにしたい" },
    claim_no_jealousy: { meaning: "嫉妬否認", high: "嫉妬していないことにしたい" },
    claim_responsible: { meaning: "責任主張", high: "責任を取れる自己像を守りたい" },
    trigger_rejection: { meaning: "後回し反応", high: "後回しにされると反応が出やすい" },
    trigger_disrespect: { meaning: "雑扱い反応", high: "軽く扱われると反応が出やすい" },
    trigger_control_loss: { meaning: "主導権喪失反応", high: "主導権を失うと反応が出やすい" },
    trigger_intimacy: { meaning: "踏み込み反応", high: "本音に踏み込まれると反応が出やすい" },
    trigger_comparison: { meaning: "比較反応", high: "比較されると反応が出やすい" },
    self_awareness: { meaning: "自己認識", high: "自分の反応を見直せる" },
    directness: { meaning: "率直さ", high: "嫌だったことを短く言葉にできる" },
    stability: { meaning: "立て直し", high: "刺さった後に戻って考えられる" }
  };
})();
