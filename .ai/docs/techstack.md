Project Technology Stack

Frontend - Astro with React for interactive components

Astro 4 allows for the creation of fast, performant websites and applications with minimal JavaScript.

React 19 provides interactivity where it's needed.

TypeScript 5 for static code typing and better IDE support.

Tailwind 4 enables convenient application styling.

Shadcn/ui provides a library of accessible React components upon which we will base the UI.

React Hook Form provides efficient form state management and validation.

Backend - Supabase as a comprehensive backend solution

Provides a PostgreSQL database.

Offers SDKs in multiple languages, which will serve as Backend-as-a-Service (BaaS).

It is an open-source solution that can be hosted locally or on a private server.

Features built-in user authentication.

AI - Communication with models via the Openrouter.ai service

Access to a wide range of models (OpenAI, Anthropic, Google, and many others), which will allow us to find a solution that ensures high efficiency and low costs.

Allows setting financial limits on API keys.

CI/CD and Hosting

Github Actions for creating CI/CD pipelines.

DigitalOcean for hosting the application via a Docker image.

Testing - Comprehensive testing strategy for quality assurance

Unit and Integration Testing

Vitest serves as the primary test runner for unit and integration tests, providing fast execution and excellent TypeScript support.

React Testing Library provides component testing utilities that encourage testing React components from a user's perspective.

@testing-library/jest-dom extends Jest/Vitest matchers with DOM-specific assertions for better component testing.

MSW (Mock Service Worker) enables API mocking for unit tests and integration testing, particularly useful for mocking external services like the OpenRouter API.

Supertest provides HTTP assertions for testing API endpoints, allowing easy validation of request/response handling.

End-to-End (E2E) Testing

Playwright is the recommended framework for end-to-end testing, offering cross-browser support (Chromium, Firefox, WebKit), built-in test runner and reporting, and screenshot/video capture capabilities for debugging and documentation.
