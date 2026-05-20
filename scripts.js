const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SUITS = ['♠','♥','♦','♣'];
const RED_SUITS = new Set(['♥','♦']);
const NUM_DECKS = 2;
const DEALER_STAND = 17;
const REFILL_THRESHOLD = 20;

let deck        = [];
let playerHand  = [];
let dealerHand  = [];
let splitHand   = [];       // second hand after a split
let isSplit     = false;    // are we in a split round?
let activeHand  = 'player'; // 'player' | 'split'
let inGame      = false;

let wins = 0, losses = 0, ties = 0, hands = 0;

function delay(min = 1000, max = 1500) {
  return new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
}

function buildDeck(numDecks = 1) {
  const d = [];
  for (let n = 0; n < numDecks; n++)
    for (const s of SUITS)
      for (const r of RANKS)
        d.push({ r, s });
  return d;
}

function shuffle(d) {
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function drawCard() {
  if (deck.length < REFILL_THRESHOLD) deck = shuffle(buildDeck(NUM_DECKS));
  return deck.pop();
}

function cardValue(card) {
  if (['J','Q','K'].includes(card.r)) return 10;
  if (card.r === 'A') return 11;
  return parseInt(card.r);
}

function handTotal(hand) {
  let total = hand.reduce((sum, c) => sum + cardValue(c), 0);
  let aces  = hand.filter(c => c.r === 'A').length;
  while (total > 21 && aces-- > 0) total -= 10;
  return total;
}

function isBlackjack(hand) {
  return hand.length === 2 && handTotal(hand) === 21;
}

function isBust(hand) {
  return handTotal(hand) > 21;
}

function makeCardEl(card, faceDown = false) {
  const el = document.createElement('div');
  if (faceDown) {
    el.className = 'card back';
    return el;
  }
  el.className = `card ${RED_SUITS.has(card.s) ? 'red' : 'black'}`;
  el.innerHTML = `<span class="rank">${card.r}<br>${card.s}</span><span class="suit">${card.s}</span>`;
  return el;
}

function renderHand(containerId, hand, hideLast = false) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  hand.forEach((card, i) => container.appendChild(makeCardEl(card, hideLast && i === 1)));
}

function updateScoreBadge(id, hand, visible = true) {
  const el = document.getElementById(id);
  if (!visible) { el.textContent = '?'; el.className = 'score-badge'; return; }
  const total = handTotal(hand);
  el.textContent = total;
  el.className = 'score-badge' + (total > 21 ? ' bust' : isBlackjack(hand) ? ' bj' : '');
}

function showStatus(msg, type = '') {
  document.getElementById('status-bar').innerHTML =
    `<div class="msg ${type}">${msg}</div>`;
}

function clearStatus() {
  document.getElementById('status-bar').innerHTML = '';
}

function updateStats() {
  document.getElementById('stat-w').textContent = wins;
  document.getElementById('stat-l').textContent = losses;
  document.getElementById('stat-t').textContent = ties;
  document.getElementById('stat-h').textContent = hands;
}

// Show/hide split zone and update active-hand highlight
function syncHandHighlights() {
  const playerZone = document.getElementById('player-zone');
  const splitZone  = document.getElementById('split-zone');

  if (!isSplit) {
    playerZone.classList.remove('active-hand');
    splitZone.classList.add('hidden');
    return;
  }

  splitZone.classList.remove('hidden');
  playerZone.classList.toggle('active-hand', activeHand === 'player');
  splitZone.classList.toggle('active-hand',  activeHand === 'split');
}

// Enable / disable action buttons
function setButtons({ playing, dealerPlaying = false, canSplit = false }) {
  document.getElementById('btn-deal').disabled  = playing || dealerPlaying;
  document.getElementById('btn-hit').disabled   = !playing || dealerPlaying;
  document.getElementById('btn-stand').disabled = !playing || dealerPlaying;
  document.getElementById('btn-split').disabled = !canSplit || dealerPlaying;
}

function startGame() {
  // Reset split state
  isSplit      = false;
  activeHand   = 'player';
  splitHand    = [];
  inGame       = true;

  playerHand = [drawCard(), drawCard()];
  dealerHand = [drawCard(), drawCard()];

  clearStatus();
  renderHand('player-cards', playerHand);
  renderHand('dealer-cards', dealerHand, true);
  renderHand('split-cards', []);
  updateScoreBadge('player-score', playerHand);
  updateScoreBadge('split-score',  splitHand);
  updateScoreBadge('dealer-score', dealerHand, false);
  syncHandHighlights();

  const canSplit = canPlayerSplit();
  setButtons({ playing: true, canSplit });

  if (isBlackjack(playerHand)) {
    endRound();
  }
}

function hit() {
  if (!inGame) return;
  const hand = activeHand === 'player' ? playerHand : splitHand;
  hand.push(drawCard());

  const containerId   = activeHand === 'player' ? 'player-cards' : 'split-cards';
  const scoreBadgeId  = activeHand === 'player' ? 'player-score' : 'split-score';

  renderHand(containerId, hand);
  updateScoreBadge(scoreBadgeId, hand);
  setButtons({ playing: true, canSplit: false }); // no split after hitting

  if (isBust(hand) || handTotal(hand) === 21) {
    // If we're on the first hand of a split, advance to second
    if (isSplit && activeHand === 'player') {
      advanceToSplitHand();
    } else {
      endRound();
    }
  }
}

function stand() {
  if (!inGame) return;
  if (isSplit && activeHand === 'player') {
    advanceToSplitHand();
  } else {
    endRound();
  }
}

function split() {
  if (!canPlayerSplit()) return;

  isSplit    = true;
  activeHand = 'player';

  // Move second card to split hand, deal one new card to each
  splitHand  = [playerHand.pop()];
  playerHand.push(drawCard());
  splitHand.push(drawCard());

  renderHand('player-cards', playerHand);
  renderHand('split-cards',  splitHand);
  updateScoreBadge('player-score', playerHand);
  updateScoreBadge('split-score',  splitHand);
  syncHandHighlights();
  setButtons({ playing: true, canSplit: false });
}

function canPlayerSplit() {
  return (
    !isSplit &&
    playerHand.length === 2 &&
    cardValue(playerHand[0]) === cardValue(playerHand[1])
  );
}

function advanceToSplitHand() {
  activeHand = 'split';
  syncHandHighlights();
  setButtons({ playing: true, canSplit: false });
}

async function dealerPlay() {
  setButtons({ dealerPlaying: true })
  await delay();
  renderHand('dealer-cards', dealerHand);
  updateScoreBadge('dealer-score', dealerHand);
  
  while (handTotal(dealerHand) < DEALER_STAND) {
    await delay();
    dealerHand.push(drawCard());
    renderHand('dealer-cards', dealerHand);
    updateScoreBadge('dealer-score', dealerHand);
  }

  setButtons({ player: false});
}

function resolveHand(hand, label) {
  const pt = handTotal(hand);
  const dt = handTotal(dealerHand);

  if (isBlackjack(hand) && isBlackjack(dealerHand))  return { result: 'tie',  msg: `${label}: Push: both blackjack!` };
  if (isBlackjack(hand))                             return { result: 'win',  msg: `${label}: Blackjack! 🃏` };
  if (isBlackjack(dealerHand))                       return { result: 'lose', msg: `${label}: Dealer blackjack.` };
  if (pt > 21)                                       return { result: 'lose', msg: `${label}: Bust.` };
  if (dt > 21)                                       return { result: 'win',  msg: `${label}: Dealer busts: you win!` };
  if (pt > dt)                                       return { result: 'win',  msg: `${label}: You win (${pt} vs ${dt})!` };
  if (dt > pt)                                       return { result: 'lose', msg: `${label}: Dealer wins (${dt} vs ${pt}).` };
  return                                             { result: 'tie',  msg: `${label}: Push (${pt}).` };
}

async function endRound() {
  inGame = false;
  setButtons({ playing: false });
  await dealerPlay();
  hands++;

  if (isSplit) {
    const r1 = resolveHand(playerHand, 'Hand 1');
    const r2 = resolveHand(splitHand,  'Hand 2');

    // Tally each hand independently
    [r1, r2].forEach(({ result }) => {
      if (result === 'win')  wins++;
      else if (result === 'lose') losses++;
      else ties++;
    });

    // Pick status type: win if either won, lose if both lost, tie otherwise
    const type = (r1.result === 'win' || r2.result === 'win') ? 'win'
               : (r1.result === 'lose' && r2.result === 'lose') ? 'lose'
               : 'tie';
    showStatus(`${r1.msg} &nbsp;·&nbsp; ${r2.msg}`, type);
  } else {
    const { result, msg } = resolveHand(playerHand, 'You');
    if (result === 'win')       wins++;
    else if (result === 'lose') losses++;
    else                        ties++;
    showStatus(msg, result);
  }

  syncHandHighlights();
  updateStats();
}

deck = shuffle(buildDeck(NUM_DECKS));
setButtons({ playing: false });