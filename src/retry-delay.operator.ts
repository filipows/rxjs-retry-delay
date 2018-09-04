import { Observable, throwError, timer } from 'rxjs';
import { finalize, mergeMap, retryWhen } from 'rxjs/operators';

export interface IRetryStratetyConfig {
  /**
   * A delay in miliseconds. Default set to 1000ms
   */
  delay?: number;
  /**
   * Number of maximum attempts.
   */
  maxRetryAttempts?: number;
  /**
   * Factor by whitch the next delay will be multiplied. Default set to 1
   */
  scalingFactor?: number;
  /**
   * List of HTTP codes to be excluded from retrying.
   */
  excludedStatusCodes?: number[];
}

const genericRetryStrategy = ({
  delay = 1000,
  maxRetryAttempts = 3,
  scalingFactor = 1,
  excludedStatusCodes = []
}: IRetryStratetyConfig = {}) => (attempts: Observable<any>) => {
  return attempts.pipe(
    mergeMap((error, i) => {
      const retryAttempt = i + 1;
      // if maximum number of retries have been met
      // or response is a status code we don't wish to retry, throw error
      if (retryAttempt > maxRetryAttempts || excludedStatusCodes.find((e) => e === error.status)) {
        return throwError(error);
      }
      const tryAfter = delay * scalingFactor ** (retryAttempt - 1);

      console.log(`Attempt ${retryAttempt}: retrying in ${tryAfter}ms`);
      // retry after 1s, 2s, etc...
      return timer(tryAfter);
    }),
    finalize(() => console.log('Done with retrying.'))
  );
};

export const retryWithDelay = (config: IRetryStratetyConfig = {}) => <T>(source: Observable<T>) =>
  source.pipe(retryWhen(genericRetryStrategy(config)));
