# 🔐 Authentication Debug Guide

This guide will help you debug the 401 authentication errors you're experiencing.

## 🚨 Quick Diagnosis

Based on the error logs, your authentication system is failing because **the mobile app is not attaching authorization headers** to API requests.

## 🛠️ Debug Tools Created

I've created several debugging utilities to help identify and fix the issue:

### 1. AuthDebugger Utility
**File**: `src/lib/auth/debug-utils.tsx`
- Comprehensive token diagnostics
- API connectivity testing  
- Storage validation
- JWT token inspection

### 2. Enhanced API Client (with logging)
**File**: `src/api/common/client-debug.tsx`
- Detailed request/response logging
- Token attachment verification
- Step-by-step authentication flow tracking

### 3. Test Login Component
**File**: `src/lib/auth/test-login.tsx`
- Manual login testing interface
- Direct API authentication testing
- Token storage verification

### 4. Debug Panel Component
**File**: `src/components/AuthDebugPanel.tsx`
- All-in-one debugging interface
- Real-time status monitoring
- Easy-to-use test buttons

## 🔧 Quick Setup

### Step 1: Add Debug Panel to Your App

Add the debug panel to your main screen temporarily:

```tsx
// In your main screen component (e.g., src/app/(app)/index.tsx)
import { AuthDebugPanel } from '@/components/AuthDebugPanel';

export default function HomeScreen() {
  return (
    <View>
      {/* Your existing content */}
      
      {/* Add debug panel temporarily */}
      <AuthDebugPanel />
    </View>
  );
}
```

### Step 2: Run Initial Diagnostics

1. **Start your app** with `pnpm ios`
2. **Look for the debug panel** (green/red status bar)
3. **Tap "Run Full Diagnostics"**
4. **Check the console logs** for detailed output

### Step 3: Test Authentication Flow

1. **Test API connectivity** first
2. **Try a test login** (if you have valid credentials)
3. **Test the trip API call** to reproduce the 401 error

## 🔍 Expected Findings

Based on your error logs, you'll likely find:

### ❌ Problem 1: No Token Stored
```
Token exists: false
No token found in storage
```

**Solution**: You need to authenticate first. The app has no authentication tokens.

### ❌ Problem 2: Token Not Attached
```
Authorization header: NOT SET
```

**Solution**: The axios interceptor should be attaching `Bearer {token}`, but it's not working.

### ❌ Problem 3: Authentication Flow Missing
```
No login/authentication flow active
```

**Solution**: The app needs to authenticate users and store tokens before making API calls.

## 🔄 Step-by-Step Debug Process

### Phase 1: Verify Token Storage
```bash
# Check console for:
# 🔐 Token exists: false/true
# 💾 MMKV working: true
# 📋 All stored keys: [...]
```

### Phase 2: Test API Connectivity  
```bash
# Should see:
# ✅ API reachable: 200
# 📥 Response: {"status":"ok"}
```

### Phase 3: Test Authentication
```bash
# Try login endpoint:
# 🔑 Auth endpoint status: 200
# 📥 Auth response: { success: true, data: {...} }
```

### Phase 4: Test Token Attachment
```bash
# Check request logs:
# 📤 Final headers: { Authorization: "Bearer [TOKEN]" }
# ✅ Authorization header set
```

## 🚀 Quick Fixes

### Fix 1: Missing Authentication
If no tokens are found, you need to implement user login:

```tsx
// Add login functionality
import { TestLogin } from '@/lib/auth/test-login';

// Use the TestLogin component to authenticate
```

### Fix 2: Broken Token Attachment
If tokens exist but aren't attached:

```tsx
// Replace client.tsx with client-debug.tsx temporarily
// Check the request interceptor logs for token attachment
```

### Fix 3: Invalid Token Format
If tokens are malformed:

```tsx
// Use AuthDebugger.diagnoseToken() to inspect token structure
// Verify tokens match the expected TokenType format
```

## 📱 Backend Requirements

Make sure your backend is running and accessible:

1. **Hono API server** should be running on the configured URL
2. **Authentication endpoints** should be available:
   - `POST /api/v2/auth/login`
   - `POST /api/v2/auth/refresh`  
   - `GET /api/v2/trips` (protected)

## 🧹 Cleanup After Debugging

Once you've identified and fixed the issue:

1. **Remove** the debug panel from your main screen
2. **Replace** `client-debug.tsx` back to original `client.tsx`  
3. **Delete** the debug files if no longer needed
4. **Keep** useful utilities like `AuthDebugger` for future debugging

## ⚡ Most Likely Issue

Based on the error pattern, the most likely cause is:

**The app has no authentication tokens stored**, which means:
1. Users aren't logging in successfully
2. The login flow isn't storing tokens properly
3. Tokens are being cleared unexpectedly

Run the diagnostics to confirm this hypothesis!

## 🆘 Need Help?

If you're still stuck after running diagnostics:

1. **Share the console output** from the diagnostics
2. **Check if your backend is running** and accessible
3. **Verify your API_URL** environment variable is correct
4. **Test login credentials** are valid for your backend

The debug tools will give you detailed insights into exactly where the authentication flow is breaking down.