# Mobile Repository Initialization Guide

## Overview
This guide provides step-by-step instructions for initializing the Trip Sync v2 mobile repository with proper version control, code quality tools, and development standards.

## Prerequisites
- Git installed (v2.30+)
- GitHub CLI installed (optional but recommended)
- Node.js 18+ and pnpm installed
- Expo CLI installed globally

## Step 1: Initialize Git Repository

```bash
# Navigate to mobile directory
cd trip-sync-mobile-v2

# Initialize git repository
git init

# Configure git user (if not globally set)
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## Step 2: Configure .gitignore

Create `.gitignore` file with React Native/Expo specific patterns:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Expo
.expo/
dist/
web-build/
expo-env.d.ts

# Native builds
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# iOS
ios/Pods/
ios/build/
ios/DerivedData/
ios/*.xcworkspace/xcuserdata/
ios/*.xcodeproj/xcuserdata/
*.pbxuser
*.mode1v3
*.mode2v3
*.perspectivev3
*.xcuserstate
*.xcscmblueprint

# Android
android/build/
android/app/build/
android/.gradle/
android/local.properties
android/gradle.properties
*.iml
*.hprof
.cxx/

# Environment variables
.env
.env.local
.env.development
.env.staging
.env.production
*.local

# Testing
coverage/
.nyc_output/

# Debugging
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.vscode/
.idea/

# macOS
.DS_Store
*.pem

# Temporary files
*.swp
*.swo
*~
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes

# Build artifacts
*.ipa
*.apk
*.aab
*.app
```

## Step 3: Create Initial Commit Structure

```bash
# Add all files respecting .gitignore
git add .

# Create initial commit
git commit -m "feat: initial React Native/Expo project setup

- Configure Expo SDK 53 with TypeScript
- Setup NativeWind v4 for styling
- Configure navigation structure with Expo Router
- Add core dependencies for offline-first architecture
- Implement ESLint and Prettier configuration"
```

## Step 4: Setup Branch Protection Rules

```bash
# Create and push to remote repository
gh repo create trip-sync-mobile-v2 --private --source=. --remote=origin --push

# Create develop branch
git checkout -b develop
git push -u origin develop

# Return to main branch
git checkout main
```

### Configure on GitHub:
1. Go to Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request before merging
   - ✅ Require approvals (1)
   - ✅ Dismiss stale pull request approvals
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators
3. Add rule for `develop` branch:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass

## Step 5: Create PR Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests pass locally
- [ ] E2E tests pass (if applicable)
- [ ] Tested on iOS simulator
- [ ] Tested on Android emulator
- [ ] Tested offline functionality

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed self-review
- [ ] I have commented complex code sections
- [ ] I have updated documentation
- [ ] My changes generate no new warnings
- [ ] New and existing unit tests pass
- [ ] Any dependent changes have been merged

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Related Issues
Closes #(issue number)
```

## Step 6: Setup Commit Conventions

Create `.gitmessage` template:

```
# <type>(<scope>): <subject> (max 50 chars)

# <body> (optional, max 72 chars per line)

# <footer> (optional)

# Type: feat|fix|docs|style|refactor|perf|test|chore|ci
# Scope: auth|trips|offline|ui|navigation|api|storage
# Subject: imperative mood, lowercase, no period at end
# Body: explain what and why vs. how
# Footer: breaking changes, issue references
```

Configure git to use template:

```bash
git config commit.template .gitmessage
```

## Step 7: Configure Husky Pre-commit Hooks

```bash
# Install husky (already in package.json)
pnpm install

# Initialize husky
pnpm husky init

# Add pre-commit hook
echo "pnpm lint-staged" > .husky/pre-commit

# Add commit-msg hook for conventional commits
echo "npx commitlint --edit \$1" > .husky/commit-msg
```

## Step 8: Create Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: 'bug'
assignees: ''
---

**Describe the bug**
A clear and concise description

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
 - Device: [e.g. iPhone 14]
 - OS: [e.g. iOS 16.0]
 - App Version: [e.g. 1.0.0]
 - Network: [online/offline]

**Additional context**
Any other context about the problem
```

Create `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature Request
about: Suggest an idea for Trip Sync
title: '[FEATURE] '
labels: 'enhancement'
assignees: ''
---

**Is your feature request related to a problem?**
A clear description of the problem

**Describe the solution you'd like**
What you want to happen

**Describe alternatives you've considered**
Alternative solutions or features

**Additional context**
Any other context or screenshots
```

## Step 9: Setup Code Owners

Create `.github/CODEOWNERS`:

```
# Default owners for everything
* @trip-sync/mobile-team

# Platform specific code
/ios/ @trip-sync/ios-team
/android/ @trip-sync/android-team

# Core features
/src/features/auth/ @trip-sync/auth-team
/src/features/trips/ @trip-sync/trips-team
/src/features/offline/ @trip-sync/offline-team
/src/api/ @trip-sync/api-team

# Configuration files
/.github/ @trip-sync/devops
/app.config.ts @trip-sync/mobile-lead
/package.json @trip-sync/mobile-lead
```

## Step 10: Configure Repository Settings

### Secrets to Add (Settings → Secrets → Actions):
```
EXPO_TOKEN          # For EAS builds
SUPABASE_URL        # Backend API URL
SUPABASE_ANON_KEY   # Public API key
SENTRY_DSN          # Error tracking
APP_STORE_CONNECT_API_KEY  # iOS deployment
GOOGLE_SERVICE_ACCOUNT_KEY # Android deployment
```

### Recommended GitHub Settings:
- **General**:
  - Default branch: `main`
  - Allow squash merging ✅
  - Automatically delete head branches ✅
- **Features**:
  - Issues ✅
  - Projects ✅
  - Wiki ✅
- **Pull Requests**:
  - Allow auto-merge ✅
  - Require linear history ✅

## Verification Checklist

- [ ] Git repository initialized with proper .gitignore
- [ ] Remote repository created and connected
- [ ] Main and develop branches created
- [ ] Branch protection rules configured
- [ ] PR template in place
- [ ] Commit conventions documented
- [ ] Husky hooks working
- [ ] Issue templates created
- [ ] Code owners file configured
- [ ] Repository secrets added
- [ ] Team members have appropriate access

## Next Steps

1. Clone the repository on team machines
2. Run `pnpm install` to setup dependencies
3. Configure local environment variables
4. Create first feature branch: `git checkout -b feature/story-1.1-foundation`
5. Begin development following established conventions

## Troubleshooting

### Common Issues

**Git hooks not running:**
```bash
chmod +x .husky/*
pnpm husky install
```

**Remote repository connection issues:**
```bash
git remote -v  # Verify remote URL
git remote set-url origin git@github.com:org/trip-sync-mobile-v2.git
```

**Branch protection bypass needed:**
Only for emergency hotfixes, requires admin approval and documentation.

## Related Documentation
- [Development Environment Setup](./02-development-environment.md)
- [CI/CD Configuration](./05-ci-cd-eas-build.md)
- [Coding Standards](../../docs/architecture/coding-standards-v2.md)