# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive CLI tool to backup and restore Storyblok CMS spaces. Wraps the `storyblok-backup` npm package with a `@clack/prompts` interface.

## Commands

- `npx storyblok-backup-cli` — Run the CLI via npx
- `npm start` — Run the script locally via `tsx`
- `npm run format` — Format code with Prettier
- `npm run format:check` — Check formatting
- `npm run lint` — Lint code with ESLint

## Architecture

- **TypeScript ESM project** (`"type": "module"`, strict mode, ES2022 target)
- **Entry point**: `cli.ts` — interactive CLI that prompts user to backup or restore (exposed as `bin` for npx)
- **Runtime**: `tsx` (TypeScript execution without build step)
- **Key dependencies**:
    - `storyblok-backup` — backs up and restores Storyblok space content (stories, datasources, components, etc.)
    - `zx` — shell scripting utility (imported via `zx/globals`)
    - `@clack/prompts` — interactive CLI prompts

## Code Style

- Single quotes, no semicolons, 4-space indent, 120 char width (see `.prettierrc`)

## Hosting

- GitHub: `github.com/jochenh/storyblok-backup-cli`
