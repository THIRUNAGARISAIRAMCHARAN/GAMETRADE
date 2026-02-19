class GameStateManager {
  constructor() {
    this.state = {
      selectedCharacter: null,
      chapter: 1,
      // Chapter 1 flags
      visitedTown: false,
      enteredLibrary: false,
      foundTreasureMap: false,
      completedMaze: false,
      completedMining: false,
      foundTreasure: false,
      crossedRiver: false,
      metElderSage: false,
      talkedToGuide: false,
      enteredBank: false,
      learnedAccountTypes: false,
      submittedDocuments: false,
      enteredOTP: false,
      accountCreated: false,
      chapter1CompleteTown: false,
      // Chapter completion
      chapter1Complete: false,
      chapter2Complete: false,
      chapter3Complete: false,
      chapter4Complete: false,
      chapter5Complete: false,
      // Economy
      coins: 0,
      hasBankAccount: false,
      bankBalance: 0,
      accountNumber: 'AURM-' + String(Math.floor(10000 + Math.random() * 90000)),
      withdrawalLimit: 100,
      // ATM
      pin: null,
      hasATMCard: false,
      // Chapter 3 flags
      returnedFromBank: false,
      hasGroceryList: false,
      completedMarket: false,
      learnedNeedsWants: false,
      apologizedToMom: false,
      ch3MarketDone: false,
      needsMoreMoney: false,
      marketBoughtItems: [],
      // Chapter 4 flags
      receivedInterestNotification: false,
      // After ATM: mother gives grocery list again
      motherGaveGroceryListAfterATM: false,
      // UI
      currentObjective: 'Explore the school library'
    };
  }
  get(key) { return this.state[key]; }
  set(key, val) { this.state[key] = val; }
  addCoins(n) { this.state.coins += n; }
  removeCoins(n) { this.state.coins = Math.max(0, this.state.coins - n); }
  isChapterUnlocked(n) {
    if (n === 1) return true;
    return this.state['chapter' + (n - 1) + 'Complete'] === true;
  }
  completeChapter(n) { this.state['chapter' + n + 'Complete'] = true; }
  getHighestCompleted() {
    for (let i = 5; i >= 1; i--) { if (this.state['chapter' + i + 'Complete']) return i; }
    return 0;
  }
  deposit(amt) {
    if (amt > 0 && amt <= this.state.coins) {
      this.state.coins -= amt; this.state.bankBalance += amt; return true;
    }
    return false;
  }
  withdraw(amt) {
    if (amt > 0 && amt <= this.state.bankBalance && amt <= this.state.withdrawalLimit) {
      this.state.bankBalance -= amt; this.state.coins += amt; return true;
    }
    return false;
  }
  applyInterest(rate) {
    const interest = Math.floor(this.state.bankBalance * rate);
    this.state.bankBalance += interest; return interest;
  }
}
window.gameState = new GameStateManager();
