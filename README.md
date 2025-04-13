# LifeSprint

LifeSprint - это 31-дневный путь трансформации, помогающий пользователям достигать своих целей и формировать полезные привычки.

## Project Structure

The project follows a feature-based architecture with a core module for shared functionality.

```
src/
├── app/                  # Application entry point
├── core/                 # Core functionality
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Service interfaces and factories
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── features/             # Feature modules
│   ├── auth/             # Authentication feature
│   ├── dashboard/        # Dashboard feature
│   ├── day/              # Day content feature
│   ├── profile/          # User profile feature
│   └── settings/         # Settings feature
├── shared/               # Shared resources
│   ├── assets/           # Static assets
│   ├── constants/        # Application constants
│   └── styles/           # Global styles
└── pages/                # Legacy page components
```

## Core Module

The core module contains reusable functionality that can be used across features:

- **components**: Reusable UI components like Button, Card, Input, etc.
- **hooks**: Custom React hooks like useLocalStorage, useMediaQuery, etc.
- **services**: Service interfaces and factories for dependency injection.
- **types**: TypeScript type definitions for common types.
- **utils**: Utility functions for dates, strings, validation, etc.

## Features

Each feature is a self-contained module with its own components, hooks, services, and pages:

- **auth**: User authentication and registration.
- **dashboard**: Main dashboard with progress tracking.
- **day**: Daily content and step-by-step guides.
- **profile**: User profile management.
- **settings**: Application settings.

## Shared Resources

Shared resources are used across the application:

- **assets**: Static assets like images, icons, etc.
- **constants**: Application constants like routes, API endpoints, etc.
- **styles**: Global styles and theme configuration.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Build for production:

```bash
npm run build
```

## Technologies

- React
- TypeScript
- React Router
- Tailwind CSS
