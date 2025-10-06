# HiTouchCX Backend Contributor Guide

Welcome to the HiTouchCX backend. This guide walks you through getting set up, collaborating with the team, and following the conventions that keep the project healthy.

## Project Overview
- Runtime: Node.js with Express (`app.js`, `server.js`)
- ORM: Prisma (`prisma/schema.prisma`, generated client in `src/generated/prisma`)
- Database: PostgreSQL (Supabase connection strings supplied through environment variables)
- Tooling: Nodemon for live reload, ESLint + Prettier for formatting, Jest + Supertest for tests

## Prerequisites
- Install Node.js 20 LTS (or newer LTS) and npm 10+
- Install Git 2.45+
- Ensure access to the shared Supabase/PostgreSQL credentials (see `docs/env.txt`)
- Optional: Docker Desktop if you plan to run PostgreSQL locally instead of Supabase

## Initial Repository Setup
1. Fork the repository to your personal GitHub account (if you do not have push rights to the main repo).
2. Clone your fork: `git clone https://github.com/<your-username>/HitouchCx_Backend.git`
3. Change into the project directory: `cd HitouchCx_Backend`
4. Add the main repository as an upstream remote to keep your fork up to date:
   - `git remote add upstream https://github.com/HitouchCx/HitouchCx_Backend.git`
5. Install dependencies: `npm install`
6. Copy the environment template and adjust secrets for your local setup:
   - `cp docs/env.txt .env`
   - Update `DATABASE_URL`, `DIRECT_URL`, and any other secrets as needed. Never commit secrets.
7. Generate the Prisma client whenever the schema changes: `npx prisma generate`

## Keeping Your Local `main` Updated
- `git checkout main`
- `git fetch upstream`
- `git pull --rebase upstream main`
- Push the refreshed main to your fork if needed: `git push origin main`

## Creating and Switching Branches
1. Start from an up-to-date `main` (see above).
2. Create a feature branch with a descriptive name using either syntax:
   - `git checkout -b feature/describe-change`
   - `git switch -c fix/bug-id`
3. Switch back to `main` when required: `git checkout main` or `git switch main`
4. Move back to your feature branch at any time: `git checkout feature/describe-change`
5. Push the branch to your fork and set the upstream: `git push -u origin feature/describe-change`
6. Keep your branch synced by rebasing on top of the latest main periodically:
   - `git fetch upstream`
   - `git rebase upstream/main`

## Project Structure Highlights
- `server.js` boots the application and manages graceful shutdown.
- `app.js` registers global Express middleware (JSON parsing, CORS, Helmet, logging) and the root health check.
- `src/config/prismaClient.js` exports a Prisma client connected to Supabase.
- `src/middleware`, `src/routes`, `src/controllers`, `src/services`, `src/utils`, and `src/validator` hold middleware, routing, business logic, helpers, and data validation.
- `src/tests` is reserved for Jest test suites (unit and integration).

## Environment and Database Tasks
- Ensure your `.env` file contains the correct Supabase URLs and `PORT`.
- Run database migrations locally when schema changes occur:
  - Create a migration: `npx prisma migrate dev --name <meaningful-name>`
  - After pulling down new migrations: `npx prisma migrate deploy`
- Inspect data locally with Prisma Studio: `npx prisma studio`

## Running the Application
- Development server with hot reload: `npm start` (nodemon runs `server.js`)
- Verify the health check at `http://localhost:<PORT>/`

## Quality Gates Before Commit
- Format sources: `npx prettier --write .`
- Lint for code-quality issues: `npx eslint .`
- Run automated tests: `npm test`
  - Add or update tests in `src/tests` for all non-trivial changes.
- Confirm Prisma client is regenerated if `schema.prisma` changed: `npx prisma generate`

## Commit Message Guidelines
- Follow Conventional Commits where possible (e.g., `feat: add customer onboarding route`, `fix: handle prisma disconnect timeout`).
- Keep commits small and logically grouped to simplify review.

## Pull Request Checklist
- Rebase on the latest `main` before opening the PR.
- Ensure all quality gates pass locally.
- Update or add documentation when behaviour changes.
- Include context in the PR description: problem statement, solution outline, testing evidence.
- Request at least one review and address feedback promptly.

## Coding Standards
- Prettier configuration is defined in `.prettierrc`; use double quotes, trailing commas, two-space indentation, and LF line endings.
- ESLint (configured in `.eslintrc` when present) enforces best practices. Fix or justify any lint warnings.
- Aim for validated inputs in controllers and services; leverage validators in `src/validator`.
- Handle errors through the central error middleware (`src/middleware/ErrorHandler.js`) and supply helpful log messages.

## Working With Issues
- When you start work, assign yourself to the issue (GitHub Issues/Jira) and reference it in commits (`fixes #123`).
- Break large tasks into smaller PRs whenever feasible.

## Communication and Support
- Surface blockers early in the team channel or issue thread.
- Document noteworthy architectural or configuration changes in `/docs`.
- For emergencies (e.g., failing production build), coordinate with a maintainer before force-pushing or hotfixing.

## Useful References
- Prisma docs: https://www.prisma.io/docs
- Express docs: https://expressjs.com/
- Jest docs: https://jestjs.io/

Following this guide will help keep the project stable and predictable while enabling you to deliver features efficiently. Welcome aboard!
