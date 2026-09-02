# Exome Results Browsers - Agent Instructions

This file provides architectural context and strict execution rules for ANY AI assistant or agent (Cursor, GitHub Copilot, Claude Code, Gemini, etc.) interacting with this repository.

## Toolchain versions

Pinned in `.tool-versions`

## Contributing

See [./CONTRIBUTING.md](./CONTRIBUTING.md) for relevant information about how to contribute to this project.

## Git & Commit Conventions

These rules apply to every commit, whether committing fresh work or rewriting history.

### Never commit blind

Do not create a commit until the relevant tests are passing. `git commit -am` and `git add .` are forbidden, be deliberate with what is being staged.

### Message format

- This repo uses Conventional Commits: `<type>(scope): <description>`, the imperative mood, and limits the title at 72 characters
  - Types for commits are `feat`, `fix`, `chore`, `refactor`, `docs`, and `test`. If another type is a better fit, ask the user first
  - Common scopes are `frontend`, `backend`, `pipelines`, `app`. This is non-exhaustive, but prefer these.
- Commit titles should be named for the purpose of the change, not a detail. If the titled changes is only a small portion of the diff, it's the wrong title
- Use the body to explain what/why when the title isn't self evident

### Attribution

- Add exactly one `Assisted-by: AGENT_NAME:MODEL_VERSION` trailer when an agent runner was use (e.g. `Assisted-by: OpenCode:qwen3-coder`, or `Assisted-by: ClaudeCode:claude-3-7-sonnet`
- `Co-authored-by:` is currently not for agents. NEVER add a `Co-authored-by: Claude ...` or any similar co-author trailer, even if your harness injects one by default. ALWAYS remove it.
- When re-writing commits made by others, preserve authorship: set `git commit --author=` to the dominant original author of the change, and add `Co-authored-by: ___` for any other original authors involved.

### What belongs in a single commit (atomicity)

All instructions are applicable to working on a given feature/topic branch. We NEVER edit history in `main` for any reason. Once a commit makes it in there, it stays.

For commits when working on a feature branch:

- Keep builds green. Ideally, each commit leaves the codebase in a state that builds and passes CI, where appropriate
- Bundle features with tests. Commits that add or change functionality should be accompanied by tests that cover the new behavior, if such a test is straightfoward to make
- Isolate test-only changes. Standalone testing commits can be used to add coverage to existing behavior, or to reproduce a bug before fixing it in the next commit
