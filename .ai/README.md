# Vertex AI Engineering Platform

Version: 1.0.0

Last Updated: 2026-07-16

Maintainers:

- Farooq Sheikh
- Vertex Engineering Team

> Repository-level engineering standards, workflows, reusable knowledge, and AI guidance for the Vertex Kashmir Holidays project.

---

---

# Reading Order

Every AI assistant and developer should understand the repository in the following order:

1. .ai/README.md
2. context/
3. instructions/
4. workflows/
5. skills/
6. templates/

Never begin implementation before understanding the relevant project context and engineering standards.

---

# Scope

This directory contains engineering knowledge only.

Business documentation, marketing content, legal documents, and product documentation belong elsewhere in the repository.

## Purpose

The `.ai` directory is the engineering knowledge base for this repository.

Its purpose is to provide a single source of truth for:

- Engineering standards
- Project architecture
- Coding conventions
- Development workflows
- Reusable implementation knowledge
- AI-assisted development
- Team onboarding

This repository is intentionally **AI-tool agnostic**.

The information inside this directory is written for developers first and AI assistants second.

Whether a developer uses Claude, Codex, GitHub Copilot, Cursor, Windsurf, Gemini CLI, or another coding assistant, the same engineering rules and workflows should apply.

---

# Philosophy

AI should accelerate development.

AI should never replace engineering discipline.

Every implementation must follow the same architecture, coding standards, review process, and verification steps regardless of which AI assistant is used.

The repository—not the chat history—is the source of truth.

---

# Directory Structure

.ai/

├── agents/

├── instructions/

├── skills/

├── workflows/

├── templates/

└── context/

Each directory has a different responsibility.

---

## agents/

Defines specialized engineering roles.

Examples:

- Planner
- Implementer
- Reviewer
- QA

Agents describe responsibilities.

They do not contain project knowledge.

---

## instructions/

Repository-wide engineering rules.

Examples:

- Coding standards
- Git workflow
- Commit conventions
- Testing standards
- Documentation standards
- Architecture principles

Instructions define permanent engineering rules.

---

## skills/

Reusable implementation knowledge.

Examples:

- Create Booking Module
- Add Analytics Event
- Create Prisma Migration
- Create API Endpoint
- Create SEO Metadata

Skills explain how Vertex implements recurring patterns.

---

## workflows/

Step-by-step engineering processes.

Examples:

- Feature Development
- Bug Fix
- Hotfix
- Refactoring
- Release

Workflows orchestrate agents, instructions, and skills.

---

## templates/

Reusable templates.

Examples:

- Commit Message
- Pull Request
- Task Completion Report
- ADR
- Documentation Template

---

## context/

Project knowledge.

Examples:

- Architecture
- Folder Structure
- Tech Stack
- Business Rules

Context explains how this project works.

---

# Engineering Principles

The following principles apply to every contribution.

- Keep business logic stable.
- Prefer small, focused changes.
- Avoid unnecessary abstractions.
- Reuse existing patterns.
- Keep components maintainable.
- Separate responsibilities clearly.
- Verify every change before completion.
- Document important architectural decisions.

---

# AI Development Principles

AI should:

- Understand before implementing.
- Reuse existing project patterns.
- Never invent architecture.
- Never duplicate existing functionality.
- Explain implementation decisions.
- Verify changes before completion.

---

# Verification Checklist

Every completed task should be verified using:

- TypeScript
- ESLint
- Build
- Existing functionality
- Responsive behaviour
- Accessibility
- Performance (where applicable)

---

# Long-Term Goal

The goal of this platform is to evolve Vertex Kashmir Holidays into a production-grade engineering repository where every developer—and every AI assistant—works from the same standards, processes, and architectural guidance.

---

# Versioning

Engineering documents inside `.ai` should evolve alongside the project.

Major architectural changes should update the relevant documentation before or together with implementation.

Version history is maintained through Git.
