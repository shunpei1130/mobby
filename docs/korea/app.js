async function submitLead(p) { try { const r = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || "전송에 실패했습니다"); return d } catch (e) { console.error("[Love] Error:", e); throw e } }
async function submitDiagnosis(p) { try { const r = await fetch("/api/diagnosis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || "저장에 실패했습니다"); return d } catch (e) { console.error("[Love] Error:", e); throw e } }

const AXES = {
    A: { key: "A", name: "연애 멘헤라도", left: "여유파", right: "한결같은 폭주", leftCode: "あ", rightCode: "ゆ" },
    B: { key: "B", name: "연애 의존도", left: "마이페이스", right: "남친 진심파", leftCode: "じ", rightCode: "つ" },
    C: { key: "C", name: "연애 어필도", left: "숨기는 파", right: "어필 전개", leftCode: "す", rightCode: "も" },
    D: { key: "D", name: "이별 회복력", left: "즉시 전환", right: "전남친 늪", leftCode: "ふ", rightCode: "ひ" }
};

const MENHERA_LEVELS = [
    { level: 1, name: "멘탈 철벽", desc: "연애를 해도 멘탈이 무너지지 않는 최강 존재. 멘헤라 제조기의 재능까지 있어." },
    { level: 2, name: "여유만만", desc: "좋아하는 사람이 생겨도 냉정함. 읽씹 당해도 '뭐 어때'로 넘길 수 있어." },
    { level: 3, name: "멘헤라의 싹🌱", desc: "연애를 하면 감정이 살짝 흔들리기 시작해. 멘헤라의 싹이 자라나는 단계." },
    { level: 4, name: "감정 흔들림기", desc: "좋아하는 사람 생각이 되고, 읽음 확인도 해버려. 그래도 아직 일상은 돌릴 수 있어." },
    { level: 5, name: "멘헤라 발동 중", desc: "연애 뇌 폭주 시작. 읽음 확인, SNS 감시, 새벽 텐션 장문 LINE까지…" },
    { level: 6, name: "감정 롤러코스터", desc: "감정의 기복이 너무 심해서 나도 못 따라가. 오늘도 감정 끝장." },
    { level: 7, name: "연애 좀비", desc: "몇 번 가라앉아도 좀비처럼 일어나는 불사신 멘헤라. 살아있는 것만으로도 대단해." }
];

const QUESTIONS = [
    { id: "A1", axis: "A", text: "좋아하는 사람의 답장이 늦어도 내 생활은 평범하게 보낼 수 있다.", reverse: false },
    { id: "A2", axis: "A", text: "남자친구나 좋아하는 사람과 싸워도 시간이 지나면 마음이 진정된다.", reverse: false },
    { id: "A3", axis: "A", text: "'미움받았나' 싶어도 자책하지 않고 기분을 전환할 수 있다.", reverse: false },
    { id: "A4", axis: "A", text: "좋아하는 사람의 SNS 업데이트를 봐도 기분이 크게 흔들리지 않는다.", reverse: false },
    { id: "A5", axis: "A", text: "연애에서 불안해져도 친구나 취미로 마음을 정리할 수 있다.", reverse: false },
    { id: "A6", axis: "A", text: "좋아하는 사람의 아무렇지 않은 한마디에 하루 종일 신경 쓰인 적이 있다.", reverse: true },
    { id: "A7", axis: "A", text: "'이제 연락 안 올지도'라고 생각하면 머릿속이 그 생각으로 가득 찬다.", reverse: true },
    { id: "A8", axis: "A", text: "연애가 안 풀리면 '내가 매력이 없어서'라고 생각해버린다.", reverse: true },
    { id: "A9", axis: "A", text: "밤이 되면 좋아하는 사람 생각을 너무 많이 해서 잠 못 드는 경우가 있다.", reverse: true },
    { id: "A10", axis: "A", text: "사소한 LINE 문체 변화에 '식었나?'라며 불안해지기 쉽다.", reverse: true },
    { id: "B1", axis: "B", text: "좋아하는 사람과 하루 연락 안 해도 별로 신경 쓰이지 않는다.", reverse: false },
    { id: "B2", axis: "B", text: "상대가 친구들과 놀아도 질투하지 않고 지낼 수 있다.", reverse: false },
    { id: "B3", axis: "B", text: "읽씹 당해도 추가 메시지는 기본적으로 보내지 않는다.", reverse: false },
    { id: "B4", axis: "B", text: "좋아하는 사람의 행동이나 교우관계를 세세하게 파악하지 않아도 괜찮다.", reverse: false },
    { id: "B5", axis: "B", text: "연인이 없어도 나만의 시간을 충실하게 보낼 수 있다.", reverse: false },
    { id: "B6", axis: "B", text: "좋아하는 사람이 읽음 표시를 안 하면 몇 번이고 LINE을 열어본다.", reverse: true },
    { id: "B7", axis: "B", text: "남자친구·좋아하는 사람과 연락이 안 되는 시간이 길면 안절부절한다.", reverse: true },
    { id: "B8", axis: "B", text: "좋아하는 사람이 다른 이성과 친하게 지내면 마음이 불편하다.", reverse: true },
    { id: "B9", axis: "B", text: "불안해지면 '지금 뭐 해?'라고 확인 메시지를 보내고 싶어진다.", reverse: true },
    { id: "B10", axis: "B", text: "좋아하는 사람의 리액션 하나로 그날 기분이 결정된다.", reverse: true },
    { id: "C1", axis: "C", text: "연애 이야기는 SNS에 별로 올리지 않는 타입이다.", reverse: false },
    { id: "C2", axis: "C", text: "좋아하는 사람과의 데이트나 일을 굳이 스토리에 올리지 않는다.", reverse: false },
    { id: "C3", axis: "C", text: "연애 고민은 SNS보다 내 안에서 정리하는 파이다.", reverse: false },
    { id: "C4", axis: "C", text: "연애로 힘들어도 의미심장한 게시물은 올리지 않으려 한다.", reverse: false },
    { id: "C5", axis: "C", text: "'걱정해줬으면' '알아줬으면' 하는 목적의 게시물은 올리지 않는다.", reverse: false },
    { id: "C6", axis: "C", text: "연애로 우울해지면 기분을 SNS에 쓰고 싶어진다.", reverse: true },
    { id: "C7", axis: "C", text: "좋아하는 사람과 만난 날은 은근히 드러내는 스토리를 올리고 싶어진다.", reverse: true },
    { id: "C8", axis: "C", text: "의미심장한 가사나 명언을 인용해서 지금 기분을 은근히 드러내고 싶어진다.", reverse: true },
    { id: "C9", axis: "C", text: "게시물에 좋아요나 DM이 오면 마음이 채워진다.", reverse: true },
    { id: "C10", axis: "C", text: "연애의 힘듦을 누군가에게 알아줬으면 하는 마음이 있다.", reverse: true },
    { id: "D1", axis: "D", text: "실연해도 한밤 울고 나면 다음 날엔 많이 회복된다.", reverse: false },
    { id: "D2", axis: "D", text: "차였을 때 극복하는 나만의 방법이 있다.", reverse: false },
    { id: "D3", axis: "D", text: "전남친 생각은 시간이 지나면 자연스럽게 잊는 편이다.", reverse: false },
    { id: "D4", axis: "D", text: "연애가 안 풀려도 일이나 학교는 제대로 할 수 있다.", reverse: false },
    { id: "D5", axis: "D", text: "'다음 연애로 가자'라고 전환하는 게 빠른 편이라고 생각한다.", reverse: false },
    { id: "D6", axis: "D", text: "실연하면 몇 주간 끌어안고 간다.", reverse: true },
    { id: "D7", axis: "D", text: "전남친과의 추억을 몇 번이고 떠올리며 좀처럼 앞으로 나아가지 못한다.", reverse: true },
    { id: "D8", axis: "D", text: "연애로 우울해지면 친구와의 약속도 갑자기 취소하기 쉽다.", reverse: true },
    { id: "D9", axis: "D", text: "누군가에게 '괜찮아'라는 말을 들어야 간신히 일어설 수 있다.", reverse: true },
    { id: "D10", axis: "D", text: "헤어진 후에도 전남친의 SNS를 확인해버린다.", reverse: true }
];
