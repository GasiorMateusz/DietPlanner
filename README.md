# Diet Planner (MVP)

A web application designed to streamline the work of dietitians by automating and accelerating the creation of personalized, 1-day meal plans using AI.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
  - [Key Features](#key-features)
  - [Out of Scope (MVP Boundaries)](#out-of-scope-mvp-boundaries)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Diet Planner is a Minimum Viable Product (MVP) web application built to assist dietitians. It automates the initial creation of personalized, 1-day meal plans by integrating with an AI language model (via OpenRouter).

The core workflow is a three-step process:

1. **Form Input**: The dietitian fills out a structured form with patient parameters, caloric goals, macronutrients, and exclusions.
2. **AI Generation**: The AI generates a 1-day meal plan in a conversational interface, allowing for iterative corrections (e.g., "Change dinner to be dairy-free").
3. **Manual Edit & Export**: Once accepted, the plan is transferred to a text editor for final manual modifications, saving, and exporting to a .doc file.

This application is intended exclusively for use by professional dietitians.

## Tech Stack

The project uses the following technologies:

### Frontend

- **Astro 4** - Fast, performant static site generation with minimal JavaScript
- **React 19** - Interactive components (e.g., chat, editor)
- **React Hook Form** - Efficient form state management and validation
- **TypeScript 5** - Static type checking
- **Tailwind 4** - Utility-first CSS styling
- **Shadcn/ui** - Base library of accessible React components

### Backend

- **Supabase** - Comprehensive BaaS (Backend-as-a-Service) solution providing:
  - PostgreSQL Database
  - User Authentication
  - SDKs for backend operations

### AI

- **Openrouter.ai** - Access to a wide range of AI models (OpenAI, Anthropic, Google, etc.) to power the meal plan generation
- **Model Configuration** - The AI model used for conversations is centralized in `src/lib/ai/openrouter.service.ts` as the `DEFAULT_AI_MODEL` constant. Currently set to `openai/gpt-4.1-nano`. To change the model, update this constant only.

### Testing

- **Vitest** - Primary test runner for unit and integration tests
- **React Testing Library** - Component testing utilities for React components
- **@testing-library/jest-dom** - DOM matchers for enhanced assertions
- **MSW (Mock Service Worker)** - API mocking for unit tests and integration testing of external services (e.g., OpenRouter API)
- **Supertest** - HTTP assertions for API endpoint testing
- **Playwright** - Cross-browser end-to-end (E2E) testing framework supporting Chromium, Firefox, and WebKit with built-in test runner, reporting, and screenshot/video capture capabilities

### CI/CD & Hosting

- **Github Actions** - CI/CD pipelines
- **DigitalOcean** - Hosting the application via a Docker image

## Getting Started Locally

To set up and run this project on your local machine, follow these steps.

### Prerequisites

- **Node.js**: The project requires a specific version of Node.js. It is highly recommended to use nvm (Node Version Manager) to manage your Node versions.
  - Required version: **22.14.0** (as specified in the `.nvmrc` file)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/GasiorMateusz/DietPlanner.git
   cd DietPlanner
   ```

2. **Set the Node.js version:**
   If you have nvm installed, simply run:

   ```bash
   nvm use
   ```

   This will automatically read the `.nvmrc` file and switch to the correct Node.js version.

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Set up environment variables:**
   This project requires API keys and service URLs to function. Create a `.env` file in the root of the project with the following keys:

   ```env
   # Supabase credentials (server-side)
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Supabase credentials (client-side - must have PUBLIC_ prefix)
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_KEY=your_supabase_anon_key

   # Application URL (used for email verification and password reset links)
   # ⚠️ REQUIRED for production: Set this to your production URL WITHOUT trailing slash (e.g., https://yourdomain.com)
   # For local development, this can be omitted (will use window.location.origin)
   # IMPORTANT: Without this, auth redirect links may point to localhost in production!
   PUBLIC_APP_URL=https://yourdomain.com

   # OpenRouter API Key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

   **Important Notes:**
   - `SUPABASE_SERVICE_ROLE_KEY` is required for account deletion functionality
   - Find it in Supabase Dashboard → Settings → API → "service_role" key (keep it secret!)
   - The anon key (`SUPABASE_KEY` / `PUBLIC_SUPABASE_KEY`) is NOT sufficient for admin operations
   - The AI model used for conversations can be configured by editing the `DEFAULT_AI_MODEL` constant in `src/lib/ai/openrouter.service.ts` (default: `openai/gpt-4.1-nano`)

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000` (as configured in astro.config.mjs).

### Available Scripts

The `package.json` file includes the following scripts for development and maintenance:

**Development:**

- `npm run dev` - Starts the development server with hot-reloading (Node adapter)
- `npm run dev:cloudflare` - Starts the development server with Cloudflare adapter
- `npm run build` - Builds the application for production (Node adapter)
- `npm run build:cloudflare` - Builds the application for Cloudflare Pages
- `npm run preview` - Serves the production build locally for testing (Node adapter)
- `npm run preview:cloudflare` - Builds and serves the Cloudflare build locally with Wrangler
- `npm run astro` - Accesses the Astro CLI for various commands

**Code Quality:**

- `npm run lint` - Lints the codebase using ESLint
- `npm run lint:fix` - Lints the codebase and automatically fixes issues
- `npm run format` - Formats the code using Prettier

**Testing:**

- `npm run test` - Runs all tests in watch mode
- `npm run test:unit` - Runs unit tests
- `npm run test:integration` - Runs integration tests
- `npm run test:watch` - Runs tests in watch mode
- `npm run test:ui` - Opens Vitest UI for test debugging
- `npm run test:coverage` - Runs tests with coverage reporting
- `npm run test:e2e` - Runs end-to-end tests with Playwright
- `npm run test:e2e:ui` - Opens Playwright UI for E2E test debugging
- `npm run test:e2e:debug` - Runs E2E tests in debug mode
- `npm run test:e2e:headed` - Runs E2E tests in headed mode (visible browser)
- `npm run test:all` - Runs all test suites (unit, integration, and E2E)

## Project Scope

### Key Features

- **User Authentication** - Dietitian registration and login (email/password)
- **Dashboard** - View, search, and delete all saved meal plans
- **Meal Plan Creation**:
  - **Startup Form** - Collects all necessary patient data and dietary guidelines
  - **AI Chat** - Generates a plan and allows for iterative conversational corrections
  - **Manual Editor** - A structured editor to finalize the plan's details
  - **Export** - Export the final meal plan to a .doc file

### Out of Scope (MVP Boundaries)

The following features are not included in this MVP version:

- Integration with external recipe databases or URL imports.
- Social features (sharing, commenting, etc.).
- A dedicated mobile application.
- Creation or management of multi-day meal plans.
- A separate "Patient" entity (plans are identified by name).
- Automatic recalculation of nutrition values after manual edits in the editor.

## Project Status

This project is currently in the **MVP (Minimum Viable Product)** stage. The core functionality is defined, but it is not yet feature-complete and is intended as a baseline for further development.

## License

No license has been specified for this project.
