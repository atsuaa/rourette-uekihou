"use strict";
const SITUATION_FIRST = 0;
const SITUATION_WIN_ONLY = 1;
const SITUATION_LOSE_RECENT = 2;
const SITUATION_LOSE_WIN_RECENT = 3;
const SITUATION_LOSE_WIN_WIN_RECENT = 4;
const WIN = "w";
const LOSE = "l";

const countUpLogic = {
  half: function (bet) {
    return bet + Math.floor(bet / 2);
  },
  plusX: function (bet, x) {
    return bet + x;
  },
};

var app = new Vue({
  el: "#app",
  data: {
    initialBet: null,
    bet: null,
    turn: 0,
    turnInTerm: 0,
    total: 0,
    loss: 0,
    situation: SITUATION_FIRST,
    resultStack: [],
    result: null,
    plusBet: 2,
    nextBet: null,
  },
  computed: {
    d_nextBet: function () {
      // lossを持ち直し・最初
      if (this.loss >= 0 || this.situation === SITUATION_FIRST) {
        return this.initialBet;
      }
      // 直近負け
      if (this.d_situation === SITUATION_LOSE_RECENT) {
        return countUpLogic.plusX(
          this.resultStack.slice(-1)[0].bet,
          this.plusBet
        );
      }
      // 直近負け勝ち
      if (this.d_situation === SITUATION_LOSE_WIN_RECENT) {
        return this.resultStack.slice(-2, -1)[0].bet + 1;
      }
      throw "no nextBet err";
    },
    d_situation: function () {
      // １回目・結果が相殺されて空
      if (this.resultStack.length < 1) {
        return SITUATION_FIRST;
      }
      // 勝ちのみ
      if (
        this.resultStack.filter((resultSet) => resultSet.result === LOSE)
          .length < 1
      ) {
        return SITUATION_WIN_ONLY;
      }
      // 直近負け
      if (this.resultStack.slice(-1)[0].result === LOSE) {
        return SITUATION_LOSE_RECENT;
      }
      // 直近負け勝ち
      if (this.resultStack.slice(-2, -1)[0].result === LOSE) {
        return SITUATION_LOSE_WIN_RECENT;
      }
      // 直近負け勝ち勝ち
      return SITUATION_LOSE_WIN_WIN_RECENT;
    },
    reverseResultStack() {
      return this.resultStack.slice().reverse();
    },
  },
  mounted: function () {
    this.init();
    this.ready(this.initialBet);
  },
  methods: {
    dispResultText: function (result) {
      if (result !== WIN && result !== LOSE) {
        throw "invalid result";
      }
      return result === WIN ? "win" : "lose";
    },
    init: function () {
      this.initialBet = 5;
    },
    ready: function (bet = 0) {
      this.turn++;
      this.turnInTerm++;
      this.bet = bet;
    },
    runResultReceiver: function (result) {
      if (result !== WIN && result !== LOSE) {
        throw "invalid result str";
      }
      this.setResult(result);
      this.stackResultSet();
      this.setSituation();
      this.countLoss();
      this.assembleResultSet();
      this.setPlusBet();
      this.setNextBet();
      this.changeSituation();

      this.readyNextTurn();
    },
    setResult: function (result) {
      this.result = result;
    },
    stackResultSet: function () {
      this.resultStack.push({
        bet: this.bet,
        result: this.result,
        loss: null,
      });
    },
    assembleResultSet: function () {
      if (this.situation === SITUATION_WIN_ONLY) {
        this.resultStack = [];
        return;
      }
      if (this.situation === SITUATION_LOSE_WIN_WIN_RECENT) {
        this.resultStack.splice(-3);
        return;
      }
    },
    countLoss: function () {
      this.setLoss(this.result === WIN ? this.bet : -this.bet * 2);
      let result = this.resultStack.pop();
      result.loss = this.loss;
      this.resultStack.push(result);
    },
    setLoss: function (price) {
      this.loss += price;
    },
    setSituation: function () {
      this.situation = this.d_situation;
    },
    setNextBet: function () {
      this.nextBet = this.d_nextBet;
    },
    changeSituation: function () {
      // 損失額がプラス
      if (this.loss >= 0) {
        this.situation = SITUATION_FIRST;
        return;
      }
      // 勝ち
      if (this.situation === SITUATION_WIN_ONLY) {
        this.situation = SITUATION_FIRST;
        return;
      }
      // 相殺勝ち
      if (this.situation === SITUATION_LOSE_WIN_WIN_RECENT) {
        // 直近負け
        if (this.resultStack.slice(-1)[0].result === LOSE) {
          this.situation = SITUATION_LOSE_RECENT;
        } else if (this.resultStack.slice(-2, -1)[0].result === LOSE) {
          this.situation = SITUATION_LOSE_WIN_RECENT;
        } else {
          throw "bad situation 3";
        }
      }
    },
    // 合計損益額にまとめあげる
    totalize: function () {
      if (this.situation === SITUATION_FIRST) {
        this.total += this.loss;
        this.loss = 0;
      }
    },
    readyNextTurn: function () {
      this.totalize();
      if (this.loss >= 0) {
        this.resultStack = [];
        this.turnInTerm = 0;
      }
      this.ready(this.nextBet);
    },
    setPlusBet: function () {
      // if (this.situation === SITUATION_LOSE_WIN_WIN_RECENT) {
      //   this.plusBet = this.plusBet > 3 ? this.plusBet - 1 : 2;
      // }
      // if (this.turnInTerm % 5 === 0) {
      //   this.plusBet = this.plusBet < 4 ? this.plusBet + 1 : 5;
      // }
      let plusBet = Math.floor(this.resultStack.slice(-1)[0].bet / 5) + 1;
      this.plusBet = plusBet < 5 ? plusBet : 5;
    },
  },
});
