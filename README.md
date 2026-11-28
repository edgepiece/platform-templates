# platform-templates

Shared CI/CD templates for Edgepiece repositories. Product repositories call these templates instead of keeping their own copies of pipeline logic.

## Composition layers

| Layer | Purpose | Mechanism | Location |
|---|---|---|---|
| 1. Step | One task, such as restore, build or test | Composite action | `<domain>/<task>/action.yml` |
| 2. Pipeline stage | The steps a stage runs and their order | Reusable workflow | `.github/workflows/<name>.yml` |
| 3. Consumer | One call per stage, with a few inputs | The consuming repo's workflow | Consuming repo |

- Consumers call layer 2. A change to a stage is made once here and reaches each consumer when it moves to the new version.
- Layer 1 actions remain callable for repositories whose needs a stage does not cover.
- A layer 1 action is created when a task is reused or carries its own scripts or configuration. Otherwise the step stays in the stage.
- Stage inputs are kept few.

## Repository layout

- `.github/workflows/self-ci.yml` is this repository's own pipeline. Every other file in `.github/workflows/` is a template (`on: workflow_call`). GitHub does not allow subfolders there.
- Templates are named by what they do, with the domain first where there is one: `pr-title.yml`, `dotnet-build.yml`.
- Composite actions and the files they need live together in domain folders, such as `dotnet/` or `terraform/`.

## Templates

| Template | Purpose | Required permissions |
|---|---|---|
| [`pr-title.yml`](.github/workflows/pr-title.yml) | Fails a pull request whose title is not a conventional commit | None |

## Calling a template

Pin to the commit SHA of a release, with the tag as a comment. Branch names and floating tags are not used.

```yaml
name: PR title

on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

permissions: {}

jobs:
  pr-title:
    uses: edgepiece/platform-templates/.github/workflows/pr-title.yml@<commit-sha> # vX.Y.Z
```

The status check is named `<caller job> / <template job>`, here `pr-title / check`. Required checks in the consumer's ruleset use that name.

A template cannot have more permissions than the calling job grants.

## Versioning

- Releases are created automatically on merge to `main`, from pull request titles.
- One version covers the whole repository.
- A change that consumers use is titled `feat:` or `fix:`. Other types do not produce a release.
- A breaking change is marked with `!` in the title. While the version is 0.x it raises the minor version.
- Consumers upgrade by changing the pinned SHA.

## Changing a template

`self-ci.yml` calls templates by local path (`./.github/workflows/...`), so a pull request runs its own version of a template. A new gate is proven to fail on a throwaway pull request before consumers rely on it.
