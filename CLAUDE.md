# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start Next.js development server with turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands
- `docker-compose up -d` - Start PostgreSQL database in background
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma migrate dev` - Create and apply database migrations
- `npx prisma studio` - Open database browser interface

## Architecture Overview

This is an AI-powered design feedback management system that processes Figma comments and converts them into structured development tasks.

### Core Data Flow
1. **Figma Integration**: Extract comments from Figma files via API
2. **AI Processing**: Use OpenAI to analyze feedback and generate structured tasks
3. **Task Management**: Display tasks in a Kanban-style dashboard

### Key Components

#### Database Models (Prisma)
- **User**: System users with email/name
- **DesignFile**: Figma files with metadata (figmaFileId, name, url)
- **Feedback**: Raw Figma comments with AI processing flags
- **Task**: Generated development tasks with status tracking

#### Core Services
- **FigmaApiClient** (`lib/figmaApiClient.ts`): Handles Figma API communication
- **AI Analysis** (`utils/aiAnalysis.ts`): OpenAI integration for feedback processing
- **Database Client** (`lib/prismaClient.ts`): Prisma PostgreSQL connection

#### API Routes Structure
- `/api/figma/comments` - Fetch comments from Figma
- `/api/figma/import` - Import Figma file and process comments
- `/api/nlp/process` - AI processing of feedback
- `/api/tasks` - Task CRUD operations
- `/api/debug` - Development debugging endpoints

### Task Status Flow
Tasks progress through: `backlog` -> `todo` -> `in_progress` -> `in_review` -> `blocked` -> `done`

### AI Analysis Structure
Each task includes AI-generated metadata:
- Category: visual, functional, content, usability, performance
- Action Type: fix, improve, add, remove
- Priority: low, medium, high
- Estimated Effort: low, medium, high
- Urgency: 1-10 scale
- Developer Notes: Technical implementation guidance

## Environment Configuration

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `FIGMA_ACCESS_TOKEN` - Figma API token (starts with `figd_`)
- `OPENAI_API_KEY` - OpenAI API key for AI processing

## Technology Stack

- **Frontend**: Next.js 15 with React 19, TailwindCSS 4
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT for feedback analysis
- **External API**: Figma API for design file access
- **Development**: TypeScript, ESLint

## File Organization

- `/app` - Next.js App Router pages and API routes
- `/components` - React components (Dashboard, task management)
- `/lib` - Shared utilities (API clients, database)
- `/types` - TypeScript type definitions
- `/prisma` - Database schema and migrations
- `/utils` - Helper functions (AI analysis, etc.)