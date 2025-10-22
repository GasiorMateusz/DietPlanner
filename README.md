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
- **Astro 5**: For fast, performant static site generation with minimal JavaScript.
- **React 19**: For interactive components (e.g., chat, editor).
- **TypeScript 5**: For static type checking.
- **Tailwind 4**: For utility-first CSS styling.
- **Shadcn/ui**: For the base library of accessible React components.

### Backend
- **Supabase**: A comprehensive BaaS (Backend-as-a-Service) solution providing:
  - PostgreSQL Database
  - User Authentication
  - SDKs for backend operations

### AI
- **Openrouter.ai**: Provides access to a wide range of AI models (OpenAI, Anthropic, Google, etc.) to power the meal plan generation.

### CI/CD & Hosting
- **Github Actions**: For CI/CD pipelines.
- **DigitalOcean**: For hosting the application via a Docker image.

## Getting Started Locally

To set up and run this project on your local machine, follow these steps.

### Prerequisites

- **Node.js**: The project requires a specific version of Node.js. It is highly recommended to use nvm (Node Version Manager) to manage your Node versions.
  - Required version: **22.14.0** (as specified in the `.nvmrc` file)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/your-repository-name.git
   cd your-repository-name
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
   This project requires API keys and service URLs to function. Create a `.env` file in the root of the project by copying the `.env.example` file (if one exists) or by creating it manually.

   Your `.env` file should contain the following keys:
   ```env
   # Supabase credentials
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # OpenRouter API Key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:4321` (or another port if specified by Astro).

### Available Scripts

The `package.json` file includes the following scripts for development and maintenance:

- `npm run dev`: Starts the development server with hot-reloading.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for testing.
- `npm run astro`: Accesses the Astro CLI for various commands.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.

## Project Scope

### Key Features

- **User Authentication**: Dietitian registration and login (email/password).
- **Dashboard**: View, search, and delete all saved meal plans.
- **Meal Plan Creation**:
  - **Startup Form**: Collects all necessary patient data and dietary guidelines.
  - **AI Chat**: Generates a plan and allows for iterative conversational corrections.
  - **Manual Editor**: A structured editor to finalize the plan's details.
  - **Export**: Export the final meal plan to a .doc file.

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