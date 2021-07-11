# Contributing to OpenLitterMap

> Thank you for your interest to contribute to OpenLitterMap. You are awesome!

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with Github

We use github to host code, to track issues and feature requests, as well as accept pull requests.

### Development workflow

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

1. Fork the repo and create your branch from `master` (a guide on [how to fork a repository](https://help.github.com/articles/fork-a-repo/)).
2. Run `npm install` to setup the development environment.
3. Rub `npx react-native run-ios` or `npx react-native run-android` to run the app.
4. Do the changes you want and test them before sending a pull request

## Commit convention

Please follow the [convention]("https://www.npmjs.com/package/@commitlint/config-conventional") category(scope or module): message in your commit message while using one of the following categories:

`feat / feature`: changes that introduce new code or features

`fix`: changes that fix a bug (reference an issue if present)

`refactor`: any code related change that is not a fix, nor a feature

`docs:` changing existing or creating new documentation

`chore`: all changes to the repository that do not fit into any of the above categories

`test`: adding or updating tests

Our pre-commit hooks verify that your commit message matches this format when committing.

> Example \
> git commit -m "fix: app crash issue on tag selection"

### Sending a pull request

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that `eslint` and all tests are passing.

## Reporting issues

You can report issues on our [Issues tracker](https://github.com/OpenLitterMap/react-native/issues). Please follow the issue template when opening an issue.

## License

By contributing to OpenLitterMap, you agree that your contributions will be licensed under [GNU AGPLv3](https://choosealicense.com/licenses/agpl-3.0/) that covers the project. Feel free to contact the maintainers if that's a concern.
