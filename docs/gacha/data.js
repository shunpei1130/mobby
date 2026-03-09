(() => {
  const rawCharacters = [
      // School Male (16)
      { name: "文化祭センターステージモビー", img: "16school/cha/ortp.jpg", cat: "school_m", summary: "場の空気を読むのが早く、自然と前に立っているタイプ。", catch: "「盛り上がってる？」が合言葉。場の空気を一瞬で読んで、自分から動けるタイプ。" },
      { name: "体育祭モビー", img: "16school/cha/orti.jpg", cat: "school_m", summary: "盛り上がりを作るタイプ。", catch: "「全力で行こうぜ！」仲間と一緒なら、何でも全力で楽しめる。" },
      { name: "廊下ランウェイモビー", img: "16school/cha/orlp.jpg", cat: "school_m", summary: "オシャレとノリで場を支配するタイプ。", catch: "「見られてる？ ならもっと決める」。廊下が自分のステージ。" },
      { name: "応援団長モビー", img: "16school/cha/ojtp.jpg", cat: "school_m", summary: "仲間を巻き込んで場を熱くするタイプ。", catch: "「俺がやらなきゃ始まらない」。熱さで場を変える力がある。" },
      { name: "裏アカ拡散モビー", img: "16school/cha/qrtp.jpg", cat: "school_m", summary: "情報収集と拡散が得意なタイプ。", catch: "「知ってた？」が口癖。情報ネットワークの中心にいる。" },
      { name: "部室たまり場モビー", img: "16school/cha/qrti.jpg", cat: "school_m", summary: "気の合う仲間と自分のペースで過ごすタイプ。", catch: "「ここが一番落ち着く」。仲間との空間を自分で作る。" },
      { name: "教科書裏落書きモビー", img: "16school/cha/qrli.jpg", cat: "school_m", summary: "独自の世界観を持つクリエイティブタイプ。", catch: "「これ、面白くない？」。自分の世界を表現したい。" },
      { name: "屋上自由時間モビー", img: "16school/cha/orli.jpg", cat: "school_m", summary: "マイペースに自由を楽しむタイプ。", catch: "「自由が一番」。束縛を嫌い、自分の時間を大事にする。" },
      { name: "舞台袖実行委員モビー", img: "16school/cha/qjtp.jpg", cat: "school_m", summary: "裏方として場を支えるタイプ。", catch: "「誰かがやらないと回らない」。縁の下の力持ち。" },
      { name: "学級委員モビー", img: "16school/cha/ojti.jpg", cat: "school_m", summary: "真面目に場を整えるタイプ。", catch: "「ちゃんとやろう」。責任感で周りを引っ張る。" },
      { name: "制服アレンジモビー", img: "16school/cha/qrlp.jpg", cat: "school_m", summary: "個性を出しつつルール内で勝負するタイプ。", catch: "「校則ギリ攻める」。自分なりのスタイルにこだわる。" },
      { name: "成績掲示板モビー", img: "16school/cha/ojlp.jpg", cat: "school_m", summary: "数字で結果を示すタイプ。", catch: "「結果が全て」。努力を形にすることに価値を感じる。" },
      { name: "模試ランキングモビー", img: "16school/cha/qjlp.jpg", cat: "school_m", summary: "目標を立てて計画的に動くタイプ。", catch: "「次は絶対上がる」。戦略的に上を目指す。" },
      { name: "図書委員モビー", img: "16school/cha/qjti.jpg", cat: "school_m", summary: "静かな場所で知識を深めるタイプ。", catch: "「この本、面白いよ」。深い知識が武器になる。" },
      { name: "理科室研究モビー", img: "16school/cha/ojli.jpg", cat: "school_m", summary: "興味を追求するタイプ。", catch: "「もっと知りたい」。好奇心が原動力。" },
      { name: "自習室モビー", img: "16school/cha/qjli.jpg", cat: "school_m", summary: "自分のペースでコツコツ取り組むタイプ。", catch: "「集中できる時間が好き」。一人の時間が力になる。" },
      // School Female (16)
      { name: "文化祭広報モビー", img: "16school/cha/ortp2.jpg", cat: "school_f", summary: "人の輪の中心に入りながら、空気を整えて見せ方まで作るタイプ。", catch: "「みんなで盛れよう！」が合言葉。場を回しながら、全体の見せ方まで考えられる。" },
      { name: "昼休みお弁当会モビー", img: "16school/cha/orti2.jpg", cat: "school_f", summary: "友達との落ち着く時間を大事にするタイプ。", catch: "「今日も楽しかったね」が最高の褒め言葉。落ち着く仲間との時間が一番の宝物。" },
      { name: "帰り道デートモビー", img: "16school/cha/orlp2.jpg", cat: "school_f", summary: "好きな人ができると一気に恋愛モードになるタイプ。", catch: "「好きな人がいると毎日キラキラ」。恋も友達も大事にしたい欲張りさん。" },
      { name: "屋上ひみつ恋モビー", img: "16school/cha/orli2.jpg", cat: "school_f", summary: "二人の空気を守りたい慎重派タイプ。", catch: "「二人だけの秘密」が特別。派手にアピールするより、静かに育てたい。" },
      { name: "プリクラ拡散モビー", img: "16school/cha/ojtp2.jpg", cat: "school_f", summary: "友達と盛れてる瞬間が最高なタイプ。", catch: "「今日めっちゃ盛れた！」が最高の瞬間。友達と一緒なら何でも楽しい。" },
      { name: "購買前たまり場モビー", img: "16school/cha/ojti2.jpg", cat: "school_f", summary: "自分のノリと気分を大事にするタイプ。", catch: "「気分がいいのが一番」。見せびらかすより、今この瞬間を楽しみたい。" },
      { name: "カップル自撮りモビー", img: "16school/cha/ojlp2.jpg", cat: "school_f", summary: "恋も見せ方も全力でこだわるタイプ。", catch: "「好きな人と盛れてる私、最強」。恋愛も見せ方も両方こだわりたい。" },
      { name: "放課後即レスモビー", img: "16school/cha/ojli2.jpg", cat: "school_f", summary: "自分の気持ちで即行動するタイプ。", catch: "「好きなら即行動」。周りの目より、自分の気持ちが一番大事。" },
      { name: "クラスアルバム映えモビー", img: "16school/cha/qrtp2.jpg", cat: "school_f", summary: "控えめだけど抜け目ないタイプ。", catch: "「ここぞという時はちゃんとする」。控えめだけど、抜け目ない。" },
      { name: "図書室まったりモビー", img: "16school/cha/qrti2.jpg", cat: "school_f", summary: "静かな空間で本領を発揮するタイプ。", catch: "「無理しない関係が一番」。派手さより、安心できる空間が大事。" },
      { name: "ストーリー匂わせモビー", img: "16school/cha/qrlp2.jpg", cat: "school_f", summary: "直接言えないけど気づいてほしいタイプ。", catch: "「察してほしい」が本音。直接言えないけど、気づいてほしい。" },
      { name: "ロッカー手紙モビー", img: "16school/cha/qrli2.jpg", cat: "school_f", summary: "大事な気持ちを静かに育てるタイプ。", catch: "「大事な気持ちは静かに育てる」。誠実さで勝負したい。" },
      { name: "ストーリー撮影班モビー", img: "16school/cha/qjtp2.jpg", cat: "school_f", summary: "映える瞬間の嗅覚が強い裏方タイプ。", catch: "「いい写真、撮ったよ」が褒め言葉。裏方だけど、センスには自信あり。" },
      { name: "ネイルこだわりモビー", img: "16school/cha/qjti2.jpg", cat: "school_f", summary: "自分のテンションのために盛るタイプ。", catch: "「自分が上がるためにやってる」。見せびらかしより、自分の機嫌が大事。" },
      { name: "匂わせプリクラモビー", img: "16school/cha/qjlp2.jpg", cat: "school_f", summary: "恋が絡むと見せ方が鋭くなるタイプ。", catch: "「察して…？」が全開。控えめに見えて、勝ち筋はしっかり見てる。" },
      { name: "放課後こっそり通話モビー", img: "16school/cha/qjli2.jpg", cat: "school_f", summary: "二人の時間を守りたい恋愛本気タイプ。", catch: "「二人だけの時間が一番」。周りには見せないけど、恋愛には本気。" },
      // Mama (16)
      { name: "連絡網即断司令塔モビー", img: "16school/mama/img/連絡網即断司令塔モビー.jpg", cat: "mama", summary: "情報も段取りも回す伴走型。", catch: "情報も段取りも、回すなら私。家族の選択肢を増やす伴走型。" },
      { name: "運動会タイムキーパーモビー", img: "16school/mama/img/運動会タイムキーパーモビー.jpg", cat: "mama", summary: "必要なことは即決で整える。でも最後は子に任せる。", catch: "必要なことは即決で整える。でも最後は子に任せる。" },
      { name: "放課後相談ホットラインモビー", img: "16school/mama/img/放課後相談ホットラインモビー.jpg", cat: "mama", summary: "心の土台づくりに直球で伴走するタイプ。", catch: "心の土台づくりに直球で伴走。相談が来たら全力で受ける。" },
      { name: "校門あいさつ隊モビー", img: "16school/mama/img/校門あいさつ隊モビー.jpg", cat: "mama", summary: "場の空気は明るくする。子のことは任せて見守る。", catch: "場の空気は明るくする。子のことは任せて見守る。" },
      { name: "面談前リサーチモビー", img: "16school/mama/img/面談前リサーチモビー.jpg", cat: "mama", summary: "まず情報収集。勝ち筋を見つけて、静かに伴走する。", catch: "まず情報収集。勝ち筋を見つけて、静かに伴走する。" },
      { name: "LINE既読熟考モビー", img: "16school/mama/img/LINE既読熟考モビー.jpg", cat: "mama", summary: "すぐ返さないのは、ちゃんと考えてるから。", catch: "すぐ返さないのは、ちゃんと考えてるから。見守り型の情報処理。" },
      { name: "友だち関係ナビモビー", img: "16school/mama/img/友だち関係ナビモビー.jpg", cat: "mama", summary: "空気を読みながら、子の人間関係を支える伴走役。", catch: "空気を読みながら、子の人間関係を迷子にしない伴走役。" },
      { name: "ランチ会聞き役モビー", img: "16school/mama/img/ランチ会聞き役モビー.jpg", cat: "mama", summary: "急がず焦らず、話を受け止める見守り型。", catch: "急がず焦らず、話を受け止める。土台重視の見守り型。" },
      { name: "家庭内スケジュール司令モビー", img: "16school/mama/img/家庭内スケジュール司令モビー.jpg", cat: "mama", summary: "外では静か、家では段取りで勝つ。", catch: "外では静か、家では段取りで勝つ。選択肢重視の伴走型。" },
      { name: "テスト前だけ直球モビー", img: "16school/mama/img/テスト前だけ直球モビー.jpg", cat: "mama", summary: "普段は任せるが、締切前だけは直球で軌道修正。", catch: "普段は任せる。だけど締切前だけは直球で軌道修正。" },
      { name: "親子直球作戦会議モビー", img: "16school/mama/img/親子直球作戦会議モビー.jpg", cat: "mama", summary: "守る時は守る。子の土台を固めるための作戦会議。", catch: "守る時は守る。子の土台を固めるために、家で作戦会議。" },
      { name: "送迎車内サクッと相談モビー", img: "16school/mama/img/送迎車内サクッと相談モビー.jpg", cat: "mama", summary: "短い時間で核心に触れる直球見守り型。", catch: "短い時間で核心に触れる。言ったら任せる、直球見守り型。" },
      { name: "成績表こっそり分析モビー", img: "16school/mama/img/成績表こっそり分析モビー.jpg", cat: "mama", summary: "目立たず整えて、勝ち筋を作る。", catch: "目立たず整えて、勝ち筋を作る。観察×選択肢×伴走。" },
      { name: "影の進路リサーチモビー", img: "16school/mama/img/影の進路リサーチモビー.jpg", cat: "mama", summary: "口は出さない、でも見ている。選択肢は静かに確保する。", catch: "口は出さない、でも見ている。選択肢は静かに確保する。" },
      { name: "寝る前そっとカウンセルモビー", img: "16school/mama/img/寝る前そっとカウンセルモビー.jpg", cat: "mama", summary: "言葉にできない気持ちを拾う静かな伴走。", catch: "言葉にできない気持ちを拾う。土台を整える静かな伴走。" },
      { name: "後方席静観モビー", img: "16school/mama/img/後方席静観モビー.jpg", cat: "mama", summary: "必要以上に踏み込まない。安心基地として後ろから支える。", catch: "必要以上に踏み込まない。安心基地として、後ろから支える。" },
      // Night (16)
      { name: "FOURTY FIVEモビー", img: "16night/img/もはふし.jpg", cat: "night", summary: "場を支配し、太客を掴み、売上で頂点を取る。", catch: "「私がNo.1。それが全て。」華やかさと戦略で頂点に立つ女王タイプ。" },
      { name: "VENETモビー", img: "16night/img/もはふや.jpg", cat: "night", summary: "場を最高に盛り上げる、お祭り大好きタイプ。", catch: "「今夜も最高に楽しもう！」ノリと華やかさで場を支配する。" },
      { name: "JUNGLEモビー", img: "16night/img/もはかし.jpg", cat: "night", summary: "SNSと見た目で新規を呼び、数字に変える。", catch: "「映える私が最強の武器」SNS集客力が半端ない現代型キャスト。" },
      { name: "美人茶屋モビー", img: "16night/img/もはかや.jpg", cat: "night", summary: "華やかに場を回して、全員を笑顔にする。", catch: "「全員楽しんでる？それが一番大事！」場の空気を最高にするのが使命。" },
      { name: "FABRICモビー", img: "16night/img/もなふし.jpg", cat: "night", summary: "品のある接客で太客を掴み、着実に稼ぐ。", catch: "「品と信頼で勝負する」落ち着いた接客力でエースに上り詰めるタイプ。" },
      { name: "azianモビー", img: "16night/img/もなふや.jpg", cat: "night", summary: "温かい空間を作り、お客さんの居場所になる。", catch: "「あなたの話、もっと聞かせて？」包容力で虜にする癒しの女神。" },
      { name: "客引き最強モビー", img: "16night/img/もなかし.jpg", cat: "night", summary: "ナチュラルな魅力で次々と新規を獲得する。", catch: "「初めまして、が一番得意！」自然体で新規を掴む天才。" },
      { name: "みんなの太陽モビー", img: "16night/img/もなかや.jpg", cat: "night", summary: "自然体の明るさで場全体を温める。", catch: "「いるだけで空気が明るくなる」自然体こそ最強の武器。" },
      { name: "太客育成モビー", img: "16night/img/きはふし.jpg", cat: "night", summary: "華やかさで掴み、戦略で太客を育てる。", catch: "「あなた特別よ」の一言で太客が完成する。計算と華やかさの二刀流。" },
      { name: "Lalahモビー", img: "16night/img/きはふや.jpg", cat: "night", summary: "可愛がられ力で太客に愛される。", catch: "「もう〜甘えさせてよ〜♡」愛嬌と甘え上手で太客のハートを掴む。" },
      { name: "AOIモビー", img: "16night/img/きはかし.jpg", cat: "night", summary: "自分をブランド化して高単価で勝負する。", catch: "「私という存在が価値」セルフブランディングで差をつける戦略家。" },
      { name: "SNS戦略家モビー", img: "16night/img/きはかや.jpg", cat: "night", summary: "SNSで世界観を作り、ファンを集める。", catch: "「フォロワー＝見込み客」デジタルで差をつける新時代キャスト。" },
      { name: "銀座Chickモビー", img: "16night/img/きなふし.jpg", cat: "night", summary: "静かな空間で太客と深い関係を築く。", catch: "「あなただけの特別な時間」VIP対応のプロフェッショナル。" },
      { name: "常連づくりの匠モビー", img: "16night/img/きなふや.jpg", cat: "night", summary: "穏やかな関係性で常連を増やし続ける。", catch: "「いつもの場所でいつもの笑顔」安心感で常連を虜にする。" },
      { name: "妃翠モビー", img: "16night/img/きなかし.jpg", cat: "night", summary: "目立たないけど、お店の売上を支える影の実力者。", catch: "「数字は裏で作るもの」静かに結果を出す最強のサポーター。" },
      { name: "居場所づくりモビー", img: "16night/img/きなかや.jpg", cat: "night", summary: "お客さんにとっての帰る場所を作る。", catch: "「ここに来ると落ち着くでしょ？」温かい居場所を提供する癒しの存在。" },
      // Stan (推し活) (16)
      { name: "現場至上主義推しモビー", img: "16stan/img/現場至上主義推しモビー.jpg", cat: "stan", summary: "現場の熱と発信の勢いで、推しの魅力をまっすぐ届ける。", catch: "生活に現場が組み込まれていて、推しの「今この瞬間」を取り逃さないタイプ。" },
      { name: "箱推し熱心モビー", img: "16stan/img/箱推し熱心モビー.jpg", cat: "stan", summary: "グループ・作品・界隈ごと好きになれるタイプ。", catch: "現場で拾った熱を発信して、仲間の熱量も上げていく。" },
      { name: "ソロ神聖視推しモビー", img: "16stan/img/ソロ神聖視推しモビー.jpg", cat: "stan", summary: "推し単体の尊さを自分の中で丁寧に守るタイプ。", catch: "現場には行く。けど騒がない。比較や雑音から距離を取って守り抜く。" },
      { name: "作品反復推しモビー", img: "16stan/img/作品反復推しモビー.jpg", cat: "stan", summary: "作品・演出・空気感まで含めて味わい、繰り返し反芻する。", catch: "静かだけど、体験の深度がすごい。センスが良い通なタイプ。" },
      { name: "リアクション職人推しモビー", img: "16stan/img/リアクション職人推しモビー.jpg", cat: "stan", summary: "日々の供給をこまめに拾って反応するタイプ。", catch: "在宅で毎日、反応で支える。「届く応援」を積み上げていく。" },
      { name: "布教うまい推しモビー", img: "16stan/img/布教うまい推しモビー.jpg", cat: "stan", summary: "推しの良さを見つけて、相手に合わせて刺さる1本を渡せる。", catch: "在宅で毎日、推しの入口を作る。沼の案内人。" },
      { name: "やさしい見守り推しモビー", img: "16stan/img/やさしい見守り推しモビー.jpg", cat: "stan", summary: "距離感を丁寧に保ち、健全な応援で長く推す。", catch: "在宅で毎日、推しを静かに大事にする。落ち着いたタイプ。" },
      { name: "尊い記録係推しモビー", img: "16stan/img/尊い記録係推しモビー.jpg", cat: "stan", summary: "スクショ・メモ・日記で推しの良さを丁寧に保管する。", catch: "在宅で毎日、尊さを残して守る。保存神タイプ。" },
      { name: "ご褒美課金推しモビー", img: "16stan/img/ご褒美課金推しモビー.jpg", cat: "stan", summary: "普段は追いすぎないが、ここぞで一気に熱が爆発する。", catch: "節目で現場、そこで全部出す。メリハリが上手いタイプ。" },
      { name: "まとめ読み推しモビー", img: "16stan/img/まとめ読み推しモビー.jpg", cat: "stan", summary: "イベント期に現場で回収して箱の魅力をまとめて共有。", catch: "現場はまとめて、良さはまとめて届ける。堅実タイプ。" },
      { name: "1コンテンツ一点突破推しモビー", img: "16stan/img/1コンテンツ一点突破推しモビー.jpg", cat: "stan", summary: "一点へ全集中するタイプ。現場で満足して余韻を大事にする。", catch: "ここだけは絶対、を静かに取りに行く。芯がある人。" },
      { name: "成長見守り推しモビー", img: "16stan/img/成長見守り推しモビー.jpg", cat: "stan", summary: "箱・作品の変化を楽しみ、長期の物語を愛する。", catch: "節目で会って、静かに長く見届ける。大人で温かいタイプ。" },
      { name: "一気見感想投下推しモビー", img: "16stan/img/一気見感想投下推しモビー.jpg", cat: "stan", summary: "在宅でまとめて視聴し、感情をそのまま言葉にして投下。", catch: "溜めて一気、感情も一気に出す。熱量が分かりやすいタイプ。" },
      { name: "情報収集ガチ推しモビー", img: "16stan/img/情報収集ガチ推しモビー.jpg", cat: "stan", summary: "出演・記事・データまで拾い、全体像を掴む。", catch: "週末に集めて、界隈の検索窓になる。情報の質が高いタイプ。" },
      { name: "ガチ分析推しモビー", img: "16stan/img/ガチ分析推しモビー.jpg", cat: "stan", summary: "歌・演技・プレーの型や伸びを読み、言語化できる。", catch: "静かに見て、構造で推しを語れる。研究者タイプ。" },
      { name: "箱ごと見守り推しモビー", img: "16stan/img/箱ごと見守り推しモビー.jpg", cat: "stan", summary: "作品・チーム・世界観・界隈まで含めて長い物語として愛する。", catch: "週末に静かに、箱の未来を見届ける。やさしくて大人なタイプ。" },
      // Love (メンヘラ) (16)
      { name: "余裕ぶっこきモビー", img: "16love/img/余裕ぶっこきモビー.jpg", cat: "love", summary: "好きでも自分のペースを崩さず、恋愛でメンタルを保てるタイプ。", catch: "好きでも追わない。メンタル鉄壁の恋愛強者。" },
      { name: "メンタル紙モビー", img: "16love/img/メンタル紙モビー.jpg", cat: "love", summary: "外では平静でも、内心は繊細で返信一つに揺れやすいタイプ。", catch: "表には出さないけど、内心メンタル紙。すぐ破れる。" },
      { name: "病みスト即消しモビー", img: "16love/img/病みスト即消しモビー.jpg", cat: "love", summary: "勢いで感情を出すが、切り替えが早く立て直せるタイプ。", catch: "病みスト上げて3分で消す。そしてケロッとしてる。" },
      { name: "黒背景ポエムモビー", img: "16love/img/黒背景ポエムモビー.jpg", cat: "love", summary: "恋の痛みを言葉にする才能が高い、感受性強めのタイプ。", catch: "恋の痛みは黒背景に白文字で綴る。退廃系の詩人。" },
      { name: "即レス命モビー", img: "16love/img/即レス命モビー.jpg", cat: "love", summary: "返信速度を大切にしつつ、恋愛バランスも取れるタイプ。", catch: "既読？即レス。返信速度が愛の証。" },
      { name: "返信こないと死モビー", img: "16love/img/返信こないと死モビー.jpg", cat: "love", summary: "返信待ちで不安が膨らみやすい、繊細で一途なタイプ。", catch: "返信が来ない。もう死ぬ。…って本気で思ってる。" },
      { name: "量産型メンヘラモビー", img: "16love/img/量産型メンヘラモビー.jpg", cat: "love", summary: "感情表現が素直で、落ち込んでも回復が早いタイプ。", catch: "量産型の見た目に量産型のメンヘラ。でも回復は早い。" },
      { name: "共依存沼モビー", img: "16love/img/共依存沼モビー.jpg", cat: "love", summary: "相手を想う気持ちが強く、関係にのめり込みやすいタイプ。", catch: "お互いに依存しあって、離れられない共依存沼。" },
      { name: "情緒ジェットコースターモビー", img: "16love/img/情緒ジェットコースターモビー.jpg", cat: "love", summary: "感情の波が激しいが、自己回復力も高いタイプ。", catch: "情緒の上下が激しすぎて自分でも追いつけない。" },
      { name: "闇堕ちモビー", img: "16love/img/闇堕ちモビー.jpg", cat: "love", summary: "不安が高まると距離を取りがちで、抱え込みやすいタイプ。", catch: "好きになると闇堕ち。黙って消える系メンヘラ。" },
      { name: "メンヘラ発動モビー", img: "16love/img/メンヘラ発動モビー.jpg", cat: "love", summary: "恋で衝動的になりやすいが、戻りも早いタイプ。", catch: "恋するとメンヘラ発動。でもすぐ正気に戻る。" },
      { name: "好きすぎて滅モビー", img: "16love/img/好きすぎて滅モビー.jpg", cat: "love", summary: "好きな相手に全力になり、生活まで影響しやすいタイプ。", catch: "好きすぎて自分が滅ぶ。一途が行きすぎた結果。" },
      { name: "独占欲バグモビー", img: "16love/img/独占欲バグモビー.jpg", cat: "love", summary: "好きな人を強く求める反面、切り替えもできるタイプ。", catch: "独占欲がバグってる。彼の全部が欲しい。" },
      { name: "イカ焼きモビー", img: "16love/img/イカ焼きモビー.jpg", cat: "love", summary: "痛みを内側に抱え込みやすい、我慢強く繊細なタイプ。", catch: "全部内側で抱え込む。腕には絆創膏。痛みは見せない。" },
      { name: "情緒バグモビー", img: "16love/img/情緒バグモビー.jpg", cat: "love", summary: "感情の切替が激しく、共感で回復するタイプ。", catch: "情緒がバグりすぎ。泣いて怒って笑って、全部同時。" },
      { name: "恋愛ゾンビモビー", img: "16love/img/恋愛ゾンビモビー.jpg", cat: "love", summary: "何度沈んでも立ち上がる、不死身の恋愛タイプ。", catch: "何度沈んでも這い上がる。恋愛ゾンビ、不死身のメンヘラ。" },
    ];
  const categories = [
      { key: "all", label: "📋 一覧", color: "#6b7280" },
      { key: "school_m", label: "🏫 学校♂", color: "#4a90d9" },
      { key: "school_f", label: "🏫 学校♀", color: "#e9748d" },
      { key: "mama", label: "👩 ママ", color: "#e8a0bf" },
      { key: "night", label: "🌙 夜職", color: "#c9a050" },
      { key: "stan", label: "🎤 推し活", color: "#9b6dff" },
      { key: "love", label: "💜 メンヘラ", color: "#b86cff" },
    ];

  const themeDefinitions = {
    school_m: { key: 'school_relations', label: '学校人間関係編', bannerLabel: 'School Relations', accent: '#4a90d9' },
    school_f: { key: 'school_relations', label: '学校人間関係編', bannerLabel: 'School Relations', accent: '#e9748d' },
    mama: { key: 'family_truth', label: '家庭と伴走編', bannerLabel: 'Family Truth', accent: '#e8a0bf' },
    night: { key: 'midnight_truth', label: '深夜編', bannerLabel: 'Midnight Truth', accent: '#c9a050' },
    stan: { key: 'approval_desire', label: '承認欲求編', bannerLabel: 'Approval Desire', accent: '#9b6dff' },
    love: { key: 'love_truth', label: 'シークレット', bannerLabel: 'MOBBY CAPSULE', accent: '#b86cff' },
  };

  const rarityDefinitions = {
    N: {
      key: 'N',
      label: 'N',
      frame: '表の顔',
      accent: '#8a7a6a',
      cardTitle: '表の顔カード',
      lineText: (character) => character.catch || character.summary,
      detailText: (character) => `${character.summary} 表に出る温度感が強めの1枚。`,
    },
    R: {
      key: 'R',
      label: 'R',
      frame: '裏の顔',
      accent: '#ef8a34',
      cardTitle: '裏の顔カード',
      lineText: (character) => `${character.name}の裏本音: ${character.summary}`,
      detailText: (character) => `${character.catch} もう一歩踏み込んだ本音が見える中核レア。`,
    },
    SSR: {
      key: 'SSR',
      label: 'SSR',
      frame: '本音暴露MAX',
      accent: '#ff5d8f',
      cardTitle: '本音暴露MAX',
      lineText: (character) => `暴露MAX: ${character.catch}`,
      detailText: (character) => `${character.summary} 最も刺さる言葉として見せる共有向けカード。`,
    },
  };

  function buildGachaImageUrl(character, index) {
    const extensionMatch = /\.[a-zA-Z0-9]+$/.exec(character.img || '');
    const extension = extensionMatch ? extensionMatch[0].toLowerCase() : '.jpg';
    return `gacha/assets/cards/character_${String(index + 1).padStart(3, '0')}${extension}`;
  }

  const characters = rawCharacters.map((character, index) => {
    const category = categories.find((item) => item.key === character.cat) || { key: character.cat, label: 'MOBBY', color: '#6b7280' };
    const theme = themeDefinitions[character.cat] || { key: 'misc', label: 'モビー編', bannerLabel: 'Mobby', accent: category.color };
    return {
      id: `character_${String(index + 1).padStart(3, '0')}`,
      code: `MOBBY_${String(index + 1).padStart(3, '0')}`,
      name: character.name,
      cat: character.cat,
      categoryLabel: category.label,
      categoryColor: category.color,
      themeKey: theme.key,
      themeLabel: theme.label,
      themeBannerLabel: theme.bannerLabel,
      themeAccent: theme.accent,
      summary: character.summary,
      catch: character.catch,
      imageUrl: buildGachaImageUrl(character, index),
      releaseStatus: 'released',
    };
  });

  const cards = characters.flatMap((character) => {
    return Object.values(rarityDefinitions).map((rarity) => ({
      id: `${character.id}_${rarity.key}`,
      characterId: character.id,
      rarity: rarity.key,
      title: `${character.name} ${rarity.cardTitle}`,
      lineText: rarity.lineText(character),
      detailText: rarity.detailText(character),
      imageUrl: character.imageUrl,
      themeKey: character.themeKey,
      themeLabel: character.themeLabel,
      accent: rarity.accent,
      releaseStatus: 'released',
    }));
  });

  const starterBannerCharacterIds = characters.map((character) => character.id);

  const starterPool = cards;

  const banners = [
    {
      id: 'love_truth_mvp',
      bannerType: 'standard',
      name: 'シークレットガチャ',
      description: '5つの診断ぜんぶからモビーを引けるガチャ。',
      themeKey: 'all_mobby',
      themeLabel: 'オールスター',
      startsAt: null,
      endsAt: null,
      isActive: true,
      poolCardIds: starterPool.map((card) => card.id),
      characterIds: starterBannerCharacterIds,
      paidRates: { N: 0.82, R: 0.15, SSR: 0.03 },
      freeRates: { N: 0.92, R: 0.075, SSR: 0.005 },
      guarantees: { tenPullRPlus: true },
      focusThresholds: { R: 30, SSR: 80 },
      notes: [
        '5つの診断・96キャラ・288カードを封入',
        '無料デイリーはSSRを抑えた体験率に設定',
        'Focus / 毒片 / 課金商品は次段階のため未実装',
      ],
    },
  ];

  const adoptionNotes = {
    adopted: [
      '専用フォルダへの独立実装',
      '96キャラ / 288カードのデータモデル分離',
      '36枚箱のMVPバナー',
      'N / R / SSR のレア度設計',
      '無料デイリー1回と通常抽選の率差分',
      'ローカル保存によるコレクション進捗表示',
      'バナー詳細に排出率と封入カード一覧を表示',
    ],
    deferred: [
      '認証、課金、サーバー抽選',
      'Focusポイントと交換所',
      '毒片、ダブり変換の経済設計',
      '管理画面、分析イベント、Webhook',
      '診断結果保存からの自動連動',
    ],
  };

  const stats = {
    characterCount: characters.length,
    cardCount: cards.length,
    activeBannerCardCount: starterPool.length,
  };

  window.MOBBY_GACHA_DATA = {
    characters,
    categories,
    cards,
    banners,
    rarityDefinitions,
    themeDefinitions,
    adoptionNotes,
    stats,
  };
})();