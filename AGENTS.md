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

- A commit should be the smallest change that is independently complete, including any added tests. For a given commit, the code should build and pass CI (e.g. the `validate-____` `make` targets. It should not be the smallest diff.
  - Tests added to confirm behavior of something new, or something changed, should be included in the same commit as the code covered. Never create a standalone commit that just adds tests.
- Don't fragment one feature, e.g. a mechanism and its only consumer, or a UI element and additional labeling or styling, those belong together in a single commit. Group by logical change, not file type.
- Prefer fewer complete commits over many partial ones. Most topic branches on scoped changes will be 1-3 commits, as a rule of thumb.
- Before splitting a commit into two, consider if a reviewer could review these two individual commits alone, and would they both pass CI. If not, they belong together.
- If it is unclear whether to split a commit or not, e.g. in the case of creating a well factored reusable component, and the inclusion of the component in one place, one could decide to have that be a single commit or two. In the case of such ambiguity, ask the user what they would prefer before committing.
