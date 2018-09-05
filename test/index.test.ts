import { TestScheduler } from "rxjs/testing";
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
});