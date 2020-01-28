This is an example repository using [theintern/intern](https://github.com/theintern/intern). Branches contain reproductions for issues found.

## Tests

`yarn test` will lint and unit test the code.

`yarn test --skip-lint` will skip linting and unit test the code.

`yarn test --browser chrome` will unit test and functional test in Chrome against hosted sites

`yarn test --browser chrome --browser firefox` will unit test and functional test against both browsers

`yarn test --browserstack` will test against BrowserStack (defaulting to IE 10)

`yarn test --skip-lint --browser ie --browserVersion 11 --browserstack` will test IE 11 on BrowserStack without linting

## Deploy

To deploy the static `public/` directory: `yarn just deploy` --> https://example-intern.maxbeatty.now.sh/

To deploy Storybook: `yarn just deploy:storybook` --> https://example-intern-stories.maxbeatty.now.sh/
