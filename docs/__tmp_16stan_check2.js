
        async function submitLead(p) { try { const r = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || "送信失敗"); return d; } catch (e) { console.error("[Stan] Lead error:", e); throw e; } }
        async function submitDiagnosis(p) { try { const r = await fetch("/api/diagnosis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || "保存失敗"); return d; } catch (e) { console.error("[Stan] Diag error:", e); throw e; } }
        const AXES = { A: { key: "A", name: "追い方", left: "日常派", right: "まとめ派", leftCode: "こ", rightCode: "ま" }, B: { key: "B", name: "接点", left: "現場派", right: "在宅派", leftCode: "な", rightCode: "う" }, C: { key: "C", name: "関わり方", left: "発信派", right: "静観派", leftCode: "は", rightCode: "し" }, D: { key: "D", name: "焦点", left: "単体派", right: "周辺派", leftCode: "ひ", rightCode: "み" } };
        const QUESTIONS = [
            { id: "A1", axis: "A", text: "新情報が出ると、なるべく早く確認する。", reverse: false }, { id: "A2", axis: "A", text: "推し関連の通知は、基本オンにしている。", reverse: false }, { id: "A3", axis: "A", text: "忙しい日でも、数分でも推しに触れる時間を作る。", reverse: false }, { id: "A4", axis: "A", text: "推しの情報収集は、ほぼ毎日の習慣だ。", reverse: false }, { id: "A5", axis: "A", text: "推し活は、生活の中に自然に組み込まれている。", reverse: false },
            { id: "A6", axis: "A", text: "配信・放送・試合は、リアタイよりアーカイブで追うことが多い。", reverse: true }, { id: "A7", axis: "A", text: "応援の熱量は、普段よりイベント期に一気に上がりやすい。", reverse: true }, { id: "A8", axis: "A", text: "過去コンテンツは、まとまった休みにまとめて消化する。", reverse: true }, { id: "A9", axis: "A", text: "推し活の予定は、直前に決めることが多い。", reverse: true }, { id: "A10", axis: "A", text: "推しの動きが多い時は、優先度を決めて追う。", reverse: true },
            { id: "B1", axis: "B", text: "行ける状況なら、現場（ライブ・イベント・試合など）に足を運びたい。", reverse: false }, { id: "B2", axis: "B", text: "推しの良さは、その場の熱や空気で増すと思う。", reverse: false }, { id: "B3", axis: "B", text: "応援の満足感は、同じ空間にいることで大きくなる。", reverse: false }, { id: "B4", axis: "B", text: "現場の音・歓声・空気感は、推し活に欠かせない。", reverse: false }, { id: "B5", axis: "B", text: "推し活では、快適さより臨場感を優先したい。", reverse: false },
            { id: "B6", axis: "B", text: "推しの良さは、落ち着いた環境でじっくり見る方が引き出せると思う。", reverse: true }, { id: "B7", axis: "B", text: "推し活は、移動や待ち時間が少ない方が満足度が上がる。", reverse: true }, { id: "B8", axis: "B", text: "推し活は、自分のペースで楽しめることが一番大事だ。", reverse: true }, { id: "B9", axis: "B", text: "推し活は、在宅中心で環境を整える方がしっくりくる。", reverse: true }, { id: "B10", axis: "B", text: "推しは、生で見なくても配信や映像で十分満足できる。", reverse: true },
            { id: "C1", axis: "C", text: "推し活の感想は、SNSなどに投稿したくなる。", reverse: false }, { id: "C2", axis: "C", text: "いいね・コメント・投票などの反応は、こまめにする方だ。", reverse: false }, { id: "C3", axis: "C", text: "推しの良さを言葉で語るのが好きだ。", reverse: false }, { id: "C4", axis: "C", text: "推し活の記録は、人に見える形で残すことが多い。", reverse: false }, { id: "C5", axis: "C", text: "推しを応援する気持ちは、見える形で示したい。", reverse: false },
            { id: "C6", axis: "C", text: "推し活の感想は、自分の中で味わっておきたい。", reverse: true }, { id: "C7", axis: "C", text: "界隈の情報交換は、参加するより眺める方が心地いい。", reverse: true }, { id: "C8", axis: "C", text: "推しの話題が出ても、自分からはあまり話さず聞き役になりがちだ。", reverse: true }, { id: "C9", axis: "C", text: "推し活では、熱を外に出すより守ることが大事だと思う。", reverse: true }, { id: "C10", axis: "C", text: "SNSは距離を取りつつ、必要な時だけ使いたい。", reverse: true },
            { id: "D1", axis: "D", text: "推し活の関心の中心は、基本的に推し本人だ。", reverse: false }, { id: "D2", axis: "D", text: "推し以外のメンバー／登場人物は、必要な分だけ追えば十分だと思う。", reverse: false }, { id: "D3", axis: "D", text: "公式の動きで一番嬉しいのは、推しが目立つ瞬間だ。", reverse: false }, { id: "D4", axis: "D", text: "現場や配信は、推しのパートを最優先で追う。", reverse: false }, { id: "D5", axis: "D", text: "理想の推し活は、一点集中で深掘りすることだ。", reverse: false },
            { id: "D6", axis: "D", text: "推しは入口で、グループ／作品全体も自然に好きになりやすい。", reverse: true }, { id: "D7", axis: "D", text: "推しの関係性や共演者も含めて味わう方が楽しい。", reverse: true }, { id: "D8", axis: "D", text: "推し活の楽しさは、世界観や物語にもあると思う。", reverse: true }, { id: "D9", axis: "D", text: "周辺文化（用語・歴史・界隈ネタなど）を知るほど楽しい。", reverse: true }, { id: "D10", axis: "D", text: "応援の対象は、推しの成長だけでなく全体の成功にも向く。", reverse: true }
        ];
        const CH = {
            "こなはひ": {
                name: "現場至上主義推しモビー",
                displayName: "現場至上主義モビー",
                catch: "「最前線で推しを上げる、現場エンジン。」",
                hook: "現場の熱を取りに行き、そのまま推しの勢いに変える。",
                confidence: "「行けた回数じゃなく、“その場で燃やした熱”があなたの証明。」",
                title: "最前線の現場エンジン",
                priority: "推しの“今この瞬間”を体で受け取って、熱をその場で肯定すること。",
                core: "“今この瞬間”の推しを取り逃さない。体験で愛を証明する。",
                strengths: [
                    "行動が早く、チャンスを逃しにくい。現場の空気を掴んで熱量を一気に上げられる。",
                    "“今の推し”の強さを体験ベースで語れるから、言葉がまっすぐ刺さる。",
                    "あなたの存在そのものが「推しは今熱い」を周りに伝える合図になる。"
                ],
                arena: "ライブ・舞台・現場／遠征・当落・物販の最前線",
                proof: "現場参加・全身で沸く・現地で回収した熱を短く残す"
            },
            "こなはみ": {
                name: "箱推し熱心モビー",
                displayName: "箱推し熱心モビー",
                catch: "「箱の熱を回して育てる、循環メーカー。」",
                hook: "推しも周辺もまとめて愛してムードを作る。",
                confidence: "「好きの範囲が広いのは才能。あなたは熱を“循環”させる人。」",
                title: "箱の循環メーカー",
                priority: "推しと周辺の魅力を循環させて、箱の世界をみんなで強くすること。",
                core: "推し単体だけじゃなく、箱・作品・界隈ごと“好き”を循環させる。",
                strengths: [
                    "推しだけでなく周辺ごと楽しめるので幸福度が高く、熱が長持ちする。",
                    "人を巻き込みすぎずに輪を作れるタイプで、界隈のムードを整えられる。",
                    "箱全体の“いい空気”を育てられるから、推しの未来が伸びやすい。"
                ],
                arena: "現場＋TL＋コミュニティ（オフ会/スペース/グループ）",
                proof: "箱全体を褒める・紹介する・盛り上げ役を担う"
            },
            "こなしひ": {
                name: "ソロ神聖視推しモビー",
                displayName: "ソロ神聖視モビー",
                catch: "「静かに守って、深く推す。」",
                hook: "騒がず、比較せず、推しの尊さを自分の中で保つ。",
                confidence: "「静かでも本気は伝わる。あなたの推し方は“守る強さ”。」",
                title: "聖域キーパー",
                priority: "雑音や比較から距離を取り、推しの尊さを静かに守り続けること。",
                core: "雑音より尊さ。推しの“聖域”を丁寧に守る。",
                strengths: [
                    "比較やノイズに流されず、推しへの集中が深い。推し体験を自分の中で丁寧に育てられる。",
                    "ブレにくいから、熱が一過性にならず“長く強い”推し方になりやすい。",
                    "静かな一貫性が、推しをいちばん安全な場所で支えている。"
                ],
                arena: "自分の部屋・自分のペース／厳選した安全な場所",
                proof: "静かに継続・比較しない・尊さを守る選択をする"
            },
            "こなしみ": {
                name: "作品反復推しモビー",
                displayName: "作品反復推しモビー",
                catch: "「余韻で世界観を染み込ませる。」",
                hook: "推し＋作品＋空気を反芻して理解を深める。",
                confidence: "「余韻が残るのは、ちゃんと届いてる証拠。あなたは深く味わえる人。」",
                title: "余韻職人",
                priority: "体験を反芻して深め、推しの世界観を自分の中に育てること。",
                core: "一回で終わらせない。味わい直して“深さ”を育てる。",
                strengths: [
                    "空気・演出・文脈を拾うのが上手く、体験の解像度が高い。",
                    "反芻して味わい直せるから、余韻が資産になって推し活が豊かになる。",
                    "あなたの「もう一回見る」が、推しの価値を何度でも更新する。"
                ],
                arena: "配信・円盤・プレイリスト・感想ノート（反芻空間）",
                proof: "同じ回を噛みしめる・印象的な台詞/演出を残す"
            },
            "こうはひ": {
                name: "リアクション職人推しモビー",
                displayName: "即レスサポーターモビー",
                catch: "「反応で支える、在宅サポーター。」",
                hook: "供給を拾って、反応の積み上げで推しを押し上げる。",
                confidence: "「小さな反応の積み上げが、推しを確実に支えてる。」",
                title: "在宅サポーター",
                priority: "小さな反応を積み上げて、推しを日々“支えている実感”を作ること。",
                core: "反応は応援の形。小さくても継続で効く。",
                strengths: [
                    "供給を拾うアンテナが強く、反応の継続で推しを確実に支えられる。",
                    "在宅でも熱量が落ちにくく、積み上げ型の応援が得意。",
                    "あなたの“いつもの反応”が、推し側にも界隈にも安心を作る。"
                ],
                arena: "TL・公式通知・配信コメント欄",
                proof: "いいね/RT/コメント/投票を積み上げる"
            },
            "こうはみ": {
                name: "布教うまい推しモビー",
                displayName: "沼案内人モビー",
                catch: "「沼の入口を作る、案内人。」",
                hook: "相手に合わせて“刺さる一本”を渡せる。",
                confidence: "「あなたの言葉が、誰かの“推し始め”になる。」",
                title: "沼の案内人",
                priority: "推しの良さを相手に合う形で渡し、好きの入口を増やすこと。",
                core: "好きは広げられる。入口を作って推しの世界を増やす。",
                strengths: [
                    "魅力を短く翻訳するのが上手く、相手に刺さる入口を作れる。",
                    "“おすすめ3本”みたいに導線を整えられるので、新規が入りやすい。",
                    "あなたの紹介は押し付けじゃなく、「好きの扉」をそっと開けられる。"
                ],
                arena: "SNS投稿・まとめスレ・布教用プレイリスト/リンク集",
                proof: "おすすめ3本を渡す・相手に合わせて紹介する"
            },
            "こうしひ": {
                name: "やさしい見守り推しモビー",
                displayName: "優しい見守りモビー",
                catch: "「推しにも自分にも優しい、長期運用。」",
                hook: "距離感を守り、健全に長く推す。",
                confidence: "「守れる人がいるから、推しは安心して走れる。」",
                title: "やさしい護衛",
                priority: "推しの心身と安全を守りながら、無理なく長く応援を続けること。",
                core: "推しの心身と安全が最優先。続けられる応援が正義。",
                strengths: [
                    "距離感が上手く、推しにも自分にも無理をさせない。だから長期で安定して推せる。",
                    "炎上やノイズに巻き込まれにくく、心の消耗を最小化できる。",
                    "落ち着いた応援が、推しの活動を“続けやすい空気”に変える。"
                ],
                arena: "公式発表・配信・静かな応援導線（購買/視聴/投票）",
                proof: "無理しない継続・炎上に触れない・安心を守る"
            },
            "こうしみ": {
                name: "尊い記録係推しモビー",
                displayName: "記録係モビー",
                catch: "「尊さを残して守る、保存のプロ。」",
                hook: "スクショ・メモ・日記で推しを資産化する。",
                confidence: "「残した記録は、未来のあなたを救う“推し資産”。」",
                title: "アーカイブ職人",
                priority: "尊い瞬間を残して、未来の自分に渡せる“推し資産”にすること。",
                core: "記録は愛。あとで自分を救う“推し資産”を作る。",
                strengths: [
                    "尊さを言語化・整理して残せる。記録が“推し資産”になって後から自分を救う。",
                    "まとめの精度が高く、神回や名場面の価値を逃さない。",
                    "残してくれたものが、後から見た誰かの心まで救うことがある。"
                ],
                arena: "スクショフォルダ・メモ/日記・まとめノート",
                proof: "尊い瞬間を残す・神回を整理して保管する"
            },
            "まなはひ": {
                name: "ご褒美課金推しモビー",
                displayName: "勝負所全力投下モビー",
                catch: "「節目で全部出す、メリハリ型。」",
                hook: "普段は抑え、ここぞで一気に熱を投下する。",
                confidence: "「全部を追わないから、勝負所でちゃんと強い。」",
                title: "メリハリ全力",
                priority: "節目に力を集中して、後悔のない“最高の一回”を取りに行くこと。",
                core: "全部を追わないから、勝負所で最大の満足を取れる。",
                strengths: [
                    "普段は抑えて、節目で最大火力を出せる“配分の強さ”がある。",
                    "判断が速く、ここぞの満足度が高い思い出を作れる。",
                    "あなたの全力は点ではなく、推しの物語に残る“節目の光”になる。"
                ],
                arena: "周年・ツアー・誕生日・大舞台（節目イベント）",
                proof: "節目で現場/課金/応援を集中投下する"
            },
            "まなはみ": {
                name: "まとめ読み推しモビー",
                displayName: "情報整理モビー",
                catch: "「追うより整える、週末まとめ役。」",
                hook: "情報を“追える形”にして幸福度を上げる。",
                confidence: "「追えない日があっても大丈夫。あなたは“整えて続ける”人。」",
                title: "週末まとめ役",
                priority: "情報に溺れず、良さを整理して“続けられる推し活”に整えること。",
                core: "過多に溺れない。必要な良さを拾って整理して残す。",
                strengths: [
                    "情報を“追える形”に整えられるから、過多に溺れず続けられる。",
                    "要点を抜くのが上手く、今週の良さを短くまとめて残せる。",
                    "あなたが整えた道筋が、推し活を「長く楽しい」に変えてくれる。"
                ],
                arena: "週末のまとめ時間・メモ・リンク集・スプレッドシート",
                proof: "今週の良かった点3つ・リンクまとめ・要点整理"
            },
            "まなしひ": {
                name: "1コンテンツ一点突破推しモビー",
                displayName: "最重要一転突破モビー",
                catch: "「全部じゃない。“ここだけは絶対”。」",
                hook: "一点に全集中して最大満足を取りに行く。",
                confidence: "「一点に絞れるのは弱さじゃない。“芯がある”ってこと。」",
                title: "一点突破型",
                priority: "本当に大事な一点を選び抜き、濃い満足を取り切ること。",
                core: "選ぶことは弱さじゃない。集中で愛を濃くする。",
                strengths: [
                    "優先順位が明確で迷いが少ない。集中した時の満足度がとにかく高い。",
                    "一点に力を集められるから、推し活の質が濃くなる。",
                    "選び抜いた一点への熱は、薄まらない分だけ強く響く。"
                ],
                arena: "ライブだけ・試合だけ等の“最重要コンテンツ”一点",
                proof: "一点に全集中・代替（配信/アーカイブ）も確保する"
            },
            "まなしみ": {
                name: "成長見守り推しモビー",
                displayName: "成長見守りモビー",
                catch: "「物語で泣ける、長期見届け人。」",
                hook: "節目で会って、変化をゆっくり味わう。",
                confidence: "「成長を見届けられる人は、推しの物語の一部になれる。」",
                title: "長期見届け人",
                priority: "推しの変化と成長を長期で見届け、物語として愛すること。",
                core: "派手さより積み重ね。成長の軌跡を愛する。",
                strengths: [
                    "長期目線でブレにくく、一喜一憂しすぎない安定感がある。",
                    "変化や成長を拾うのが上手く、推しの物語を深く味わえる。",
                    "あなたが見てきた時間そのものが、推しへのいちばんの賛辞になる。"
                ],
                arena: "節目の現場＋年表/ログ（過去→現在の変化を見る場所）",
                proof: "成長ポイントを記録・語る／節目で会いに行く"
            },
            "まうはひ": {
                name: "一気見感想投下推しモビー",
                displayName: "感情投下モビー",
                catch: "「溜めて一気に燃やす、感情投下。」",
                hook: "まとめ視聴→刺さった熱を言葉で爆発させる。",
                confidence: "「刺さった熱を言葉にできるのは才能。あなたの感想が火種になる。」",
                title: "感情投下型",
                priority: "刺さった熱を言葉にして返し、好きの火を大きくすること。",
                core: "熱は鮮度。刺さった瞬間の“本音”を推しに返す。",
                strengths: [
                    "刺さった熱を言葉にする力が強く、感想がそのまま推しの追い風になる。",
                    "まとめ視聴で理解が深まり、感情が新鮮なまま伝えられる。",
                    "あなたの“火のついた言葉”が、誰かの好きも一緒に燃やす。"
                ],
                arena: "一気見タイム・感想投稿・感情が爆発する夜",
                proof: "まとめ視聴→刺さった感想を投下する（短文→追記）"
            },
            "まうはみ": {
                name: "情報収集ガチ推しモビー",
                displayName: "情報収集ガチモビー",
                catch: "「界隈の検索窓、情報ハンター。」",
                hook: "出演・記事・背景まで拾って全体像を掴む。",
                confidence: "「あなたが拾った情報が、界隈の安心になる。」",
                title: "情報ハンター",
                priority: "抜けなく知って安心を作り、推しを理解して支えること。",
                core: "知ることは支えること。抜けなく拾って安心を作る。",
                strengths: [
                    "取りこぼしが少なく、一次情報に強い。情報の精度が高いので安心を作れる。",
                    "背景まで拾えるから、推しの全体像を深く理解できる。",
                    "あなたの正確さが、界隈の不安を減らして推しを守る盾になる。"
                ],
                arena: "公式・一次情報・記事・出演表・検索",
                proof: "ソース付きで拾う／リンク＋一言で共有する"
            },
            "まうしひ": {
                name: "ガチ分析推しモビー",
                displayName: "ガチ分析モビー",
                catch: "「凄さを“構造”で語る、推し研究。」",
                hook: "技術や伸びを読み、言葉で価値を守る。",
                confidence: "「凄さを言語化できる人は、推しの価値を守れる。」",
                title: "推し研究者",
                priority: "推しの凄さを構造で捉えて言語化し、価値を守って伝えること。",
                core: "好きは深められる。理解と言語化で推しの強さを残す。",
                strengths: [
                    "推しの凄さを“構造”で説明できる。言語化の説得力が強い。",
                    "変化や伸びに敏感で、長期で楽しめる視点を持っている。",
                    "あなたの言葉が、推しの価値を「理解できる形」で未来に残す。"
                ],
                arena: "分析メモ・リプレイ・比較（成長/型/技術を見る場所）",
                proof: "良い点3つ→構造を1視点で語る／強みを1行で言い切る"
            },
            "まうしみ": {
                name: "箱ごと見守り推しモビー",
                displayName: "箱ごと見守りモビー",
                catch: "「箱の未来を愛する、長編推し。」",
                hook: "推しも作品もチームも、長い物語として抱きしめる。",
                confidence: "「世界ごと愛せるのは強さ。あなたは箱の“土台”になれる。」",
                title: "長編愛好家",
                priority: "推しを取り巻く世界ごと抱きしめ、箱の未来を静かに支えること。",
                core: "一人じゃなく“世界”を推す。続いていくことが尊い。",
                strengths: [
                    "推し単体ではなく世界ごと愛せるので、幸福度が安定しやすい。",
                    "俯瞰できてブレにくく、箱の“静かな土台”になれる。",
                    "あなたの落ち着いた温度が、箱の未来を支える持続力になる。"
                ],
                arena: "箱全体・作品世界・チームの流れ（週末に浸る場所）",
                proof: "箱の良さを一言残す／テーマを絞って長く追う"
            }
        };
        const STORAGE_KEY = "stan_char_diag_v1", PAGE_SIZE = 5;
        const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzu8ZWwvtKHWIwqnjqlKkdbPTWN1o7oSxpsBZ-Crdv6zlmCbSeWFlMDZ3sjU9SgCsFOgQ/exec";
        const state = { step: "intro", page: 0, answers: {}, questionOrder: null, profile: { name: "", email: "", age: "" }, sentToSheet: false };
        const ANS_LABEL = { 1: "そう思う", 2: "ややそう思う", 3: "少しそう思う", 4: "どちらでもない", 5: "少しそう思わない", 6: "ややそう思わない", 7: "そう思わない" };
        const SNS_IMAGE_PATHS = {
            "こうしひ": "img/sns/こうしひ.png",
            "こうしみ": "img/sns/こうしみ.png",
            "こうはひ": "img/sns/こうはひ.png",
            "こうはみ": "img/sns/こうはみ.png",
            "こなしひ": "img/sns/こなしひ.png",
            "こなしみ": "img/sns/こなしみ.png",
            "こなはひ": "img/sns/こなはひ.png",
            "こなはみ": "img/sns/こなはみ.png",
            "まうしひ": "img/sns/まうしひ.png",
            "まうしみ": "img/sns/まうしみ.png",
            "まうはひ": "img/sns/まうはひ.png",
            "まうはみ": "img/sns/まうはみ.png",
            "まなしひ": "img/sns/まなしひ.png",
            "まなしみ": "img/sns/まなしみ.png",
            "まなはひ": "img/sns/まなはひ.png",
            "まなはみ": "img/sns/まなはみ.png"
        };
        function shuffleArray(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
        function getQuestionOrder() { return shuffleArray([...Array(QUESTIONS.length).keys()]); }
        function loadState() { try { const s = localStorage.getItem(STORAGE_KEY); if (s) { const p = JSON.parse(s); Object.assign(state, p); } } catch (e) { } }
        function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
        function resetState() { state.step = "intro"; state.page = 0; state.answers = {}; state.questionOrder = null; state.profile = { name: "", email: "", age: "" }; state.sentToSheet = false; saveState(); }
        function computeResult() {
            const sums = { A: 0, B: 0, C: 0, D: 0 }, counts = { A: 0, B: 0, C: 0, D: 0 };
            QUESTIONS.forEach(q => { const v = state.answers[q.id]; if (v == null) return; let s = v; if (q.reverse) s = 8 - v; sums[q.axis] += s; counts[q.axis]++; });
            let code = ""; const pcts = {};
            ["A", "B", "C", "D"].forEach(k => { const avg = counts[k] ? sums[k] / counts[k] : 4; const pct = (avg - 1) / 6 * 100; pcts[k] = pct; code += pct <= 50 ? AXES[k].leftCode : AXES[k].rightCode; });
            return { code, pcts };
        }
        function getSnsImagePaths(code) {
            const png = SNS_IMAGE_PATHS[code];
            if (!png) return null;
            return { png };
        }
        function sanitizeDownloadName(name) {
            return (name || "mobby-result").replace(/[\\/:*?"<>|]/g, "_");
        }
        function isIOSLikeDevice() {
            return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        }
        function buildStripeSheetPayload(res, extraPayload = {}) {
            const questionAnswers = {};
            QUESTIONS.forEach(q => {
                if (state.answers[q.id]) questionAnswers[q.id] = state.answers[q.id];
            });
            let storageRaw = "";
            try {
                storageRaw = localStorage.getItem(STORAGE_KEY) || "";
            } catch (_) { }
            let stateSnapshot = null;
            try {
                stateSnapshot = JSON.parse(JSON.stringify(state));
            } catch (_) {
                stateSnapshot = state;
            }
            return {
                event: "stripe_click",
                source: "16stan",
                createdAt: new Date().toISOString(),
                pageUrl: window.location.href,
                userAgent: navigator.userAgent,
                name: state.profile?.name || "",
                age: state.profile?.age || "",
                email: state.profile?.email || "",
                type: res?.code || "",
                diagnosisName: res?.char ? (res.char.displayName || res.char.name || "") : "",
                axes: res?.pcts || {},
                answers: questionAnswers,
                storageKey: STORAGE_KEY,
                storageRaw,
                stateSnapshot,
                ...extraPayload
            };
        }
        function sendToGoogleSheet(payload) {
            if (!GAS_WEBAPP_URL) return;
            try {
                const body = JSON.stringify(payload);
                if (navigator.sendBeacon) {
                    const blob = new Blob([body], { type: "text/plain" });
                    navigator.sendBeacon(GAS_WEBAPP_URL, blob);
                    return;
                }
                fetch(GAS_WEBAPP_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "text/plain" },
                    body,
                    keepalive: true
                }).catch(() => { });
            } catch (_) { }
        }
        function updateNavActive() { document.getElementById("navDiagnosis").classList.toggle("active", state.step !== "characters"); document.getElementById("navCharacters").classList.toggle("active", state.step === "characters"); }
        function render() { window.scrollTo(0, 0); updateNavActive(); if (state.step === "intro") renderIntro(); else if (state.step === "quiz") renderQuiz(); else if (state.step === "gate") renderGate(); else if (state.step === "characters") renderCharacters(); else renderResult(); }
        function renderIntro() {
            const app = document.getElementById("app"); app.innerHTML = `
    <div class="panel fade-in" style="text-align:center;">
    <p class="kicker">推し活モビー診断</p>
    <h2 class="big">あなたの推し活スタイルは？</h2>
    <p class="text-body" style="max-width:500px;margin:0 auto 28px;">40問の質問に直感で答えるだけ！<br>あなたの推し活スタイルを16タイプから診断します✨<br><small style="color:var(--text-sub);">所要時間：約5分</small></p>
    <button class="primary" id="btnStart" style="font-size:16px;padding:14px 44px;">診断スタート ✨</button>
    </div>`;
            document.getElementById("btnStart").onclick = () => { state.step = "quiz"; state.page = 0; state.answers = {}; state.questionOrder = getQuestionOrder(); saveState(); render(); };
        }
        function renderQuiz() {
            const order = state.questionOrder || getQuestionOrder(); const total = order.length; const start = state.page * PAGE_SIZE; const end = Math.min(start + PAGE_SIZE, total); const pct = Math.round(start / total * 100); const app = document.getElementById("app");
            let html = `<div class="panel fade-in"><p class="kicker">質問に答えてください</p><div class="progress-wrap"><div class="progress-meta"><span>Question ${start + 1}-${end} / ${total}</span><span>${pct}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div>`;
            for (let i = start; i < end; i++) {
                const q = QUESTIONS[order[i]]; const sel = state.answers[q.id];
                html += `<div class="qCard"><p class="qText">${i + 1}. ${q.text}</p><div class="likert7"><div class="likert-labels"><span class="left">そう思う</span><span class="right">そう思わない</span></div><div class="likert-buttons">`;
                for (let v = 1; v <= 7; v++) {
                    const cls = v < 4 ? "left" : v === 4 ? "mid" : "right"; const ac = sel === v ? " selected" : "";
                    html += `<button class="likert-btn ${cls}${ac}" data-q="${q.id}" data-v="${v}" data-i="${v}"></button>`;
                }
                html += `</div></div></div>`;
            }
            const allAns = order.slice(start, end).every(i => state.answers[QUESTIONS[i].id] != null); const isLast = end >= total;
            html += `<div style="display:flex;justify-content:space-between;margin-top:20px;">`;
            if (state.page > 0) html += `<button id="btnPrev">← 前へ</button>`; else html += `<div></div>`;
            if (isLast) html += `<button class="primary" id="btnFinish" ${allAns ? "" : "disabled"}>結果を見る</button>`;
            else html += `<button class="primary" id="btnNext" ${allAns ? "" : "disabled"}>次へ →</button>`;
            html += `</div></div>`; app.innerHTML = html;
            app.querySelectorAll(".likert-btn").forEach(btn => {
                btn.onclick = () => {
                    const qid = btn.dataset.q, val = parseInt(btn.dataset.v); state.answers[qid] = val; saveState();
                    btn.closest(".likert-buttons").querySelectorAll(".likert-btn").forEach(b => b.classList.remove("selected")); btn.classList.add("selected");
                    const allNow = order.slice(start, end).every(i => state.answers[QUESTIONS[i].id] != null); const nb = document.getElementById("btnNext") || document.getElementById("btnFinish"); if (nb) nb.disabled = !allNow;
                };
            });
            const prevBtn = document.getElementById("btnPrev"); if (prevBtn) prevBtn.onclick = () => { state.page--; saveState(); render(); };
            const nextBtn = document.getElementById("btnNext"); if (nextBtn) nextBtn.onclick = () => { state.page++; saveState(); render(); };
            const finBtn = document.getElementById("btnFinish"); if (finBtn) finBtn.onclick = () => { state.step = "gate"; saveState(); render(); };
        }
        function renderGate() {
            const app = document.getElementById("app"); app.innerHTML = `
    <div class="panel fade-in" style="text-align:center;">
    <p class="kicker">あと少し！</p>
    <h2 class="big">結果を受け取る</h2>
    <p class="text-body" style="margin-bottom:24px;">以下を入力すると結果が表示されます。</p>
    <div style="max-width:360px;margin:0 auto;text-align:left;">
    <div style="font-size:12px;color:var(--text-sub);margin-bottom:6px;">ニックネーム（必須）</div>
    <input id="inName" placeholder="例）はるか" value="${state.profile.name}" style="width:100%;padding:12px 16px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:15px;margin-bottom:12px;font-family:var(--font-main);box-sizing:border-box;">
    <div style="font-size:12px;color:var(--text-sub);margin-bottom:6px;">年齢（必須）</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
    <button type="button" class="age-btn" data-age="~14" style="padding:8px 14px;border-radius:10px;border:2px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:13px;cursor:pointer;transition:all 0.2s;">14歳以下</button>
    <button type="button" class="age-btn" data-age="15-17" style="padding:8px 14px;border-radius:10px;border:2px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:13px;cursor:pointer;transition:all 0.2s;">15〜17歳</button>
    <button type="button" class="age-btn" data-age="18-19" style="padding:8px 14px;border-radius:10px;border:2px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:13px;cursor:pointer;transition:all 0.2s;">18〜19歳</button>
    <button type="button" class="age-btn" data-age="20-24" style="padding:8px 14px;border-radius:10px;border:2px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:13px;cursor:pointer;transition:all 0.2s;">20〜24歳</button>
    <button type="button" class="age-btn" data-age="25-29" style="padding:8px 14px;border-radius:10px;border:2px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:13px;cursor:pointer;transition:all 0.2s;">25〜29歳</button>
    <button type="button" class="age-btn" data-age="30-39" style="padding:8px 14px;border-radius:10px;border:2px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:13px;cursor:pointer;transition:all 0.2s;">30代</button>
    <button type="button" class="age-btn" data-age="40+" style="padding:8px 14px;border-radius:10px;border:2px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:13px;cursor:pointer;transition:all 0.2s;">40歳以上</button>
    </div>
    <input type="hidden" id="inAge" value="${state.profile.age || ''}">
    <div style="font-size:12px;color:var(--text-sub);margin-bottom:6px;">メールアドレス（必須）</div>
    <input id="inEmail" type="email" placeholder="example@gmail.com" value="${state.profile.email}" style="width:100%;padding:12px 16px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:15px;margin-bottom:20px;font-family:var(--font-main);box-sizing:border-box;">
    <button class="primary" id="btnResult" style="width:100%;font-size:16px;padding:14px;">結果を見る ✨</button>
    </div><p id="gateError" style="color:var(--danger);font-size:13px;margin-top:12px;text-align:center;"></p>
    </div>`;
            const ageEl = document.getElementById("inAge");
            document.querySelectorAll(".age-btn").forEach(btn => {
                if (btn.dataset.age === ageEl.value) { btn.style.background = "var(--accent)"; btn.style.borderColor = "var(--accent)"; btn.style.color = "#fff"; }
                btn.onclick = () => {
                    document.querySelectorAll(".age-btn").forEach(b => { b.style.background = "var(--surface2)"; b.style.borderColor = "var(--line)"; b.style.color = "var(--text-main)"; });
                    btn.style.background = "var(--accent)"; btn.style.borderColor = "var(--accent)"; btn.style.color = "#fff";
                    ageEl.value = btn.dataset.age;
                };
            });
            document.getElementById("btnResult").onclick = async () => {
                const name = document.getElementById("inName").value.trim(); const email = document.getElementById("inEmail").value.trim(); const age = document.getElementById("inAge").value; const err = document.getElementById("gateError");
                if (!name) { err.textContent = "ニックネームを入力してください"; return; }
                if (!age) { err.textContent = "年齢を選択してください"; return; }
                if (!email || !email.includes("@")) { err.textContent = "メールアドレスを入力してください"; return; }
                state.profile = { name, email, age }; const { code, pcts } = computeResult(); const ch = CH[code]; state.step = "result"; saveState();
                const roundedAxes = {};["A", "B", "C", "D"].forEach(k => { roundedAxes[k] = Math.round(pcts[k]); });
                try { await submitLead({ name, email, age, type: code, source: "16stan" }); await submitDiagnosis({ name, email, age, type: code, axes: roundedAxes, answers: state.answers, source: "16stan", createdAt: new Date().toISOString(), diagnosis_type: ch ? (ch.displayName || ch.name) : code }); } catch (e) { console.error(e); } render();
            };
        }
        function renderResult() {
            const { code, pcts } = computeResult(); const ch = CH[code]; if (!ch) { renderIntro(); return; } const app = document.getElementById("app");
            const displayName = ch.displayName || ch.name;
            const imgPath = `img/${ch.name}.jpg`;
            const keyImageFrontPath = `img/key/${ch.name}.png`;
            const keyImageFrontWebpPath = `img/key/${ch.name}.webp`;
            const keyImageBackPath = "img/key/ura.jpg";
            const keyImageBackWebpPath = "img/key/ura.webp";
            const snsImagePaths = getSnsImagePaths(code);
            let html = `<div class="fade-in"><div class="panel result-hero">
    <p class="kicker">あなたの推し活タイプは…</p>
    <h2 class="big" style="font-size:28px;">🎤 ${displayName}</h2>
    <p style="font-family:monospace;color:var(--text-sub);font-size:13px;margin-bottom:16px;">${code}</p>
    <div class="char-image-placeholder"><img src="${imgPath}" alt="${displayName}" onerror="this.parentElement.innerHTML='Image coming soon'"></div>
    <p style="font-size:18px;font-weight:600;color:var(--accent);margin:16px 0 8px;">${ch.catch}</p>
    <p class="text-body" style="max-width:560px;margin:0 auto;">${ch.hook}</p>
    </div>
    <div class="panel"><h3 style="margin:0 0 20px;">📊 あなたの4軸バランス</h3>`;
            ["A", "B", "C", "D"].forEach(k => {
                const ax = AXES[k]; const p = pcts[k];
                html += `<div class="axis-row"><span class="axis-name">${ax.name}</span><div class="axis-labels"><span>${ax.left}</span><span>${ax.right}</span></div><div class="axis-track"><div class="axis-center"></div><div class="axis-dot" style="left:${p}%"></div></div><div class="axis-meta"><span>${Math.round(100 - p)}%</span><span>${Math.round(p)}%</span></div></div>`;
            });
            html += `</div><div class="card-grid">
    <div class="info-card"><h3>🏷️ 肩書き</h3><p style="font-size:13px;line-height:1.8;">${ch.title}</p></div>
    <div class="info-card"><h3>💬 自信のひとこと</h3><p style="font-size:13px;line-height:1.8;">${ch.confidence}</p></div>
    <div class="info-card"><h3>❤️ 一番大切にしていること</h3><p style="font-size:13px;line-height:1.8;">${ch.priority}</p></div>
    <div class="info-card"><h3>🧭 コア価値観</h3><p style="font-size:13px;line-height:1.8;">${ch.core}</p></div>
    <div class="info-card"><h3>💪 強み</h3><ul>${ch.strengths.map(s => `<li>${s}</li>`).join("")}</ul></div>
    <div class="info-card"><h3>🎯 推し活の主戦場</h3><p style="font-size:13px;line-height:1.8;">${ch.arena}</p></div>
    </div>
    <div class="panel" style="margin-top:24px;"><h3 style="margin:0 0 12px;">💌 愛の証明方法</h3><p class="text-body" style="margin:0;font-size:14px;line-height:1.9;">${ch.proof}</p></div>
    <div class="panel fade-in" style="margin-top:24px;animation-delay:0.12s;background:linear-gradient(145deg,#fff7fb,#fff2e2);border:2px solid rgba(255,77,141,0.2);overflow:hidden;position:relative;">
    <div style="position:absolute;top:18px;right:-44px;transform:rotate(20deg);background:linear-gradient(135deg,#ffb347,#ffd27f);color:#fff;font-size:11px;letter-spacing:0.18em;padding:6px 48px;text-transform:uppercase;">LIMITED</div>
    <p class="kicker" style="margin-bottom:12px;color:#ff4d8d;">🎀 限定アクセサリー</p>
    <div class="result-product-tabs" role="tablist" aria-label="限定キーホルダー">
    <button id="resultProductTabPlush" class="result-product-tab" type="button" role="tab" aria-selected="true" aria-controls="resultProductPanelPlush" data-result-product-tab="plush">ぬいぐるみ<br>キーホルダー</button>
    <button id="resultProductTabAcrylic" class="result-product-tab" type="button" role="tab" aria-selected="false" aria-controls="resultProductPanelAcrylic" data-result-product-tab="acrylic" tabindex="-1">アクリル<br>キーホルダー</button>
    </div>
    <section id="resultProductPanelPlush" class="result-product-content is-active" role="tabpanel" aria-labelledby="resultProductTabPlush" data-result-product-panel="plush">
    <h3 style="font-size:20px;margin:0 0 8px;color:var(--text-main);">ふわふわぬいぐるみキーホルダー</h3>
    <p style="display:inline-block;font-size:12px;font-weight:700;color:#ffffff;background:#ff4d8d;padding:6px 12px;border-radius:999px;margin:0 0 12px;letter-spacing:0.03em;">先着100個限定</p>
    <div style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px;margin-bottom:14px;"><span style="font-size:14px;color:rgba(82,62,62,0.72);text-decoration:line-through;text-decoration-thickness:2px;">通常価格 6,000円</span><span style="font-size:17px;color:#b65174;font-weight:700;letter-spacing:0.04em;background:rgba(255,77,141,0.1);border:1px solid rgba(255,77,141,0.24);padding:6px 12px;border-radius:999px;">特別価格 4,800円</span></div>
    <div style="margin-bottom:14px;background:linear-gradient(145deg,#fff7fb,#fff2e2);border-radius:16px;padding:16px;border:1px solid rgba(255,255,255,0.9);text-align:center;"><img src="../img/nui/nui.jpeg" alt="ぬいぐるみキーホルダー" style="width:min(100%,220px);max-height:180px;object-fit:contain;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.12);" onerror="this.style.display='none';"></div>
    <p class="text-body" style="font-size:14px;line-height:1.8;margin:0 0 14px;">ふわっと軽い質感で、バッグにつけるだけで気分が上がる限定ぬいぐるみキーホルダーです。</p>
    <ul style="margin:0 0 18px;padding-left:18px;color:var(--text-sub);line-height:1.8;font-size:13px;"><li>写真映えするフェミニンな配色</li><li>毎日使いやすいコンパクトサイズ</li><li>期間・数量ともに限定の特別仕様</li></ul>
    <a id="stripeBuyButtonPlush" data-stripe-product-type="plush_keyholder" data-stripe-product-label="ぬいぐるみキーホルダー" href="https://buy.stripe.com/28EaEX30Vfqt6SybJJao80b" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;background:linear-gradient(135deg,#ff4d8d,#ff7aa8);color:#fff;box-shadow:0 14px 30px rgba(255,77,141,0.3);transition:transform 0.2s ease;">期間限定アイテムを確認する →</a>
    </section>
    <section id="resultProductPanelAcrylic" class="result-product-content" role="tabpanel" aria-labelledby="resultProductTabAcrylic" data-result-product-panel="acrylic" hidden>
    <h3 style="font-size:20px;margin:0 0 8px;color:var(--text-main);">アクリルキーホルダー</h3>
    <p style="display:inline-block;font-size:15px;font-weight:700;color:#ff4d8d;background:rgba(255,77,141,0.08);padding:6px 14px;border-radius:999px;margin:0 0 18px;letter-spacing:0.03em;">あなたの診断結果を持ち歩こう</p>
     <div style="display:flex;gap:12px;justify-content:center;margin-bottom:18px;background:linear-gradient(145deg,#fff7fb,#fff2e2);border-radius:16px;padding:16px;border:1px solid rgba(255,255,255,0.9);">
     <div style="width:45%;max-width:140px;position:relative;overflow:hidden;">
     <picture>
     <source srcset="${keyImageFrontWebpPath}" type="image/webp">
     <img src="${keyImageFrontPath}" alt="アクリルキーホルダー 表面" loading="lazy" decoding="async" style="width:100%;border-radius:12px;object-fit:contain;box-shadow:0 4px 12px rgba(0,0,0,0.1);" onerror="this.style.display='none';">
     </picture>
     </div>
     <div style="width:45%;max-width:140px;position:relative;overflow:hidden;">
     <picture>
     <source srcset="${keyImageBackWebpPath}" type="image/webp">
     <img src="${keyImageBackPath}" alt="アクリルキーホルダー 裏面" loading="lazy" decoding="async" style="width:100%;border-radius:12px;object-fit:contain;box-shadow:0 4px 12px rgba(0,0,0,0.1);" onerror="this.style.display='none';">
     </picture>
     </div>
     </div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;"><span style="font-size:20px;color:#b65174;font-weight:700;letter-spacing:0.04em;">1,900円</span></div>
    <p class="text-body" style="font-size:14px;line-height:1.8;margin:0 0 14px;"><strong>${displayName}デザインのアクリルキーホルダー。</strong> 透明感ときらめきで、光を味方にするクリアアクセ。</p>
    <ul style="margin:0 0 18px;padding-left:18px;color:var(--text-sub);line-height:1.8;font-size:13px;"><li>推し活モビー診断の診断タイプごとの専用デザイン</li><li>日常でも特別感を残すサイズ感</li></ul>
    <a id="stripeBuyButtonAcrylic" data-stripe-product-type="acrylic_keyholder" data-stripe-product-label="アクリルキーホルダー" href="https://buy.stripe.com/bJe14n8lf7Y11yecNNao80a" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;background:linear-gradient(135deg,#ff4d8d,#ff7aa8);color:#fff;box-shadow:0 14px 30px rgba(255,77,141,0.3);transition:transform 0.2s ease;">限定アイテムを手に取る →</a>
    </section>
    </div>
    <div class="panel" style="text-align:center;margin-top:24px;">
    <h3 style="margin:0 0 16px;">結果をシェア 🎉</h3>
    <div class="sns-save-wrap">
    <button id="btnSaveSnsImage" class="sns-save-btn">📸 SNS投稿用画像を保存</button>
    <div id="snsSaveBox" class="sns-save-box">
    <p id="snsSaveHint" class="sns-save-hint">画像を読み込み中です...</p>
    <div class="sns-save-preview-wrap">
    <img id="snsSavePreview" class="sns-save-preview" alt="SNS投稿用画像" loading="eager" decoding="async" />
    </div>
    <p id="snsSaveFallback" class="sns-save-fallback">このタイプのSNS画像は準備中です。結果画面をスクショしてストーリーに投稿してください。</p>
    </div>
    </div>
    <div class="share-buttons">
    <a class="share-btn share-x" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`推し活モビー診断の結果は「${displayName}」でした！🎤✨\n${ch.catch}\n`)}&url=${encodeURIComponent("https://www.mobby.online/16stan")}" target="_blank" rel="noopener">𝕏 でシェア</a>
    <a class="share-btn share-line" href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent("https://www.mobby.online/16stan")}&text=${encodeURIComponent(`推し活モビー診断の結果は「${displayName}」でした！`)}" target="_blank" rel="noopener">LINE でシェア</a>
    </div></div>
    <div style="text-align:center;margin-top:24px;"><button onclick="resetState();render();" style="font-size:14px;">もう一度診断する</button></div>
    </div>`; app.innerHTML = html;

            const resultProductTabButtons = Array.from(document.querySelectorAll(".result-product-tab[data-result-product-tab]"));
            const resultProductPanels = Array.from(document.querySelectorAll(".result-product-content[data-result-product-panel]"));
            function activateResultProductTab(tabKey) {
                if (!tabKey) return;
                resultProductTabButtons.forEach((button) => {
                    const isActive = button.dataset.resultProductTab === tabKey;
                    button.setAttribute("aria-selected", isActive ? "true" : "false");
                    button.tabIndex = isActive ? 0 : -1;
                });
                resultProductPanels.forEach((panel) => {
                    const isActive = panel.dataset.resultProductPanel === tabKey;
                    panel.classList.toggle("is-active", isActive);
                    panel.hidden = !isActive;
                });
            }
            resultProductTabButtons.forEach((button, index) => {
                button.addEventListener("click", () => {
                    activateResultProductTab(button.dataset.resultProductTab || "");
                });
                button.addEventListener("keydown", (e) => {
                    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
                    e.preventDefault();
                    let nextIndex = index;
                    if (e.key === "ArrowRight") nextIndex = (index + 1) % resultProductTabButtons.length;
                    if (e.key === "ArrowLeft") nextIndex = (index - 1 + resultProductTabButtons.length) % resultProductTabButtons.length;
                    if (e.key === "Home") nextIndex = 0;
                    if (e.key === "End") nextIndex = resultProductTabButtons.length - 1;
                    const nextButton = resultProductTabButtons[nextIndex];
                    if (!nextButton) return;
                    activateResultProductTab(nextButton.dataset.resultProductTab || "");
                    nextButton.focus();
                });
            });
            if (resultProductTabButtons.length > 0) activateResultProductTab("plush");

            const stripeButtons = Array.from(document.querySelectorAll("[data-stripe-product-type]"));
            const stripeRes = { code, pcts, char: ch };
            stripeButtons.forEach((stripeBtn) => {
                stripeBtn.addEventListener("click", () => {
                    const payload = buildStripeSheetPayload(stripeRes, {
                        clickedProductType: stripeBtn.dataset.stripeProductType || "",
                        clickedProductLabel: stripeBtn.dataset.stripeProductLabel || "",
                        clickedButtonId: stripeBtn.id || ""
                    });
                    sendToGoogleSheet(payload);
                });
            });

            const snsSaveBtn = document.getElementById("btnSaveSnsImage");
            const snsSaveBox = document.getElementById("snsSaveBox");
            const snsSaveHint = document.getElementById("snsSaveHint");
            const snsSavePreview = document.getElementById("snsSavePreview");
            const snsSaveFallback = document.getElementById("snsSaveFallback");
            if (snsSaveBtn && snsSaveBox && snsSaveHint && snsSavePreview && snsSaveFallback) {
                snsSaveBtn.onclick = () => {
                    snsSaveBox.style.display = "block";
                    snsSavePreview.style.display = "none";
                    snsSaveFallback.style.display = "none";
                    if (!snsImagePaths) {
                        snsSaveHint.textContent = "画像が見つからないため、結果画面をスクショして保存してください。";
                        snsSaveFallback.style.display = "block";
                        return;
                    }
                    const iosLike = isIOSLikeDevice();
                    if (!iosLike) {
                        snsSaveHint.textContent = "保存を開始しました。うまくいかない場合は結果画面をスクショしてください。";
                        const dl = document.createElement("a");
                        dl.href = snsImagePaths.png;
                        dl.download = `${sanitizeDownloadName(ch.name)}.png`;
                        dl.rel = "noopener";
                        document.body.appendChild(dl);
                        dl.click();
                        document.body.removeChild(dl);
                        return;
                    }
                    snsSaveHint.textContent = "iPhoneは画像を長押しして「写真に保存」を選んでください。";
                    snsSavePreview.alt = `${displayName} SNS投稿用画像`;
                    if (snsSavePreview.src && decodeURIComponent(snsSavePreview.src).endsWith(decodeURIComponent(snsImagePaths.png))) {
                        snsSavePreview.style.display = "block";
                        snsSaveFallback.style.display = "none";
                        snsSaveBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        return;
                    }
                    snsSavePreview.onload = () => {
                        snsSavePreview.style.display = "block";
                        snsSaveFallback.style.display = "none";
                    };
                    snsSavePreview.onerror = () => {
                        snsSavePreview.style.display = "none";
                        snsSaveFallback.style.display = "block";
                        snsSaveHint.textContent = "このタイプのSNS画像は準備中です。結果画面をスクショして投稿してください。";
                    };
                    snsSavePreview.src = snsImagePaths.png;
                    snsSaveBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
                };
            }
        }
        function renderCharacters() {
            const app = document.getElementById("app"); const codes = Object.keys(CH);
            let html = `<div class="fade-in"><div class="panel"><p class="kicker">全16タイプ</p><h2 class="big">推し活モビーキャラ一覧</h2><p class="text-body">タップすると詳細が見られます</p></div><div class="char-grid">`;
            codes.forEach(code => {
                const c = CH[code];
                const displayName = c.displayName || c.name;
                html += `<div class="char-card" onclick="showCharDetail('${code}')">
    <div class="char-card-image"><img src="img/${c.name}.jpg" alt="${displayName}" onerror="this.style.display='none'"></div>
    <div class="char-card-name">${displayName}</div>
    <span class="char-card-type">${code}</span>
    <p class="char-card-desc">${c.catch}</p></div>`;
            });
            html += `</div></div>`; app.innerHTML = html;
        }
        function showCharDetail(code) {
            const c = CH[code]; if (!c) return;
            const displayName = c.displayName || c.name;
            const existing = document.querySelector(".char-modal-overlay"); if (existing) existing.remove();
            const overlay = document.createElement("div"); overlay.className = "char-modal-overlay";
            overlay.innerHTML = `<div class="char-modal">
    <button class="char-modal-close" onclick="this.closest('.char-modal-overlay').remove()">✕</button>
    <div style="text-align:center;margin-bottom:20px;">
    <div class="char-image-placeholder" style="max-width:240px;"><img src="img/${c.name}.jpg" alt="${displayName}" onerror="this.parentElement.innerHTML='Image'"></div>
    <h2 style="margin:12px 0 4px;font-size:22px;">${displayName}</h2>
    <p style="font-family:monospace;color:var(--text-sub);font-size:12px;">${code}</p></div>
    <p style="color:var(--accent);font-weight:600;margin-bottom:8px;">${c.catch}</p>
    <p style="font-size:14px;line-height:1.7;margin-bottom:20px;">${c.hook}</p>
    <div class="info-card" style="margin-bottom:12px;"><h3>🏷️ 肩書き</h3><p style="font-size:13px;line-height:1.8;">${c.title}</p></div>
    <div class="info-card" style="margin-bottom:12px;"><h3>💬 自信のひとこと</h3><p style="font-size:13px;line-height:1.8;">${c.confidence}</p></div>
    <div class="info-card" style="margin-bottom:12px;"><h3>❤️ 一番大切にしていること</h3><p style="font-size:13px;line-height:1.8;">${c.priority}</p></div>
    <div class="info-card" style="margin-bottom:12px;"><h3>🧭 コア価値観</h3><p style="font-size:13px;line-height:1.8;">${c.core}</p></div>
    <div class="info-card" style="margin-bottom:12px;"><h3>💪 強み</h3><ul>${c.strengths.map(s => `<li>${s}</li>`).join("")}</ul></div>
    <div class="info-card" style="margin-bottom:12px;"><h3>🎯 推し活の主戦場</h3><p style="font-size:13px;line-height:1.8;">${c.arena}</p></div>
    <div class="info-card"><h3>💌 愛の証明方法</h3><p style="font-size:13px;line-height:1.8;">${c.proof}</p></div>
    </div>`;
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); }; document.body.appendChild(overlay);
        }
        function showTypeGuide() {
            const existing = document.querySelector(".char-modal-overlay"); if (existing) existing.remove();
            const overlay = document.createElement("div"); overlay.className = "char-modal-overlay";
            let html = `<div class="char-modal"><button class="char-modal-close" onclick="this.closest('.char-modal-overlay').remove()">✕</button>
    <h2 style="margin:0 0 20px;font-size:20px;">タイプ解説</h2>
    <p style="font-size:14px;color:var(--text-sub);margin-bottom:20px;">推し活モビー診断は4つの軸であなたの推し活スタイルを分析します。各軸の組み合わせで16タイプが決まります。</p>`;
            ["A", "B", "C", "D"].forEach(k => {
                const ax = AXES[k];
                html += `<div style="background:var(--surface2);padding:16px;border-radius:12px;margin-bottom:12px;">
    <h3 style="margin:0 0 8px;font-size:15px;">軸${k}: ${ax.name}</h3>
    <div style="display:flex;justify-content:space-between;font-size:13px;">
    <span style="color:#e86aaf;">← ${ax.left}（${ax.leftCode}）</span>
    <span style="color:#9b6dff;">${ax.right}（${ax.rightCode}）→</span>
    </div></div>`;
            });
            html += `<p style="font-size:13px;color:var(--text-sub);margin-top:16px;">例：「こなはひ」= 日常派 × 現場派 × 発信派 × 単体派</p></div>`;
            overlay.innerHTML = html; overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); }; document.body.appendChild(overlay);
        }
        document.getElementById("navDiagnosis").onclick = (e) => { e.preventDefault(); if (state.step === "characters") { state.step = "intro"; saveState(); } render(); };
        document.getElementById("navCharacters").onclick = (e) => { e.preventDefault(); state.step = "characters"; saveState(); render(); };
        document.getElementById("btnReset").onclick = () => { if (confirm("診断をリセットしますか？")) { resetState(); render(); } };
        document.getElementById("btnTypeGuide").onclick = () => { showTypeGuide(); };
        const ENABLE_MYPAGE_ENTRY = false; // Set true to show the launcher again.

        function mountMyPageLauncher() {
            if (!ENABLE_MYPAGE_ENTRY) return;
            if (document.getElementById("mobbyMyPageLauncher")) return;
            const launcher = document.createElement("a");
            launcher.id = "mobbyMyPageLauncher";
            launcher.href = "/mypage-register.html";
            launcher.textContent = "診断まとめページ";
            launcher.style.position = "fixed";
            launcher.style.right = "12px";
            launcher.style.bottom = "12px";
            launcher.style.zIndex = "95";
            launcher.style.padding = "10px 14px";
            launcher.style.borderRadius = "999px";
            launcher.style.fontSize = "12px";
            launcher.style.fontWeight = "700";
            launcher.style.letterSpacing = "0.04em";
            launcher.style.textDecoration = "none";
            launcher.style.color = "#fff";
            launcher.style.background = "linear-gradient(135deg,#0ea5e9,#0284c7)";
            launcher.style.boxShadow = "0 12px 24px rgba(14,165,233,0.34)";
            document.body.appendChild(launcher);
        }
        loadState(); render(); mountMyPageLauncher();
    