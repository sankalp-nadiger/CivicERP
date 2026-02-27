# Contractor Task Manager UI

A mobile-first, high-contrast field worker interface for the CivicERP Complaint Management System. This module enables contractors to view assigned tasks, update complaint statuses through a 6-stage workflow, submit evidence (photos + GPS), and work offline with automatic sync capability.

## 📋 Features

### 1. **Assigned Task List (Active Jobs)**
- Card-based UI showing all active tasks
- Display: Ticket ID, Complaint Category, Location
- Quick access to location via Map/GPS shortcut
- SLA countdown timer on each card
- High-contrast colors for outdoor visibility
- Priority badges (Critical, High, Medium, Low)

### 2. **6-Stage Workflow Update**
The interface guides contractors through these stages:
1. **Intake** - Initial complaint registration
2. **Screening** - Complaint verification
3. **Assignment** - Task assigned to contractor
4. **Fieldwork** - On-site repair work
5. **Verification** - Quality check & inspection
6. **Approval** - Final approval & closure

**Workflow Controls:**
- Visual stage progression bar
- "Next Stage" button for linear progression
- Stage confirmation modal
- Current stage highlighting
- Completed stage indicators

### 3. **Real-Time Evidence Submission**

#### Photo Upload
- **Before/After photos** captured via device camera or file upload
- Large, touch-friendly camera UI for gloved operation
- Automatic photo metadata capture
- Photos stored with timestamp

#### Geo-Tagging
- GPS coordinates automatically attached to updates
- "Capture GPS" button for manual refresh
- Displays: Latitude, Longitude with decimal precision
- Fallback to last known coordinates offline
- GPS status indicators (success/error)

### 4. **Offline Capability & Sync**

#### Offline Features
- PWA caching support
- Local storage for task updates
- Offline status indicator (🔴 Online/Offline)
- Queue system for pending updates
- Auto-sync when connectivity restored

#### Sync Management
- Real-time sync status display
- Pending updates counter
- Manual "Sync Now" button
- Background sync in progress indicator
- Sync completion notifications

### 5. **Multilingual & Accessibility**

#### Language Support
- One-tap language switcher
- Supported languages:
  - 🇬🇧 English
  - 🇪🇸 Spanish
  - 🇫🇷 French
  - 🇮🇳 Hindi
  - 🇩🇪 German
  - 🇬🇪 Georgian

#### Accessibility
- Large, touch-friendly buttons (minimum 44x44px)
- High-contrast color scheme (yellow on dark gray)
- Large, readable fonts (glove-friendly)
- Simplified navigation
- Clear status indicators
- Voice-friendly interface labels

### 6. **SLA Monitoring**

#### Visual Countdown Timer
- Displays days, hours, minutes remaining
- Color-coded urgency:
  - 🟢 Green: >3 days remaining
  - 🟡 Yellow: 1-3 days remaining
  - 🔴 Red: <1 day or overdue
- Overdue alerts with visual emphasis
- Automatic updates every minute

## 🎨 Design Philosophy

### Mobile-First Approach
- Optimized for small screens (mobile-first CSS)
- Responsive grid layouts
- Touch-optimized spacing
- Vertical scrolling as primary navigation

### High-Contrast for Outdoor Use
- Dark background (dark gray #111827)
- Yellow accents (#FBBF24) for primary actions
- White/light gray text on dark backgrounds
- Minimum 7:1 contrast ratio for WCAG AAA compliance
- Large visual separators and borders

### Rugged & Durable UX
- Minimal animations (reduces data usage)
- Large tap targets (44x44px minimum)
- Clear error messages
- Offline-first design
- Slow network resilience

## 📁 Component Structure

```
src/components/dashboard/contractor/
├── ContractorTaskManager.tsx      # Main container component
├── TaskCard.tsx                   # Individual task card
├── WorkflowStageSelector.tsx      # 6-stage workflow UI
├── EvidenceUpload.tsx             # Photo + GPS capture
├── OfflineSyncStatus.tsx          # Sync status display
├── LanguageSwitcher.tsx           # Language selector
├── types.ts                       # TypeScript interfaces
└── index.ts                       # Module exports
```

## 🔄 Data Flow

```
ContractorTaskManager (State Management)
├── Tasks State (CRUD operations)
├── Online/Offline Status
├── Sync Queue
└── Language Context

  ├── TaskCard
  │   └── On Select → Set Active Task
  │
  ├── WorkflowStageSelector
  │   └── On Stage Change → Update Task
  │
  └── EvidenceUpload
      └── On Evidence Submit → Update Task + Queue Sync
```

## 🛠️ Usage Example

```typescript
import { ContractorTaskManager } from '@/components/dashboard/contractor';

export default function ContractorDashboard() {
  return <ContractorTaskManager />;
}
```

## 📱 API Integration Points

### Expected Backend API Endpoints

```typescript
// Get assigned tasks
GET /api/contractor/tasks?status=active

// Update task stage
PATCH /api/contractor/tasks/:taskId/stage
{
  stage: "Fieldwork",
  timestamp: "2026-01-13T10:30:00Z"
}

// Submit evidence
POST /api/contractor/tasks/:taskId/evidence
{
  beforePhoto: File,
  afterPhoto: File,
  coordinates: { lat: 40.7128, lng: -74.0060 },
  notes: "Work completed successfully",
  timestamp: "2026-01-13T10:35:00Z"
}

// Sync pending updates (offline mode)
POST /api/sync/batch
{
  updates: [
    { taskId, stage, timestamp },
    { taskId, evidence, timestamp }
  ]
}
```

## 🔐 Offline Data Storage

### LocalStorage Schema

```javascript
// Pending updates queue
localStorage.setItem('pending_updates', JSON.stringify([
  {
    type: 'stage_update',
    taskId: 'TASK-001',
    stage: 'Fieldwork',
    timestamp: '2026-01-13T10:30:00Z'
  },
  {
    type: 'evidence_submit',
    taskId: 'TASK-001',
    evidence: { beforePhoto, afterPhoto, coordinates, notes },
    timestamp: '2026-01-13T10:35:00Z'
  }
]));

// Last sync timestamp
localStorage.setItem('last_sync', '2026-01-13T09:00:00Z');
```

## 🌍 Localization Keys

All UI text uses i18n keys under `contractor.*` namespace:

```json
{
  "contractor": {
    "taskManager": { "title", "subtitle" },
    "online": "Online",
    "offline": "Offline",
    "activeTasks": "Active Tasks",
    "workflowProgress": "Workflow Progress",
    "evidenceSubmission": "Evidence Submission",
    "geoLocation": "Geo-Location",
    ...
  }
}
```

## ♿ Accessibility Features

- ✅ Keyboard navigation support
- ✅ Screen reader friendly labels
- ✅ High contrast mode compatible
- ✅ Large touch targets (minimum 44x44px)
- ✅ Focus indicators visible
- ✅ Error messages in clear language
- ✅ Status updates announced to screen readers

## 🚀 Performance Optimizations

- **Image Compression**: Photos compressed before upload
- **Lazy Loading**: Cards load on scroll
- **Caching**: Task list cached locally
- **Minimal Re-renders**: React.memo on card components
- **Network-First**: Uses online check before sync
- **Background Sync**: Service Worker integration ready

## 📝 Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## 🔧 Development Notes

### Mock Data
The component includes mock tasks for development. Replace with actual API calls:

```typescript
// In ContractorTaskManager.tsx
const [tasks, setTasks] = useState<ContractorTask[]>(mockTasks);

// Replace with:
useEffect(() => {
  fetchTasks().then(setTasks);
}, []);
```

### Offline Testing
To test offline mode:
1. Open DevTools → Network tab
2. Select "Offline" from connection dropdown
3. Observe status changes and local storage updates

### GPS Testing
GPS requires HTTPS and user permission. For testing:
```typescript
// Use mock coordinates
const mockCoordinates = { lat: 40.7128, lng: -74.0060 };
```

## 📊 SLA Configuration

Edit SLA deadlines in TaskCard and ContractorTaskManager:

```typescript
// Color thresholds (days remaining)
> 3 days: Green (#22C55E)
1-3 days: Yellow (#EAB308)
< 1 day: Red (#EF4444)
```

## 🎯 Next Steps

1. **Backend Integration**: Connect to CivicERP API endpoints
2. **Service Worker**: Implement PWA offline caching
3. **Push Notifications**: Add task updates via Web Push
4. **Analytics**: Track task completion metrics
5. **Multi-Language**: Complete translations for all 6 languages
6. **Testing**: Add unit tests for workflow logic

## 📄 License

Part of the CivicERP System.
