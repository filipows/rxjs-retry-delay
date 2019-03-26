
// Testing RxJS Code with Marble Diagrams:
// https://github.com/ReactiveX/rxjs/blob/master/doc/marble-testing.md

import { TestScheduler } from "rxjs/testing";
import { iif } from 'rxjs';
import { retryWithDelay } from "../src";

describe("rxjs-retry-delay", () => {
  let scheduler: TestScheduler;
  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it("should do nothing with maxRetryAttempts: 0 and delay: 0", () => {
    scheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const source   = cold("-a--b--c---#");
      const subs     =      "^----------!";
      const expected =      "-a--b--c---#";

      const result = source.pipe(retryWithDelay({ maxRetryAttempts: 0, delay: 0 }))

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });

  it("should replicate retry(1) with maxRetryAttempts: 1 and delay: 0", () => {
    scheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const source   = cold("--1-2-3-#");
      const subs     =     ["^-------!", 
                            "--------^-------!"];
      const expected =      "--1-2-3---1-2-3-#";

      const result = source.pipe(retryWithDelay({maxRetryAttempts: 1, delay: 0}));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });

  it("should replicate retry(2) with maxRetryAttampts: 2 and delay: 0", () => {
    scheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const source   = cold("--1-2-3-#");
      const subs     =     ["^-------!", 
                            "--------^-------!",
                            "----------------^-------!"];
      const expected =      "--1-2-3---1-2-3---1-2-3-#";

      const result = source.pipe(retryWithDelay({maxRetryAttempts: 2, delay: 0}));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });


  it("should retry 2 times with 2ms delays", () => {
    scheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const source   = cold("--1-2-3-#");
      const subs     =     ["^-------!", 
                            "-------- 2ms ^-------!",
                            "-------- 2ms -------- 2ms ^-------!"];
      const expected =      "--1-2-3- 2ms --1-2-3- 2ms --1-2-3-#";

      const result = source.pipe(retryWithDelay({maxRetryAttempts: 2, delay: 2}));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });


  it("should retry 3 times with delays: 2ms, 4ms, 8ms", () => {
    scheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const source   = cold("--1-2-3-#");
      const subs     =     ["^-------!", 
                            "-------- 2ms ^-------!",
                            "-------- 2ms -------- 4ms ^-------!",
                            "-------- 2ms -------- 4ms -------- 8ms ^-------!"];
      const expected =      "--1-2-3- 2ms --1-2-3- 4ms --1-2-3- 8ms --1-2-3-#";

      const result = source.pipe(retryWithDelay({maxRetryAttempts: 3, delay: 2, scalingFactor: 2}));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });


  it("should retry 2 times and emit error signal", () => {
    scheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const source   = cold("--------#");
      const subs     =     ["^-------!", 
                            "--------^-------!",
                            "----------------^-------!"];
      const expected =      "------------------------#";

      const result = source.pipe(retryWithDelay({maxRetryAttempts: 2, delay: 0, scalingFactor: 2, resetRetryCountOnEmission: true}));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  }); 


  it(`should reset retry counter on successful emission when resetRetryCountOnEmission set to true;  
       should retry successfully 2 times and repeat the whole sequence, 
       on 3rd subscription when source observable will start failing, should retry 5 times and emit error signal`, () => {
    scheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;

      let subscriptionCount = 0;
      const normalObs  = cold("-1-2-3#");
      const failingObs = cold(                  "----#");
      const source     = iif( () => (subscriptionCount++ < 3), normalObs, failingObs);
      const normalSubs =     ["^-----!",
                              "------^-----!",                // 1st successful retry (resets maxRetryAttempts)
                              "------------^-----!"];         // 2nd successful retry (resets maxRetryAttempts)
      const failingSubs =   [ "------------------^---!",                  // 1st unsuccessful retry
                              "----------------------^---!",              // 2nd unsuccessful retry
                              "--------------------------^---!",          // 3rd unsuccessful retry
                              "------------------------------^---!",      // 4th unsuccessful retry
                              "----------------------------------^---!"]; // 5th unsuccessful retry
      const expected =        "-1-2-3-1-2-3-1-2-3--------------------#";

      const result = source.pipe(retryWithDelay({maxRetryAttempts: 5, delay: 0, scalingFactor: 2, resetRetryCountOnEmission: true}));

      expectObservable(result).toBe(expected);
      expectSubscriptions(normalObs.subscriptions).toBe(normalSubs);
      expectSubscriptions(failingObs.subscriptions).toBe(failingSubs);
    });
  }); 

  it(`should not reset the retry counter on succesfull emission when resetRetryCountOnEmission set to false;
        should retry 5 times, no matter whether there was successful emission or not`, () => {
    scheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;

      let currentSubscriptionCount = 0;
      const normalObs  = cold("-1-2-3#");
      const failingObs = cold(                  "----#");
      const source     = iif( () => (currentSubscriptionCount++ < 3), normalObs, failingObs);
      const normalSubs =     ["^-----!",
                              "------^-----!",                // 1st successful retry        (1st in general)
                              "------------^-----!"];         // 2nd successful retry        (2nd in general)
      const failingSubs =   [ "------------------^---!",           // 1st unsuccessful retry (3rd in general)
                              "----------------------^---!",       // 2nd unsuccessful retry (4th in general)
                              "--------------------------^---!"]   // 3rd unsuccessful retry (5th in general)
      const expected =        "-1-2-3-1-2-3-1-2-3------------#";

      const result = source.pipe(retryWithDelay({maxRetryAttempts: 5, delay: 0, scalingFactor: 2, resetRetryCountOnEmission: false}));

      expectObservable(result).toBe(expected);
      expectSubscriptions(normalObs.subscriptions).toBe(normalSubs);
      expectSubscriptions(failingObs.subscriptions).toBe(failingSubs);
    });
  }); 
});