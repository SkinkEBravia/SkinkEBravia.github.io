---
title: "Git Field Notes"
description: "Operational notes on Git: multi-account SSH isolation, credential managers, and pushing from non-interactive shells."
date: 2026-11-25
topic: "Git · Tooling"
---

A running log of small Git mechanisms that save time once written down.

## Multi-account GitHub with per-repo SSH aliases

When one machine holds multiple GitHub accounts, binding each account to its own SSH host alias keeps repositories completely isolated. Other repositories continue using whatever authentication they already have.

1. Generate a dedicated Ed25519 key pair without overwriting the default `~/.ssh/id_ed25519`. Press Enter twice at the passphrase prompt if non-interactive pushes are needed.

```powershell
ssh-keygen -t ed25519 -C "2476230107qq@gmail.com" -f "$HOME\.ssh\id_ed25519_skink"
```

2. Copy the public key and register it under the target account at [github.com/settings/ssh/new](https://github.com/settings/ssh/new).

```powershell
Get-Content "$HOME\.ssh\id_ed25519_skink.pub" | Set-Clipboard
```

3. Append a dedicated host block to `~/.ssh/config`. `IdentitiesOnly yes` stops SSH from trying other loaded keys first.

```ssh-config
Host github-skink
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_skink
  IdentitiesOnly yes
```

4. Verify authentication and record GitHub's host fingerprint in `~/.ssh/known_hosts`.

```powershell
ssh -T git@github-skink
```

5. Point only the target repository's `origin` remote to the alias.

```powershell
cd D:\Resources\SkinkEBravia.github.io
git remote set-url origin git@github-skink:SkinkEBravia/SkinkEBravia.github.io.git
```

To add a second or third GitHub account later, repeat the same pattern with a new key file (`id_ed25519_<alias>`) and a new `Host github-<alias>` entry.

## Why `gh auth setup-git` clashes with multiple accounts

Running `gh auth setup-git` writes a global credential block into `~/.gitconfig` for all `https://github.com` remotes. Every HTTPS push then routes through whichever account is currently active in `gh` (`gh auth switch`). On a multi-account machine, forgetting to switch accounts before pushing sends commits under the wrong credentials.

To undo global `gh` credential takeover and return control to the previous helper:

```powershell
git config --global --remove-section credential.https://github.com
```

If you prefer staying on HTTPS with Windows Git Credential Manager (GCM) instead of SSH, bind the username per repository so GCM stores credentials keyed by `host + username`:

```powershell
cd D:\Resources\SkinkEBravia.github.io
git config --local credential.https://github.com.username SkinkEBravia
```

## Non-interactive shells and Git Credential Manager

Windows Git defaults to `credential.helper=manager` over HTTPS. In an interactive desktop terminal, GCM can read the Windows Credential Vault or open a browser OAuth window. In a detached, headless, or agent-spawned shell with redirected `stdin`, GCM cannot raise a UI prompt: it either stalls waiting for input or fails immediately when prompts are disabled:

```text
fatal: Cannot prompt because user interactivity has been disabled.
fatal: could not read Username for 'https://github.com': terminal prompts disabled
```

Per-repository SSH aliases (`Host github-skink`) avoid both failure modes: authentication happens purely through the configured private key and `known_hosts`, requiring no desktop session and no account switching.

## Pushing asset-heavy commits over HTTPS

When pushing tens of megabytes of static assets (figures, fonts, HTML bundles) over HTTPS on Windows, Git's default 1 MiB `http.postBuffer` can stall chunked uploads. Raising the buffer for that push avoids timeouts:

```powershell
git -c http.postBuffer=524288000 push --progress origin main
```
