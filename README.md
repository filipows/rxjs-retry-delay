# RxJS-retry-delay operator for rxjs@^6.0.0

RxJS retry pipeable operator that supports delay and max attempts strategy

## Prerequisites

```
rxjs: ^6.0.0
```

## Installation and Usage

```sh
npm install rxjs-retry-delay
```

Basic usage with default values:
```js
import { ajax } from 'rxjs/ajax';
import { retryWithDelay } from 'rxjs-retry-delay';

function getUserById(id) {
  return ajax.getJSON(`https://jsonplaceholder.typicode.com/users/${id}`)
    .pipe(retryWithDelay());
}
```
Example above will retry 3 times with interval of 1s


```js
function getUserById(id) {
  return ajax.getJSON(`https://jsonplaceholder.typicode.com/users/${id}`).pipe(
    retryWithDelay({
      delay: 1000,
      maxRetryAttempts: 5,
      scalingFactor: 2
    })
  );
}
```
Example above will retry after 1s, 2s, 4s, 8s, 16s



In `excludedStatusCodes` we can pass response statuses after which we don't want to retry
```js
function getUserById(id) {
  return ajax.getJSON(`https://jsonplaceholder.typicode.com/users/${id}`).pipe(
    retryWithDelay({
      delay: 1000,
      maxRetryAttempts: 10,
      scalingFactor: 2,
      excludedStatusCodes: [500]
    })
  );
}
```
In example above, when response status is `500` it will throw error immediately.

## Running the tests

```
npm test
```
or
```
npm run test:watch
```

## Authors

* **Chris Filipowski** - [filipows](https://github.com/filipows)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details