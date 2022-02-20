// import Vue from 'vue'
// import App from './App.vue'

// Vue.config.productionTip = false

// new Vue({
//   render: h => h(App),
// }).$mount('#app')

"use strict";
import "@/assets/main.css";
import Vue from "vue/dist/vue.common";
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

new Vue({
  el: "#app",
  data: {
    initialBet: null,
    bet: null,
    turn: 0,
    turnInTerm: 0,
    offsetBenefitInTerm: 0,
    total: 0,
    loss: 0,
    situation: SITUATION_FIRST,
    resultStack: [],
    result: null,
    plusMinus: null,
    plusBet: 2,
    nextBet: null,
    assembleSpliced: false,
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
          this.getPlusBet(this.resultStack.slice(-1)[0].bet)
        );
      }
      // 直近負け勝ち
      if (this.d_situation === SITUATION_LOSE_WIN_RECENT) {
        return this.resultStack.slice(-2, -1)[0].bet + 1;
      }
      throw "no nextBet err";
    },
    recentLoseBet: function () {
      for (let i = 1; i < this.resultStack.length; i++) {
        let resultSet = this.resultStack.slice(-i)[0];
        if (resultSet === LOSE) {
          return resultSet.bet;
        }
      }
      throw "no lose result";
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
      if (this.nextBet === null) {
        this.nextBet = this.initialBet + this.getPlusBet();
      }
      this.bet = bet;
      this.assembleSpliced = false;
    },
    runResultReceiver: function (result) {
      if (result !== WIN && result !== LOSE) {
        throw "invalid result str";
      }
      this.setResult(result);
      this.setPlusMinus();
      this.stackResultSet();
      this.setSituation();
      this.countOffsetBenefitInTerm();
      this.countLoss();
      this.assembleResultSet();
      this.reduceStackWithBenefit();
      this.setNextBet();
      this.changeSituation();

      this.readyNextTurn();
    },
    setResult: function (result) {
      this.result = result;
    },
    setPlusMinus: function () {
      this.plusMinus = this.result === WIN ? this.bet : -this.bet * 2;
    },
    stackResultSet: function () {
      this.resultStack.push({
        bet: this.bet,
        result: this.result,
        plusMinus: this.plusMinus,
        loss: null,
      });
    },
    setSituation: function () {
      this.situation = this.d_situation;
    },
    countOffsetBenefitInTerm: function () {
      if (this.situation === SITUATION_LOSE_WIN_WIN_RECENT) {
        this.offsetBenefitInTerm =
          this.offsetBenefitInTerm +
          this.resultStack.slice(-3, -1)[0].plusMinus +
          this.resultStack.slice(-2, -1)[0].plusMinus +
          this.resultStack.slice(-1)[0].plusMinus;
      }
    },
    countLoss: function () {
      this.setLoss(this.plusMinus);
      let result = this.resultStack.pop();
      result.loss = this.loss;
      this.resultStack.push(result);
    },
    setLoss: function (price) {
      this.loss += price;
    },
    assembleResultSet: function () {
      if (this.situation === SITUATION_WIN_ONLY) {
        this.resultStack = [];
        return;
      }
      if (this.situation === SITUATION_LOSE_WIN_WIN_RECENT) {
        this.resultStack.splice(-3);
        this.assembleSpliced = true;
        return;
      }
    },
    reduceStackWithBenefit: function () {
      if (!this.assembleSpliced) {
        return;
      }
      let target;
      let i;
      if (this.resultStack.slice(-1)[0].result === LOSE) {
        i = -1;
        target = Math.abs(this.resultStack.slice(i)[0].plusMinus);
      } else {
        i = -2;
        target = Math.abs(this.resultStack.slice(i)[0].plusMinus);
      }
      if (target <= this.offsetBenefitInTerm) {
        this.resultStack.splice(i);
        this.offsetBenefitInTerm -= target;
      }
    },
    getPlusBet: function (bet = 0) {
      if (bet === 0) {
        this.plusBet;
        return 2;
      }
      let plusBet = Math.floor((bet - 1) / 5) + 1;
      if (plusBet < 2) {
        plusBet = 2;
      }
      plusBet = plusBet < 5 ? plusBet : 5;
      this.plusBet = plusBet;
      return plusBet;
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
    readyNextTurn: function () {
      this.totalize();
      if (this.loss >= 0) {
        this.resultStack = [];
        this.turnInTerm = 0;
      }
      this.ready(this.nextBet);
    },
    // 合計損益額にまとめあげる
    totalize: function () {
      if (this.situation === SITUATION_FIRST) {
        this.total += this.loss;
        this.loss = 0;
        this.offsetBenefitInTerm = 0;
      }
    },
  },
});
