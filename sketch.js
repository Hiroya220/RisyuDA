/*
 * 履修打 (Risyu DA) — Processing版 EP_RisyuDA.pde からの移植
 * 依存: p5.js 1.11.11（index.htmlから読み込み）
 * 操作: 英単語を入力 / Enterで判定 / Backspaceで全消去
 *
 * 元のルールや座標、配点、落下速度をできるだけ保持しています。
 */

const WORDS = [
  'English',
  'Computer Programming',
  'Essential FMS',
  'Linear Algebra',
  'Introductory Course for IMS',
  'Calculus',
  'Academic Literacy',
  'IM Seminar',
  'Exercise in EP'
];

const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 860;
const START_BUTTON = { x: 650, y: 500, w: 500, h: 200 };

let status = 'taiki';
let typedWord = '';
let grade = 'S';
let gradePoint = 4;
let wordIndex = 0;
let score = 0;
let wordY = -100;
let speed = 12;
let constantSpeed = false;
let countdownStartedAt = 0;
let resultStartedAt = 0;
let pendingJudgement = null;
let shakeFramesLeft = 0;

function setup() {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent('game-container');
  canvas.attribute('aria-label', 'タイピングゲーム 履修打');
  canvas.attribute('tabindex', '0');
  textAlign(CENTER, CENTER);
  textFont('Arial, sans-serif');
  frameRate(60);
}

function draw() {
  if (status === 'taiki') {
    drawTitle();
  } else if (status === 'countdown') {
    drawCountdown();
  } else if (status === 'gaming') {
    drawGameplay();
  } else if (status === 'result') {
    drawResult();
  }
}

function drawTitle() {
  background(0);
  noStroke();
  fill(255);
  textSize(200);
  text('Risyu DA', 900, 300);

  const hover = insideStartButton(mouseX, mouseY);
  fill(hover ? 200 : 255);
  rect(START_BUTTON.x, START_BUTTON.y, START_BUTTON.w, START_BUTTON.h);
  fill(0);
  textSize(100);
  text('Start', 900, 600);
}

function drawCountdown() {
  background(0);
  noStroke();
  fill(255);
  textSize(100);

  const elapsed = millis() - countdownStartedAt;
  if (elapsed < 3000) {
    text(3 - Math.floor(elapsed / 1000), width / 2, height / 2);
  } else if (elapsed < 4000) {
    text('Start!', width / 2, height / 2);
  } else {
    status = 'gaming';
    drawGameplay();
  }
}

function drawGameplay() {
  // Processingのdelay(500)に相当する処理。描画を止めずに判定だけ待つ。
  if (pendingJudgement !== null) {
    if (millis() >= pendingJudgement.resolveAt) {
      resolveJudgement();
      if (status !== 'gaming') return;
    }
  } else {
    advanceFallingWord();
    if (status !== 'gaming') return;
  }

  background(255);
  noStroke();

  fill(0);
  textSize(55);
  text(typedWord, 350, 280);

  fill(0);
  rect(700, 0, 1100, 860);
  fill(200);
  rect(0, 560, 700, 300);

  let xOffset = 0;
  if (shakeFramesLeft > 0) {
    xOffset = random(-20, 20);
    shakeFramesLeft -= 1;
  }

  if (wordIndex < WORDS.length) {
    const color = gradeColor();
    fill(color[0], color[1], color[2]);
    textSize(70);
    text(WORDS[wordIndex], 1250 + xOffset, wordY);
  }

  fill(0);
  textSize(70);
  text('Grade : ' + grade, 350, 710);
}

function advanceFallingWord() {
  if (!constantSpeed) {
    wordY += speed;
    speed *= 0.965;
    if (speed <= 1.0) {
      constantSpeed = true;
      speed = 1.0;
    }
  } else {
    wordY += speed;
  }

  updateGrade();

  // Fになった科目は入力不可。画面外に出たら次へ。
  if (wordY > 890) typedWord = '';
  if (wordY > 1000) {
    wordIndex += 1;
    if (wordIndex >= WORDS.length) {
      finishGame();
      return;
    }
    resetFallingWord();
  }
}

function updateGrade() {
  if (wordY <= 364.5) {
    gradePoint = 4;
    grade = 'S';
  } else if (wordY <= 523) {
    gradePoint = 3;
    grade = 'A';
  } else if (wordY <= 700) {
    gradePoint = 2;
    grade = 'B';
  } else if (wordY <= 890) {
    gradePoint = 1;
    grade = 'C';
  } else {
    gradePoint = 0;
    grade = 'F';
  }
}

function gradeColor() {
  switch (grade) {
    case 'S': return [255, 255, 255];
    case 'A': return [0, 0, 255];
    case 'B': return [255, 255, 0];
    case 'C': return [255, 0, 0];
    default: return [255, 0, 0];
  }
}

function resolveJudgement() {
  const { correct } = pendingJudgement;
  pendingJudgement = null;

  if (!correct) {
    shakeFramesLeft = 10;
    return;
  }

  // 「Computer Programming」だけ4単位、それ以外は2単位。
  score += gradePoint * (wordIndex === 1 ? 4 : 2);
  wordIndex += 1;
  if (wordIndex >= WORDS.length) {
    finishGame();
  } else {
    resetFallingWord();
  }
}

function resetFallingWord() {
  wordY = -100;
  speed = 12;
  gradePoint = 4;
  grade = 'S';
  constantSpeed = false;
  shakeFramesLeft = 0;
  typedWord = '';
}

function finishGame() {
  status = 'result';
  resultStartedAt = millis();
  pendingJudgement = null;
}

function drawResult() {
  background(157, 204, 224);
  noStroke();
  fill(0);
  const elapsed = millis() - resultStartedAt;

  if (elapsed >= 1000) {
    textSize(70);
    text('Your GPA is', 770, 430);
  }
  if (elapsed >= 2500) {
    textSize(100);
    text(nf(score / 20.0, 0, 2), 1100, 425);
  }
}

function insideStartButton(x, y) {
  return (
    x >= START_BUTTON.x && x <= START_BUTTON.x + START_BUTTON.w &&
    y >= START_BUTTON.y && y <= START_BUTTON.y + START_BUTTON.h
  );
}

function mousePressed() {
  if (status === 'taiki' && insideStartButton(mouseX, mouseY)) {
    status = 'countdown';
    countdownStartedAt = millis();
    return false;
  }
}

function keyPressed(event) {
  if (status !== 'gaming' || pendingJudgement !== null) return;

  if (keyCode === BACKSPACE) {
    // 元のProcessing版と同じく、1文字ではなく入力欄を全消去。
    typedWord = '';
    return false;
  }
  if (keyCode === ENTER || keyCode === RETURN) {
    if (typedWord !== '' && wordIndex < WORDS.length && wordY <= 890) {
      pendingJudgement = {
        correct: typedWord === WORDS[wordIndex],
        resolveAt: millis() + 500
      };
      typedWord = '';
    }
    return false;
  }
  if (key === ' ') {
    // スペースでページがスクロールするのを防ぎつつ、科目名には空白を入れる。
    if (wordY <= 890) typedWord += ' ';
    return false;
  }
}

function keyTyped(event) {
  if (status !== 'gaming' || pendingJudgement !== null || wordY > 890) return;
  // 英字・数字・記号だけ。スペースはkeyPressed側で処理する。
  if (typeof key === 'string' && key.length === 1 && key !== ' ' && !event?.ctrlKey && !event?.metaKey && !event?.altKey) {
    typedWord += key;
    return false;
  }
}

// 外部の「もう一度遊ぶ」ボタンから呼ぶ。
function restartGame() {
  status = 'taiki';
  typedWord = '';
  grade = 'S';
  gradePoint = 4;
  wordIndex = 0;
  score = 0;
  pendingJudgement = null;
  countdownStartedAt = 0;
  resultStartedAt = 0;
  resetFallingWord();
}
