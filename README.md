<h1 align="center">
  <img alt="logo" src="./assets/icon.png" width="124px" style="border-radius:10px"/><br/>
Trip Sync Mobile App </h1>

> Trip Sync v2 comprehensive travel management mobile application built with React Native and Expo
> 
> This project is based on [Obytes starter](https://starter.obytes.com) with Trip Sync specific configurations

## Requirements

- [React Native dev environment ](https://reactnative.dev/docs/environment-setup)
- [Node.js LTS release](https://nodejs.org/en/)
- [Git](https://git-scm.com/)
- [Watchman](https://facebook.github.io/watchman/docs/install#buildinstall), required only for macOS or Linux users
- [Pnpm](https://pnpm.io/installation)
- [Cursor](https://www.cursor.com/) or [VS Code Editor](https://code.visualstudio.com/download) ⚠️ Make sure to install all recommended extension from `.vscode/extensions.json`

## 👋 Quick start

Clone the repo to your machine and install deps :

```sh
git clone https://github.com/user/trip-sync-v2.git

cd ./trip-sync-v2/trip-sync-mobile-v2

pnpm install
```

To run the app on ios

```sh
pnpm ios
```

To run the app on Android

```sh
pnpm android
```

## 🌍 Environment Configuration

Trip Sync supports multiple environments for different development stages:

```sh
# Development (default)
pnpm start

# Staging environment  
pnpm start:staging

# Production environment
pnpm start:production
```

### Environment Variables

The app uses environment-specific configuration files:
- `.env.development` - Local development
- `.env.staging` - Internal testing 
- `.env.production` - Production deployment

Environment variables are validated using Zod schemas in `env.js`.

## 🏗️ Build & Deploy

### Development Builds
```sh
pnpm build:development:ios
pnpm build:development:android
```

### Staging Builds  
```sh
pnpm build:staging:ios
pnpm build:staging:android
```

### Production Builds
```sh
pnpm build:production:ios
pnpm build:production:android
```

## 🧪 Testing

Run all tests:
```sh
pnpm test
```

Run type checking:
```sh
pnpm type-check
```

Run linting:
```sh
pnpm lint
```

Run all quality checks:
```sh
pnpm check-all
```

### E2E Testing with Maestro
```sh
pnpm e2e-test
```

## 📱 Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (app)/             # Authenticated routes
│   └── (auth)/            # Auth routes  
├── components/
│   ├── ui/                # Reusable UI components
│   ├── forms/             # Form components
│   └── features/          # Feature-specific components
├── api/
│   ├── common/            # Shared API utilities
│   └── [feature]/         # Feature-specific API
├── lib/                   # Core libraries & utilities
├── translations/          # i18n language files
└── types/                 # TypeScript definitions
```

## 🎨 Styling & Design System

Trip Sync uses NativeWind (Tailwind CSS for React Native) with a custom design system:

- **Colors**: Custom Trip Sync palette with risk-first UI patterns
- **Dark Mode**: Automatic dark/light theme switching
- **Typography**: Inter font family with responsive sizing
- **Components**: Reusable UI components with variant support

## 📚 Key Technologies

- **React Native 0.79.4** - Cross-platform mobile framework
- **Expo SDK 53** - Development platform & services
- **TypeScript 5.8.3** - Type safety throughout
- **NativeWind 4.1.21** - Tailwind CSS styling
- **Expo Router 5.1.0** - File-based navigation
- **Zustand 5.0.5** - State management
- **TanStack Query 5.52.1** - Server state management
- **React Native Auth0 4.6.0** - Authentication

## ✍️ Documentation

### Trip Sync Specific
- [Trip Sync Architecture](../docs/architecture/11-mobile-architecture.md) - Mobile app architecture details
- [Coding Standards](../docs/architecture/coding-standards.md) - Trip Sync coding conventions
- [Developer Onboarding](../docs/DEVELOPER_ONBOARDING.md) - Getting started guide

### Obytes Starter Foundation
- [Rules and Conventions](https://starter.obytes.com/getting-started/rules-and-conventions/)
- [Project structure](https://starter.obytes.com/getting-started/project-structure)
- [Environment vars and config](https://starter.obytes.com/getting-started/environment-vars-config)
- [UI and Theming](https://starter.obytes.com/ui-and-theme/ui-theming)
- [Components](https://starter.obytes.com/ui-and-theme/components)
- [Forms](https://starter.obytes.com/ui-and-theme/Forms)
- [Data fetching](https://starter.obytes.com/guides/data-fetching)

## 🤝 Contributing

Please refer to [Contributing Guidelines](../docs/CONTRIBUTING.md) for development workflows and standards.
