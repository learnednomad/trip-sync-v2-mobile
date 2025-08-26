# Trip Sync v2 - Mobile Architecture Document

> **Note**: This document focuses on the mobile application architecture. For complete platform documentation, see the [Master Documentation Index](/docs/../DOCUMENTATION_INDEX.md).

## Executive Summary

Trip Sync v2 mobile application is part of a comprehensive travel management platform. Built with React Native and Expo, it provides cross-platform trip synchronization and management capabilities with offline-first architecture and real-time collaboration features.

### Related Documentation
- **[Complete Mobile Architecture](../docs/architecture/11-mobile-architecture.md)** - Detailed mobile architecture
- **[Backend Services](../docs/architecture/12-backend-services-architecture.md)** - API and backend architecture
- **[Master PRD](../docs/prd/index.md)** - Complete product requirements
- **[Current Epic](../docs/prd/epic-1-foundation-core-trip-management.md)** - Active development work

### Key Architectural Decisions
- **Mobile Framework**: React Native with Expo for cross-platform consistency
- **State Management**: Hybrid approach with Zustand (global) and TanStack Query (server)
- **Styling**: NativeWind (Tailwind for React Native) for consistent design system
- **Authentication**: Auth0 for secure, scalable authentication
- **Storage**: MMKV for high-performance local storage
- **Navigation**: Expo Router for file-based routing

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  iOS App  │  Android App  │  Web App  │  Desktop (Future)  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  React Native / Expo                                        │
│  • File-based Routing (Expo Router)                        │
│  • State Management (Zustand + TanStack Query)             │
│  • UI Components (NativeWind + Custom)                     │
│  • Authentication (Auth0)                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                     API Gateway                             │
├─────────────────────────────────────────────────────────────┤
│  • Rate Limiting                                            │
│  • Request Routing                                          │
│  • Authentication Verification                              │
│  • API Versioning                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Backend Services                          │
├─────────────────────────────────────────────────────────────┤
│  Trip Service │ User Service │ Sync Service │ Media Service│
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Primary DB  │  Cache Layer  │  File Storage  │  Queue     │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack

#### Core Technologies
- **Framework**: React Native 0.79.4 with React 19.0.0
- **Build System**: Expo SDK 53
- **Language**: TypeScript 5.8.3
- **Package Manager**: pnpm 10.12.3

#### Navigation & Routing
- **Expo Router**: File-based routing with nested layouts
- **React Navigation**: Underlying navigation system
- **Deep Linking**: expo-linking for URL handling

#### State Management
```typescript
// Global State (Zustand)
interface AppState {
  // Authentication
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
  };
  // UI State
  ui: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    bottomSheetState: Record<string, boolean>;
  };
  // Trip State
  trips: {
    currentTrip: Trip | null;
    syncStatus: 'idle' | 'syncing' | 'error';
  };
}

// Server State (TanStack Query)
- API responses cached and synchronized
- Optimistic updates for better UX
- Background refetching strategies
```

#### UI Architecture

##### Design System
- **NativeWind**: Tailwind CSS for React Native
- **Component Library Structure**:
  ```
  components/
  ├── ui/           # Base components
  │   ├── button.tsx
  │   ├── input.tsx
  │   ├── modal.tsx
  │   └── icons/
  ├── features/     # Feature-specific
  │   ├── trip-card.tsx
  │   └── user-avatar.tsx
  └── layouts/      # Layout components
      ├── tab-bar.tsx
      └── header.tsx
  ```

##### Styling Strategy
- **Utility-First**: NativeWind classes for rapid development
- **Component Variants**: tailwind-variants for component variations
- **Theme System**: Dark/light mode with system preference support
- **Responsive Design**: Platform-specific adjustments

### Application Layers

#### 1. Presentation Layer
```typescript
// Screen Structure
src/app/
├── (app)/              # Authenticated screens
│   ├── _layout.tsx     # Tab navigation
│   ├── index.tsx       # Home/Dashboard
│   ├── trips/
│   │   ├── [id].tsx    # Trip details
│   │   └── create.tsx  # New trip
│   └── settings.tsx    # User settings
├── (auth)/             # Auth flow
│   ├── login.tsx
│   └── onboarding.tsx
└── _layout.tsx         # Root layout
```

#### 2. Business Logic Layer
```typescript
// Custom Hooks Pattern
interface UseTripManager {
  trips: Trip[];
  currentTrip: Trip | null;
  createTrip: (data: TripInput) => Promise<Trip>;
  updateTrip: (id: string, data: Partial<Trip>) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  syncTrips: () => Promise<void>;
}

// API Integration Pattern
const useTripManager = (): UseTripManager => {
  const queryClient = useQueryClient();
  const { data: trips } = useTrips();
  const createMutation = useCreateTrip();
  
  return {
    trips,
    createTrip: async (data) => {
      const trip = await createMutation.mutateAsync(data);
      queryClient.invalidateQueries(['trips']);
      return trip;
    },
    // ... other methods
  };
};
```

#### 3. Data Access Layer
```typescript
// API Client Configuration
const apiClient = axios.create({
  baseURL: Config.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request/Response Interceptors
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Type-Safe API Calls
export const tripApi = {
  getAll: () => apiClient.get<Trip[]>('/trips'),
  getById: (id: string) => apiClient.get<Trip>(`/trips/${id}`),
  create: (data: TripInput) => apiClient.post<Trip>('/trips', data),
  update: (id: string, data: Partial<Trip>) => 
    apiClient.patch<Trip>(`/trips/${id}`, data),
  delete: (id: string) => apiClient.delete(`/trips/${id}`),
};
```

### Performance Optimization

#### Mobile Performance
- **Bundle Optimization**:
  - Code splitting with dynamic imports
  - Tree shaking for unused code
  - Asset optimization (images, fonts)
  
- **Runtime Performance**:
  - FlashList for large lists (virtualization)
  - Image caching with expo-image
  - Memoization for expensive computations
  - Lazy loading for heavy components

#### Network Optimization
- **Caching Strategy**:
  ```typescript
  // TanStack Query Configuration
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
  ```

- **Offline Support**:
  - MMKV for persistent local storage
  - Queue system for offline actions
  - Sync mechanism when connection restored

## Integration with Platform Architecture

> **Important**: The mobile app is part of a larger platform. For detailed backend, web, and dashboard architecture, refer to:
> - [Backend Services Architecture](../docs/architecture/12-backend-services-architecture.md)
> - [Database Schemas](../docs/architecture/17-database-schemas.md)
> - [API Specifications](../docs/architecture/16-api-specifications-detailed.md)
> - [Admin Dashboard PRD](../docs/ADMIN_DASHBOARD_PRD.md)
> - [Web App PRD](../docs/WEB_APP_PRD.md)

## Backend Architecture Overview

### API Design

#### RESTful API Structure
```
/api/v1/
├── /auth
│   ├── POST   /login
│   ├── POST   /logout
│   ├── POST   /refresh
│   └── GET    /profile
├── /trips
│   ├── GET    /           # List trips
│   ├── POST   /           # Create trip
│   ├── GET    /:id        # Get trip
│   ├── PATCH  /:id        # Update trip
│   ├── DELETE /:id        # Delete trip
│   └── POST   /:id/sync   # Sync trip
├── /users
│   ├── GET    /me
│   ├── PATCH  /me
│   └── DELETE /me
└── /media
    ├── POST   /upload
    └── GET    /:id
```

#### API Versioning Strategy
- **URL Versioning**: `/api/v1/`, `/api/v2/`
- **Backward Compatibility**: Support N-1 versions
- **Deprecation Policy**: 6-month notice for breaking changes

### Service Architecture

#### Microservices Structure
```yaml
services:
  trip-service:
    responsibilities:
      - Trip CRUD operations
      - Itinerary management
      - Collaboration features
    database: PostgreSQL
    cache: Redis
    
  user-service:
    responsibilities:
      - User management
      - Profile operations
      - Preferences
    database: PostgreSQL
    cache: Redis
    
  sync-service:
    responsibilities:
      - Real-time synchronization
      - Conflict resolution
      - Offline sync queue
    database: PostgreSQL
    queue: RabbitMQ/SQS
    
  media-service:
    responsibilities:
      - Image/video upload
      - Processing & optimization
      - CDN management
    storage: S3/CloudStorage
    cdn: CloudFront/Cloudflare
```

### Data Architecture

#### Database Schema
```sql
-- Core Tables
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trips (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  destination JSONB,
  participants UUID[],
  status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trip_items (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  type VARCHAR(50), -- 'accommodation', 'transport', 'activity'
  data JSONB,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync Management
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id UUID,
  payload JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Caching Strategy
- **Redis Layers**:
  - Session cache (user sessions)
  - Query cache (frequent API responses)
  - Real-time data (active trips, online users)

### Security Architecture

#### Authentication & Authorization
- **Auth0 Integration**:
  ```typescript
  // Mobile Auth Configuration
  const auth0Config = {
    domain: 'your-tenant.auth0.com',
    clientId: 'your-client-id',
    audience: 'https://api.tripsync.com',
    scope: 'openid profile email offline_access',
  };
  ```

- **Token Management**:
  - Access tokens (15 min expiry)
  - Refresh tokens (30 day expiry)
  - Secure storage in MMKV

#### Security Layers
1. **Network Security**:
   - HTTPS everywhere
   - Certificate pinning for mobile
   - API rate limiting

2. **Application Security**:
   - Input validation (Zod schemas)
   - SQL injection prevention
   - XSS protection
   - CSRF tokens

3. **Data Security**:
   - Encryption at rest
   - Encryption in transit
   - PII data masking
   - Audit logging

## Infrastructure Architecture

### Deployment Strategy

#### Mobile Deployment
```yaml
environments:
  development:
    - Local development builds
    - Expo Dev Client
    - Hot reloading enabled
    
  staging:
    - Internal testing builds
    - TestFlight (iOS)
    - Internal testing track (Android)
    - Feature flags enabled
    
  production:
    - App Store (iOS)
    - Google Play Store (Android)
    - OTA updates via Expo
```

#### Backend Deployment
- **Container Orchestration**: Kubernetes/ECS
- **CI/CD Pipeline**: GitHub Actions → Build → Test → Deploy
- **Infrastructure as Code**: Terraform/CloudFormation

### Monitoring & Observability

#### Application Monitoring
- **Crash Reporting**: Sentry/Bugsnag
- **Analytics**: Mixpanel/Amplitude
- **Performance**: React Native Performance Monitor
- **User Sessions**: FullStory/LogRocket

#### Backend Monitoring
- **APM**: New Relic/DataDog
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Metrics**: Prometheus + Grafana
- **Alerts**: PagerDuty integration

### Scalability Strategy

#### Horizontal Scaling
- **Load Balancing**: Application Load Balancer
- **Auto-scaling**: Based on CPU/Memory metrics
- **Database Replication**: Read replicas for queries
- **CDN**: Global content delivery

#### Performance Targets
- **API Response Time**: < 200ms (p95)
- **App Launch Time**: < 2 seconds
- **Screen Load Time**: < 1 second
- **Availability**: 99.9% uptime

## Development Workflow

### Development Environment
```bash
# Local Setup
pnpm install
pnpm start

# Platform-specific
pnpm ios      # iOS Simulator
pnpm android  # Android Emulator
pnpm web      # Web Browser

# Environment switching
APP_ENV=staging pnpm start
APP_ENV=production pnpm build:ios
```

### Quality Assurance

#### Testing Strategy
- **Unit Tests**: Jest + React Native Testing Library
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Maestro for mobile flows
- **Performance Tests**: Load testing with k6

#### Code Quality
- **Linting**: ESLint with custom rules
- **Formatting**: Prettier with pre-commit hooks
- **Type Checking**: TypeScript strict mode
- **Code Review**: PR-based workflow

### Release Process

#### Mobile Release
1. **Version Bump**: Update version in package.json
2. **Build**: EAS Build for target environment
3. **Test**: Internal testing track
4. **Release**: Gradual rollout (10% → 50% → 100%)
5. **Monitor**: Track crashes and performance

#### Backend Release
1. **Blue-Green Deployment**: Zero-downtime updates
2. **Database Migrations**: Forward-compatible changes
3. **Feature Flags**: Gradual feature rollout
4. **Rollback Plan**: Quick reversion capability

## Future Considerations

### Planned Enhancements
1. **Real-time Collaboration**: WebSocket for live updates
2. **Offline-First**: Complete offline functionality
3. **AI Integration**: Smart trip suggestions
4. **Social Features**: Trip sharing and discovery
5. **Web Dashboard**: Full-featured web application

### Technical Debt Management
- **Quarterly Reviews**: Assess and prioritize tech debt
- **Refactoring Sprints**: Dedicated improvement cycles
- **Dependency Updates**: Monthly security patches
- **Performance Audits**: Bi-monthly performance reviews

### Scaling Considerations
- **Multi-region Deployment**: Global presence
- **Microservices Migration**: Service decomposition
- **Event-Driven Architecture**: Event sourcing/CQRS
- **GraphQL Federation**: Unified API gateway

## Conclusion

This architecture provides a solid foundation for Trip Sync v2, balancing modern best practices with pragmatic technology choices. The system is designed to start simple but scale gracefully as user needs and technical requirements evolve. The focus on user experience, developer productivity, and operational excellence ensures sustainable growth and maintainability.

### Key Success Metrics
- **User Experience**: < 2s app launch, < 1s screen transitions
- **Developer Velocity**: < 1 day feature-to-production
- **System Reliability**: 99.9% uptime
- **Code Quality**: > 80% test coverage
- **Performance**: < 200ms API response time

### Architecture Principles Recap
1. **Mobile-First Design**: Optimized for mobile constraints
2. **Progressive Complexity**: Simple to start, scalable by design
3. **Pragmatic Choices**: Boring technology where possible
4. **User-Centric**: Architecture serves user needs
5. **Developer Experience**: Productive and enjoyable development
6. **Cost-Conscious**: Efficient resource utilization
7. **Security by Default**: Built-in security at every layer
8. **Observable Systems**: Comprehensive monitoring
9. **Resilient Design**: Graceful degradation and recovery
10. **Living Architecture**: Designed for continuous evolution