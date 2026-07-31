# Activating the git history

The full history of this audit — 8 commits, from the broken baseline to the current
state — is in the `git-history/` folder. It is a complete git directory, just not
named `.git` yet.

It could not be written as `.git` directly: the folder is on a mount that does not
allow deleting files, and git deletes a lock file on every single operation. The
first `git init` left a stale `.git/HEAD.lock` behind and jammed. Windows has no
such restriction, so two commands finish the job.

## Do this once, in PowerShell, from inside this folder

```powershell
Remove-Item -Recurse -Force .git          # the jammed empty repo
Rename-Item git-history .git
git log --oneline                          # should list 8 commits
git status                                 # should say working tree clean
```

If `git status` shows files as modified straight away, run `git config core.fileMode false`.

## What you get

```
e24a20c  Third pass: generate the disabled constraint, add the inverse text roles
2660ec2  Fix nine problems the previous four commits introduced
7cf5f90  Reconcile all five docs with what the build actually emits
8caf077  Add the missing semantic roles; fix quiet-text, chart and disabled contrast
858fd4a  Remove the last literals above tier 1; enforce rule 1; fix elevation strength
d9f2421  Fix six live token collisions, the disabled no-op, and the ungated fill states
11b621b  Recover build/harness.mjs and build/shipped.mjs; the build runs again
ce4edf4  Baseline: state as audited (build does not run)
```

`ce4edf4` is the folder exactly as it arrived, committed before anything was
touched, so every change is diffable and revertible:

```powershell
git show 858fd4a                  # one fix group
git diff ce4edf4 HEAD -- dist/    # everything that changed in the CSS
git diff ce4edf4 HEAD --stat      # the whole shape of it
```

The commit messages carry the reasoning — what was wrong, what the measured values
were before and after, and why each approach was chosen. They are the detailed
record; `docs/DECISIONS.md` sections I, I11 and I12 are the summary.

You can delete this file once the rename is done.
