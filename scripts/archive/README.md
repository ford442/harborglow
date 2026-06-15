# Archived one-shot codemod scripts

These six scripts (`fix_components.cjs`, `fix_deps.cjs`, `fix_hologram.cjs`,
`fix_let_const.cjs`, `fix_lightshow.cjs`, `fix_lint.cjs`) were one-shot codemods
run against the codebase during early refactoring (PR #8 and earlier, 2026-04-19).

They are **not** part of the build, not referenced by `package.json` scripts, and
not invoked by any CI workflow. They are preserved here as a historical record of
the automated transforms that shaped the initial codebase.
