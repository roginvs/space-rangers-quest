# Agent notes

## CI

CI runs in two places, and both must stay green:

- GitLab CI (`.gitlab-ci.yml`) deploys GitLab Pages.
- GitHub Actions (`.github/workflows/ci.yml`) runs on pull requests.

When changing build, test, or lint steps, update both configs.

Before opening a PR, run the same checks as CI:

```
npm run prettier-check
npm run test
npm run lint
npm run build
```
