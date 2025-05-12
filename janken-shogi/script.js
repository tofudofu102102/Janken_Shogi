// ジャンケン将棋・改良版コード

const boardSize = 5;
const board = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const actionCounter = document.getElementById('action-counter');
const ruleText = document.getElementById('rules');

const state = {
  playerPieces: [],
  cpuPieces: [],
  selected: null,
  movedThisTurn: [],
  actionsLeft: 5,
  countdown: 10,
  timer: null,
  started: false,
  playerTurn: true,
};

const emojiMap = {0:'✊',1:'☝️',2:'✌️',3:'🤟',4:'4⃣',5:'✋'};
const winMap = {0:2,2:5,5:0};

function initGame(){
  clearInterval(state.timer);
  state.playerPieces = [];
  state.cpuPieces = [];
  state.selected = null;
  state.movedThisTurn = [];
  state.actionsLeft = 5;
  state.countdown = 10;
  state.started = false;
  state.playerTurn = true;
  createBoard();
  placeInitialPieces();
  render();
}

function createBoard(){
  board.innerHTML = '';
  for(let y = 0; y < boardSize; y++) {
    for(let x = 0; x < boardSize; x++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      board.appendChild(cell);
    }
  }
  ruleText.innerText = "✊=0,✌️=2,✋=5のみジャンケン有効。☝️,🤟,4⃣は全敗。移動で+1、非移動で-1（循環）。";
}

function placeInitialPieces(){
  for(let x = 0; x < boardSize; x++){
    state.playerPieces.push({x, y: 4, fingers: rand(), team: 'player', id: crypto.randomUUID()});
    state.cpuPieces.push({x, y: 0, fingers: rand(), team: 'cpu', id: crypto.randomUUID()});
  }
}
function rand(){ return Math.floor(Math.random() * 6); }

function getPieceAt(x, y){
  return [...state.playerPieces, ...state.cpuPieces].find(p => p.x === x && p.y === y);
}
function isAdjacent(x1, y1, x2, y2){ return Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1; }
function loopUp(f){ return (f + 1) % 6; }
function loopDown(f){ return (f + 5 + 6) % 6; }

function handleCellClick(e){
  if(!state.playerTurn || state.actionsLeft <= 0) return;
  const cell = e.target.closest('.cell'); if(!cell) return;
  const x = +cell.dataset.x, y = +cell.dataset.y;
  const clicked = getPieceAt(x, y);

  if(state.selected){
    if(isAdjacent(state.selected.x, state.selected.y, x, y)){
      if(clicked && clicked.team === 'cpu') performAttack(state.selected, clicked);
      else if(!clicked) performMove(state.selected, x, y);
      state.selected = null;
    } else state.selected = null;
  } else if(clicked && clicked.team === 'player') state.selected = clicked;
  render();
}

function performMove(p, x, y){
  p.x = x; p.y = y; p.fingers = loopUp(p.fingers);
  state.actionsLeft--; state.movedThisTurn.push(p.id);
  if(!state.started) startCountdown();
  if(state.actionsLeft <= 0){
    state.countdown = 0;
    gameLoop();
  }
}

function performAttack(att, def){
  const result = jankenWinner(att.fingers, def.fingers);
  if(result === 'att'){
    removeById(def.id);
    att.x = def.x; att.y = def.y; att.fingers = loopUp(att.fingers);
    state.actionsLeft--; state.movedThisTurn.push(att.id);
  } else if(result === 'draw'){
    removeById(att.id); removeById(def.id);
    state.actionsLeft--;
  } else {
    removeById(att.id);
    state.actionsLeft--;
  }
  if(!state.started) startCountdown();
  if(state.actionsLeft <= 0){
    state.countdown = 0;
    gameLoop();
  }
}

function resolveAttack(att, def){
  const result = jankenWinner(att.fingers, def.fingers);
  if(result === 'att'){
    removeById(def.id);
    att.x = def.x;
    att.y = def.y;
    att.fingers = loopUp(att.fingers);
  } else if(result === 'draw'){
    removeById(att.id);
    removeById(def.id);
  } else {
    removeById(att.id);
  }
}

function jankenWinner(a,b){
  const weak = [1,3,4];
  if(weak.includes(a) && !weak.includes(b)) return 'def';
  if(weak.includes(b) && !weak.includes(a)) return 'att';
  if(weak.includes(a) && weak.includes(b)) return 'draw';
  if(a === b) return 'draw';
  if(winMap[a] === b) return 'att';
  if(winMap[b] === a) return 'def';
  return 'draw';
}

function removeById(id){
  state.playerPieces = state.playerPieces.filter(p => p.id !== id);
  state.cpuPieces = state.cpuPieces.filter(p => p.id !== id);
  checkVictory();
}

function startCountdown(){
  state.started = true;
  state.timer = setInterval(gameLoop, 1000);
}

function cpuMove() {
  let actions = 0;
  const maxActions = 5;
  const directions = [[0,1],[0,-1],[1,0],[-1,0]];
  const priority = [0, 5, 2];  // 強い順
  const weak = [1, 3, 4];

  const pieces = [...state.cpuPieces].sort((a, b) => {
    return priority.indexOf(a.fingers) - priority.indexOf(b.fingers);
  });

  while (actions < maxActions) {
    let moved = false;

    for (const piece of pieces) {
      if (actions >= maxActions) break;

      // 優先：攻撃
      for (const [dx, dy] of directions) {
        const nx = piece.x + dx;
        const ny = piece.y + dy;
        if (nx < 0 || nx >= boardSize || ny < 0 || ny >= boardSize) continue;
        const target = getPieceAt(nx, ny);
        if (target && target.team === 'player') {
          const result = jankenWinner(piece.fingers, target.fingers);
          if (result === 'att' || result === 'draw') {
            removeById(target.id);
            if (result === 'att') {
              piece.x = nx;
              piece.y = ny;
              piece.fingers = loopUp(piece.fingers);
            } else {
              removeById(piece.id);
            }
            actions++;
            moved = true;
            break;
          }
        }
      }

      if (moved) continue;

      // 指が弱く、次に動いて強くなるなら移動
      if (weak.includes(piece.fingers)) {
        const nextFinger = loopUp(piece.fingers);
        if (!weak.includes(nextFinger)) {
          for (const [dx, dy] of directions) {
            const nx = piece.x + dx;
            const ny = piece.y + dy;
            if (nx < 0 || nx >= boardSize || ny < 0 || ny >= boardSize) continue;
            const target = getPieceAt(nx, ny);
            if (!target) {
              piece.x = nx;
              piece.y = ny;
              piece.fingers = nextFinger;
              actions++;
              moved = true;
              break;
            }
          }
        }
      }
    }

    if (!moved) break;
  }
}



function decay(){
  [...state.playerPieces, ...state.cpuPieces].forEach(p => {
    if(!state.movedThisTurn.includes(p.id)){
      // 指がジャンケン強者なら維持
      if([0, 2, 5].includes(p.fingers)) return;
      // 弱者なら-1して強者へ向かう
      p.fingers = loopDown(p.fingers);
    }
  });
}


function gameLoop(){
  if(--state.countdown > 0) render();
  else{
    cpuMove();
    resolveCombat();
    decay();
    state.countdown = 10;
    state.actionsLeft = 5;
    state.movedThisTurn = [];
    state.selected = null;
    render();
  }
}

function resolveCombat(){
  const map = {};
  [...state.playerPieces, ...state.cpuPieces].forEach(p => {
    (map[`${p.x},${p.y}`] ||= []).push(p);
  });
  Object.values(map).forEach(list => {
    while(list.length > 1){
      const a = list.shift(), b = list.shift();
      resolveAttack(a, b);
    }
  });
}

function checkVictory(){
  if(state.playerPieces.length === 0){
    clearInterval(state.timer);
    alert('CPUの勝ち');
    initGame();
  } else if(state.cpuPieces.length === 0){
    clearInterval(state.timer);
    alert('あなたの勝ち');
    initGame();
  }
}

function render(){
  board.querySelectorAll('.cell').forEach(c => {
    c.innerHTML = '';
    c.style.backgroundColor = '';
  });

  [...state.playerPieces, ...state.cpuPieces].forEach(p => {
    const fingers = (typeof p.fingers === 'number' && p.fingers >= 0 && p.fingers <= 5) ? p.fingers : 0;
    const cell = board.children[p.y * boardSize + p.x];
    const d = document.createElement('div');
    d.textContent = emojiMap[fingers] ?? '?';
    d.className = `piece ${p.team}`;
    if(state.selected && state.selected.id === p.id) d.classList.add('selected');
    d.style.cssText = "font-size:32px;display:flex;align-items:center;justify-content:center;" + (p.team === 'cpu' ? "transform:scaleY(-1);" : "");
    cell.appendChild(d);
    cell.style.backgroundColor = p.team === 'player' ? 'rgba(0,200,0,0.3)' : 'rgba(200,0,0,0.3)';
  });

  turnIndicator.textContent = `ターン終了まで：${state.countdown}秒`;
  actionCounter.textContent = `行動回数：${state.actionsLeft}`;
}

board.addEventListener('click', handleCellClick);
initGame();
