/**
 * Real-time Communication Module
 * WebSocket/Socket.io integration for live updates
 */

// Service
export { default as realtimeService } from './websocket-service';

// Provider
export { RealtimeProvider, useRealtimeContext } from './realtime-provider';

// Hooks
export * from './use-realtime';

// Types
export * from './types';