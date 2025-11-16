// ====== CONFIG ======
const START_BALANCE = 1000;

// Keys for localStorage
const BALANCE_KEY = "pp_balance";
const USERNAME_KEY = "pp_username";

// ====== STATE ======
let balance = START_BALANCE;
let selectedChoice = null; // for coin flip
let bonusClaimed = false;  // to stop multiple bonus claims in one session
let activityLog = [];      // recent activity (not stored, only this session)

// ====== STORAGE HELPERS ======
function loadBalance() {
  const stored = localStorage.getItem(BALANCE_KEY);
  if (stored !== null) {
    const value = parseInt(stored, 10);
    if (!isNaN(value) && value >= 0) {
      balance = value;
    }
  }
}

function saveBalance() {
  localStorage.setItem(BALANCE_KEY, String(balance));
}

function loadUsername() {
  const stored = localStorage.getItem(USERNAME_KEY);
  if (stored && stored.trim().length > 0) {
    return stored.trim();
  }
  return "Guest";
}

function saveUsername(name) {
  localStorage.setItem(USERNAME_KEY, name);
}

// ====== UI HELPERS ======
function updateBalance() {
  const balanceSpan = document.getElementById("balance");
  if (balanceSpan) {
    balanceSpan.textContent = balance;
  }
  saveBalance();
}

function showMessage(text) {
  const resultDiv = document.getElementById("result");
  if (resultDiv) {
    resultDiv.textContent = text;
  }
}

function showDiceMessage(text) {
  const diceResultDiv = document.getElementById("dice-result");
  if (diceResultDiv) {
    diceResultDiv.textContent = text;
  }
}

function updateUsernameDisplay(name) {
  const usernameDisplay = document.getElementById("username-display");
  if (usernameDisplay) {
    usernameDisplay.textContent = name;
  }
}

// Activity log: add message + render
function addActivity(text) {
  const time = new Date().toLocaleTimeString();
  const entry = `${time} — ${text}`;

  // Newest at the top
  activityLog.unshift(entry);

  // Keep only last 8 items
  if (activityLog.length > 8) {
    activityLog.pop();
  }

  const list = document.getElementById("activity-list");
  if (!list) return;

  // Clear
  list.innerHTML = "";

  // Rebuild
  activityLog.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

// ====== MAIN ======
document.addEventListener("DOMContentLoaded", () => {
  // Load saved data
  loadBalance();
  updateBalance();

  const currentName = loadUsername();
  updateUsernameDisplay(currentName);

  // Initial activity message
  addActivity("Session started. Have fun! 🎮");

  // ---- Username form ----
  const usernameForm = document.getElementById("username-form");
  const usernameInput = document.getElementById("username-input");

  if (usernameInput) {
    usernameInput.value = currentName === "Guest" ? "" : currentName;
  }

  if (usernameForm) {
    usernameForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const newName = usernameInput.value.trim();

      if (newName.length === 0) {
        alert("Please enter a valid username.");
        return;
      }

      saveUsername(newName);
      updateUsernameDisplay(newName);
      addActivity(`Username set to "${newName}".`);
      alert(`Username saved as "${newName}".`);
    });
  }

  // ---- Daily Bonus & Reset Buttons ----
  const bonusBtn = document.getElementById("bonus-btn");
  const resetBtn = document.getElementById("reset-btn");

  bonusBtn.addEventListener("click", () => {
    if (bonusClaimed) {
      return;
    }

    const bonusAmount = 100;
    balance += bonusAmount;
    bonusClaimed = true;
    updateBalance();

    bonusBtn.textContent = "Bonus claimed ✅";
    bonusBtn.disabled = true;

    const msg = `You claimed +${bonusAmount} daily bonus! 🪙`;
    showMessage(msg);
    addActivity(msg);
  });

  resetBtn.addEventListener("click", () => {
    balance = START_BALANCE;
    updateBalance();

    bonusClaimed = false;
    bonusBtn.disabled = false;
    bonusBtn.textContent = "Claim Daily +100 🪙";

    const msg = "Balance reset to starting amount.";
    showMessage(msg);
    showDiceMessage("");
    addActivity(msg);
  });

  // ---- Coin Flip Game ----
  const choiceButtons = document.querySelectorAll(".choice-btn");

  choiceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      choiceButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedChoice = btn.dataset.choice; // "heads" or "tails"
    });
  });

  const playBtn = document.getElementById("play-btn");

  playBtn.addEventListener("click", () => {
    const betInput = document.getElementById("bet-amount");
    const bet = parseInt(betInput.value, 10);

    if (!selectedChoice) {
      const msg = "Select Heads or Tails first.";
      showMessage(msg);
      return;
    }

    if (isNaN(bet) || bet <= 0) {
      const msg = "Enter a valid bet amount.";
      showMessage(msg);
      return;
    }

    if (bet > balance) {
      const msg = "You don't have enough points for that bet.";
      showMessage(msg);
      return;
    }

    // Take bet
    balance -= bet;

    const outcomes = ["heads", "tails"];
    const randomIndex = Math.floor(Math.random() * outcomes.length);
    const result = outcomes[randomIndex];

    let message = `Coin shows ${result.toUpperCase()}. `;
    let activityText = `Coin Flip: bet ${bet}, result ${result.toUpperCase()}`;

    if (result === selectedChoice) {
      const winAmount = bet * 2;
      balance += winAmount;
      message += `You won ${winAmount} points! 🎉`;
      activityText += ` — WON ${winAmount}`;
    } else {
      message += `You lost ${bet} points. 😢`;
      activityText += ` — LOST ${bet}`;
    }

    updateBalance();
    showMessage(message);
    addActivity(activityText);
  });

  // ---- Dice Roll Game ----
  const dicePlayBtn = document.getElementById("dice-play-btn");
  const diceChoiceSelect = document.getElementById("dice-choice");
  const diceBetInput = document.getElementById("dice-bet-amount");

  dicePlayBtn.addEventListener("click", () => {
    const bet = parseInt(diceBetInput.value, 10);
    const chosenNumber = parseInt(diceChoiceSelect.value, 10);

    if (isNaN(bet) || bet <= 0) {
      const msg = "Enter a valid bet amount.";
      showDiceMessage(msg);
      return;
    }

    if (bet > balance) {
      const msg = "You don't have enough points for that bet.";
      showDiceMessage(msg);
      return;
    }

    // Take bet
    balance -= bet;

    const rolled = Math.floor(Math.random() * 6) + 1;

    let message = `Dice shows ${rolled}. `;
    let activityText = `Dice Roll: bet ${bet}, picked ${chosenNumber}, rolled ${rolled}`;

    if (rolled === chosenNumber) {
      const winAmount = bet * 6;
      balance += winAmount;
      message += `You picked ${chosenNumber} and WON ${winAmount} points! 🎉`;
      activityText += ` — WON ${winAmount}`;
    } else {
      message += `You picked ${chosenNumber} and lost ${bet} points. 😢`;
      activityText += ` — LOST ${bet}`;
    }

    updateBalance();
    showDiceMessage(message);
    addActivity(activityText);
  });
});

