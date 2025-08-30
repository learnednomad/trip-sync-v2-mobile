# Platform-Specific Component Specifications

## Overview

Trip Sync v2 targets iOS 16+ and Android 10+ with a unified brand identity while respecting platform conventions. This document outlines component specifications that balance brand consistency with platform-appropriate behavior.

## Platform Philosophy

### Brand Consistency (Unified)
- Color palette and branding
- Content strategy and tone
- Core user flows and information architecture
- Typography hierarchy (with platform adaptations)

### Platform Differentiation (Respect Native Patterns)
- Navigation patterns and transitions
- System integration and permissions
- Input methods and keyboards
- Platform-specific components and behaviors

---

## Component Specifications

### 1. Navigation Components

#### Bottom Tab Bar
**Current Implementation**: Custom styled tab bar with iOS-centric design

**iOS Specifications (HIG Compliant)**:
```typescript
const iOSTabBarSpec = {
  height: 88, // Current: Good (includes safe area)
  activeColor: '#0ea5e9', // Brand blue
  inactiveColor: '#737373', // System gray
  backgroundColor: 'white',
  style: {
    borderTop: '0.5px solid #e5e5e5',
    shadow: {
      color: '#000',
      offset: { width: 0, height: -2 },
      opacity: 0.1,
      radius: 4
    }
  },
  accessibility: {
    labels: true, // ❌ MISSING - Add accessibility labels
    traits: ['button', 'tab'],
    hints: 'Double tap to navigate'
  }
}
```

**Android Specifications (Material 3)**:
```typescript
const androidTabBarSpec = {
  height: 80, // Material guideline: 80dp
  activeColor: '#0ea5e9', // Brand blue
  inactiveColor: '#737373',
  backgroundColor: 'surface', // Material theme token
  style: {
    elevation: 8, // Material shadow
    borderTop: 'none' // Material uses elevation, not border
  },
  rippleEffect: true, // ❌ MISSING - Add Material ripple
  accessibility: {
    labels: true,
    contentDescription: 'Navigation tab'
  }
}
```

**Recommendation**: Implement platform detection and apply appropriate styling conditionally.

#### App Bar/Header
**Current Implementation**: Fixed header with consistent styling

**iOS Specifications**:
```typescript
const iOSHeaderSpec = {
  largeTitles: true, // ❌ MISSING - Implement large title support
  preferredStyle: 'prominent',
  backButton: {
    style: 'chevron', // < Back
    title: 'Back' // Or previous screen name
  },
  rightBarButton: {
    style: 'plain', // Settings icon
    accessibility: 'Settings'
  }
}
```

**Android Specifications**:
```typescript
const androidHeaderSpec = {
  type: 'TopAppBar', // Material 3 component
  navigationIcon: 'arrow_back', // ← 
  elevation: 4,
  statusBarBehavior: 'lift-on-scroll',
  actions: [{
    icon: 'settings',
    contentDescription: 'Settings'
  }]
}
```

### 2. Button Components

#### Primary Button (Create Trip)
**Current State**: Good foundation, needs platform refinement

**Unified Brand Specifications**:
```typescript
const primaryButtonSpec = {
  backgroundColor: '#0ea5e9', // Brand blue
  textColor: 'white',
  fontWeight: '600',
  borderRadius: 8, // Moderate rounded corners
  minHeight: 48, // WCAG AA compliance
  minTouchTarget: 44 // iOS requirement
}
```

**iOS Enhancements**:
```typescript
const iOSPrimaryButton = {
  ...primaryButtonSpec,
  hapticFeedback: 'light', // ❌ MISSING
  pressedStyle: {
    opacity: 0.8,
    transform: 'scale(0.98)'
  },
  accessibility: {
    traits: ['button'],
    label: 'Create new trip',
    hint: 'Opens trip creation form'
  }
}
```

**Android Enhancements**:
```typescript
const androidPrimaryButton = {
  ...primaryButtonSpec,
  rippleEffect: true, // ❌ MISSING
  elevation: 2,
  pressedElevation: 8,
  stateLayerOpacity: {
    hover: 0.08,
    focus: 0.12,
    pressed: 0.12
  }
}
```

#### Secondary Button (Explore)
**Current State**: Outline style, needs touch target optimization

**Issues Identified**:
- Border appears thin (may be difficult to see)
- Touch target may be below 44pt minimum
- No platform-specific interaction feedback

**Improvements**:
```typescript
const secondaryButtonSpec = {
  borderWidth: 1.5, // Increase from current ~1px
  borderColor: '#0ea5e9',
  backgroundColor: 'transparent',
  textColor: '#0ea5e9',
  minHeight: 48,
  minTouchTarget: 44,
  // Platform-specific enhancements same as primary
}
```

### 3. Card Components

#### Trip Statistics Cards
**Current State**: Clean design, accessibility concerns

**Current Issues**:
- No semantic grouping for screen readers
- Missing accessibility labels for statistics
- Could benefit from better visual hierarchy

**Enhanced Specifications**:
```typescript
const statisticsCardSpec = {
  accessibility: {
    role: 'group',
    label: 'Trip statistics',
    children: [
      { label: '0 total trips' },
      { label: '0 active trips' },
      { label: '0 upcoming trips' }
    ]
  },
  layout: {
    gap: 16,
    padding: 20,
    borderRadius: 12
  },
  typography: {
    numberStyle: 'largeTitle', // iOS: 34pt, Android: 57sp
    labelStyle: 'body' // iOS: 17pt, Android: 16sp
  }
}
```

### 4. Empty State Components

#### "Start Your Journey" Section
**Current State**: Good conceptual design, execution needs enhancement

**Issues**:
- Static illustration lacks engagement
- Call-to-action hierarchy unclear
- Missing progressive disclosure

**Enhanced Specifications**:
```typescript
const emptyStateSpec = {
  illustration: {
    type: 'vector', // Better than raster for scaling
    animation: 'subtle', // Micro-animation on appearance
    accessibility: {
      hidden: true, // Decorative only
    }
  },
  content: {
    headline: {
      typography: 'title2', // iOS: 22pt, Android: 24sp
      accessibility: { role: 'heading', level: 2 }
    },
    description: {
      typography: 'body',
      color: 'secondary',
      maxWidth: '80%' // Improve readability
    }
  },
  actions: {
    primary: 'Create Trip',
    secondary: 'Browse Examples', // ❌ MISSING - Add exploration option
    layout: 'stacked' // Mobile-first approach
  }
}
```

### 5. Form Components

#### Input Fields (Future Trip Creation)
**Specifications for Upcoming Forms**:

**iOS Styling**:
```typescript
const iOSInputSpec = {
  style: 'rounded',
  backgroundColor: 'systemFill',
  borderWidth: 0,
  borderRadius: 8,
  padding: { vertical: 12, horizontal: 16 },
  clearButton: true, // Native iOS pattern
  autocorrect: true,
  spellcheck: true
}
```

**Android Styling**:
```typescript
const androidInputSpec = {
  style: 'outlined', // Material 3 outlined text field
  borderColor: 'outline',
  backgroundColor: 'transparent',
  borderRadius: 4,
  padding: { vertical: 16, horizontal: 12 },
  floatingLabel: true, // Material pattern
  helperText: true
}
```

### 6. Modal/Sheet Components

#### Bottom Sheet (Expected for Trip Creation)
**iOS Implementation**:
```typescript
const iOSBottomSheetSpec = {
  style: 'card',
  backgroundColor: 'systemBackground',
  cornerRadius: 16,
  grabber: true, // Native iOS pattern
  dismissible: true,
  safeArea: true,
  animation: 'spring'
}
```

**Android Implementation**:
```typescript
const androidBottomSheetSpec = {
  style: 'modal',
  backgroundColor: 'surface',
  cornerRadius: { top: 28 }, // Material 3 large radius
  scrim: true,
  dragHandle: true,
  animation: 'easeInOut'
}
```

---

## Platform Parity Matrix

| Component | Unified Elements | iOS-Specific | Android-Specific |
|-----------|------------------|--------------|------------------|
| **Tab Bar** | Colors, icons, labels | Blur effect, iOS shadows | Material elevation, ripples |
| **Buttons** | Brand colors, typography | Haptic feedback, scale animations | Material ripples, state layers |
| **Cards** | Layout, content hierarchy | iOS shadows, corner radius | Material elevation, motion |
| **Empty States** | Illustrations, messaging | iOS typography scale | Material typography scale |
| **Forms** | Validation, error handling | Clear buttons, native keyboards | Floating labels, Material input |
| **Modals** | Content strategy | Card-style sheets, grabbers | Bottom sheets with scrim |

## Typography Specifications

### iOS Typography Scale
```typescript
const iOSTypography = {
  largeTitle: { size: 34, weight: 'regular' },
  title1: { size: 28, weight: 'regular' },
  title2: { size: 22, weight: 'regular' },
  title3: { size: 20, weight: 'regular' },
  headline: { size: 17, weight: 'semibold' },
  body: { size: 17, weight: 'regular' },
  callout: { size: 16, weight: 'regular' },
  subhead: { size: 15, weight: 'regular' },
  footnote: { size: 13, weight: 'regular' },
  caption1: { size: 12, weight: 'regular' },
  caption2: { size: 11, weight: 'regular' }
}
```

### Android Typography Scale (Material 3)
```typescript
const androidTypography = {
  displayLarge: { size: 57, weight: 'regular' },
  displayMedium: { size: 45, weight: 'regular' },
  displaySmall: { size: 36, weight: 'regular' },
  headlineLarge: { size: 32, weight: 'regular' },
  headlineMedium: { size: 28, weight: 'regular' },
  headlineSmall: { size: 24, weight: 'regular' },
  titleLarge: { size: 22, weight: 'regular' },
  titleMedium: { size: 16, weight: 'medium' },
  titleSmall: { size: 14, weight: 'medium' },
  bodyLarge: { size: 16, weight: 'regular' },
  bodyMedium: { size: 14, weight: 'regular' },
  bodySmall: { size: 12, weight: 'regular' }
}
```

## Accessibility Requirements

### iOS Accessibility (VoiceOver)
- All interactive elements must have accessibility labels
- Support for VoiceOver gestures and navigation
- Respect user preference for Reduced Motion
- Support Dynamic Type scaling up to Accessibility sizes
- Implement proper accessibility traits (button, header, etc.)

### Android Accessibility (TalkBack)
- Content descriptions for all meaningful elements
- Proper semantic markup with roles
- Support for TalkBack navigation
- High contrast mode support
- Large text and display scaling support

## Motion & Animation Guidelines

### iOS Motion Patterns
- Spring animations for natural feel
- Respect Reduce Motion accessibility setting
- Use system-provided animation curves
- Subtle haptic feedback for interactions

### Android Motion Patterns
- Material motion tokens and easing curves
- Shared element transitions between screens
- Emphasis on purposeful animation
- Respect accessibility preferences for reduced animation

---

## Implementation Priority

### Phase 1: Critical Platform Compliance (Week 1-2)
1. Fix touch targets (44pt minimum)
2. Add accessibility labels and hints
3. Implement platform-specific haptic/ripple feedback

### Phase 2: Platform Enhancement (Week 3-4)
1. Large title support for iOS
2. Material 3 component styling for Android
3. Platform-specific navigation patterns

### Phase 3: Advanced Platform Integration (Week 5-8)
1. Dynamic Type and text scaling support
2. Platform-specific modal presentations
3. Advanced accessibility features

**Next Document**: [Design System Tokens](design-tokens.json)