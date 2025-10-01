// 데이터
const questions = Array.isArray(window.QUESTIONS) ? window.QUESTIONS.slice() : [];

// 상태
let deck = [];
let idx = -1;                 // -1: 아직 첫 질문 미공개
let isDragging = false;
let startX = 0, startY = 0;
let curX = 0, curY = 0;

// 고정 엘리먼트(초기 DOM)
const stackEl     = document.getElementById('stack');
const cardTopEl   = document.getElementById('cardTop');
const topTextDom  = document.getElementById('topText');
const cardNextEl  = document.getElementById('cardNext');
const nextTextDom = document.getElementById('nextText');

// 스왑 가능한 핸들 (초기에는 고정 엘리먼트를 가리킴)
let topCard   = cardTopEl;
let backCard  = cardNextEl;
let topTextEl = topTextDom;
let backTextEl= nextTextDom;

const counter   = document.getElementById('counter');
const remaining = document.getElementById('remaining');
const progress  = document.getElementById('progress');
const resetBtn  = document.getElementById('resetBtn');
const copyBtn   = document.getElementById('copyBtn');
const endMsg    = document.getElementById('endMsg');

// 유틸
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// 긴 질문 자동 폰트 튜닝(최대 3줄)
function fitQuestion(el){
    el.style.fontSize = '22px';           // 기본 모바일 사이즈
    el.style.lineHeight = '1.3';
    // 소량의 렌더링 후 줄 수 추정
    requestAnimationFrame(()=>{
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    const lines = Math.round(el.scrollHeight / lh);
    if (lines > 3) el.style.fontSize = '20px';
    });
}

function updateHUD() {
    const total = deck.length;
    const current = Math.max(idx, 0);
    counter.textContent = `${Math.min(current, total)} / ${total}`;
    remaining.textContent = Math.max(total - current, 0);
    const ratio = total ? Math.min(current / total, 1) : 0;
    progress.style.width = `${ratio * 100}%`;
    copyBtn.disabled = (idx < 0 || idx >= deck.length);
    copyBtn.classList.toggle('opacity-50', copyBtn.disabled);
    copyBtn.classList.toggle('pointer-events-none', copyBtn.disabled);
}

function resetDeck() {
    deck = shuffle(questions);
    idx = -1;
    endMsg.classList.add('hidden');

    // 클래스 초기화: Top은 안내(보라), Back은 숨김
    topCard.classList.add('instruction','top');
    topCard.classList.remove('back','hidden-card','fly-left','fly-right','dragging');
    backCard.classList.add('back','hidden-card');
    backCard.classList.remove('top','fly-left','fly-right','dragging');

    if (deck.length === 0) {
    topTextEl.textContent = '질문 목록이 비어 있어요. questions.js를 확인해 주세요.';
    backTextEl.textContent = '';
    updateHUD();
    return;
    }

    topTextEl.textContent = '화면을 눌러 대화를 시작하세요!! 👇';
    backTextEl.textContent = deck[0]; // 첫 질문을 아래에 예열
    // 위치 초기화
    topCard.style.transform = '';
    topCard.style.opacity = '';

    updateHUD();
}

function revealFirst() {
    if (idx >= 0 || deck.length === 0) return;

    idx = 0;
    topTextEl.textContent = deck[0];
    fitQuestion(topTextEl);
    topCard.classList.remove('instruction'); // 이제부터 흰 카드만

    // 다음 질문 미리 채우기
    if (deck.length > 1) {
    backTextEl.textContent = deck[1];
    backCard.classList.add('back','hidden-card'); // 아래는 기본 숨김
    } else {
    backTextEl.textContent = '';
    backCard.classList.add('hidden-card');
    }
    updateHUD();
}

// 포인터 제스처
function onPointerDown(e){
    // 첫 터치로 '공개 + 드래그'를 한 번에
    if (idx < 0){
    revealFirst();
    // return 없이 이어서 드래그 시작
    }
    isDragging = true;
    startX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    startY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    topCard.classList.add('dragging');
    if (e.pointerId !== undefined) { topCard.setPointerCapture?.(e.pointerId); }
}

function onPointerMove(e){
    if (!isDragging) return;
    const x = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? startX;
    const y = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? startY;
    curX = x - startX;
    curY = y - startY;

    const rot = Math.max(Math.min(curX / 16, 24), -24);
    topCard.style.transform = `translate(${curX}px, ${curY}px) rotate(${rot}deg)`;
    topCard.style.opacity = `${Math.max(0.6, 1 - Math.abs(curX) / 600)}`;

    // 백카드 패럴랙스 (거리 비례)
    const t = Math.min(Math.abs(curX)/220, 1);
    backCard.style.transform = `scale(${0.985 + 0.01*t})`;
    backCard.style.opacity = String(0.9 + 0.06*t);
}

function onPointerUp(){
    if (!isDragging) return;
    isDragging = false;
    topCard.classList.remove('dragging');

    const threshold = Math.min(window.innerWidth * 0.15, 180); // 모바일 임계치 15%
    if (curX > threshold){
    flyOut('right');
    } else if (curX < -threshold){
    flyOut('left');
    } else {
    topCard.style.transform = '';
    topCard.style.opacity = '';
    backCard.style.transform = '';
    backCard.style.opacity = '';
    }
    curX = curY = 0;
}

function flyOut(direction){
    // 다음 카드가 있으면 미리 아래 카드를 드러내 자연스러운 노출
    const nextIdx = idx + 1;
    if (nextIdx < deck.length) {
    backCard.classList.remove('hidden-card');
    }

    // 위 카드 날리기
    topCard.classList.add(direction === 'right' ? 'fly-right' : 'fly-left');

    const onEnd = () => {
    topCard.removeEventListener('transitionend', onEnd);

    // 날아간 카드 리셋 후 뒤로 보관
    topCard.classList.remove('fly-left','fly-right','dragging','top');
    topCard.classList.add('back','hidden-card');
    topCard.style.transform = '';
    topCard.style.opacity = '';
    backCard.style.transform = '';
    backCard.style.opacity = '';

    // 🔁 참조 스왑 (DOM 두 장을 교차)
    [topCard, backCard]     = [backCard, topCard];
    [topTextEl, backTextEl] = [backTextEl, topTextEl];

    // 역할 클래스도 교체
    topCard.classList.remove('hidden-card','back');
    topCard.classList.add('top');
    backCard.classList.add('back');

    // 인덱스 증가: 이제 화면의 topCard는 deck[idx+1]
    idx++;
    updateHUD();

    // 끝 처리
    if (idx >= deck.length) {
        topTextEl.textContent = '끝! 🎉';
        endMsg.classList.remove('hidden');
        backTextEl.textContent = '';
        backCard.classList.add('hidden-card');
        return;
    }

    // 새로운 뒤 카드에 '다다음' 질문 프리로드
    const upcoming = idx + 1;
    if (upcoming < deck.length) {
        backTextEl.textContent = deck[upcoming];
        backCard.classList.add('hidden-card'); // 아래는 기본 숨김
    } else {
        backTextEl.textContent = '';
        backCard.classList.add('hidden-card');
    }

    // 현재 카드 폰트 핏
    topTextEl.textContent = deck[idx];
    fitQuestion(topTextEl);
    };
    topCard.addEventListener('transitionend', onEnd, { once:true });
}

// 이벤트 바인딩(Delegate to #stack)
['pointerdown','touchstart'].forEach(evt => {
    stackEl.addEventListener(evt, (e) => {
    const topEl = document.querySelector('.card.top');
    if (!topEl) return;
    if (!e.target.closest('.card.top')) {
        if (idx < 0) revealFirst();
        return;
    }
    onPointerDown(e);
    }, { passive: true });
});
['pointermove','touchmove'].forEach(evt => window.addEventListener(evt, onPointerMove, {passive:true}));
['pointerup','pointercancel','touchend','touchcancel'].forEach(evt => window.addEventListener(evt, onPointerUp, {passive:true}));

// 복사
copyBtn.addEventListener('click', async ()=>{
    try{
    const text = (idx >= 0 && idx < deck.length) ? deck[idx] : '';
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = '복사됨!';
    setTimeout(()=>copyBtn.textContent='질문 복사', 1200);
    }catch{
    alert('복사에 실패했어요. 브라우저 설정을 확인해 주세요.');
    }
});

// 리셋
resetBtn.addEventListener('click', resetDeck);

// 초기화
resetDeck();