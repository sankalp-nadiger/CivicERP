# CivicERP Dashboard Documentation

## Overview

This is an enterprise-grade React dashboard system for CivicERP, a Governance ERP system designed for municipal transparency and civic complaint management. The dashboard is built with React 18+, Tailwind CSS, Shadcn UI, and Lucide React icons.

## Architecture

The dashboard is split into two main role-based dashboards:

### 1. MCC (Municipal Commissioner) Dashboard
Municipal-level administration and oversight dashboard with:
- **Department Management**: Add, edit, and manage municipal departments
- **Invite System**: Send signup links to department heads
- **City-Wide Analytics**: SLA compliance and bottleneck detection across departments
- **Real-time Monitoring**: Active tasks and performance metrics

### 2. Department Head Dashboard
Department-level task management dashboard with:
- **Contractor Management**: Search and filter contractors by availability
- **Task Assignment**: Assign civic complaints to available contractors
- **Progress Tracking**: Real-time monitoring of task stages (Intake → Fieldwork → Verification → Approval)
- **SLA Timers**: Visual countdowns for service level agreement deadlines

## Features

### Multi-Language Support (i18next)
- Supports: English, Spanish, French, German, Hindi
- Language toggle in top navigation
- Automatic browser language detection
- Persistent language preference in localStorage

### Audit Logs & Work History
- Chronological record of all actions
- Change tracking (before/after values)
- Performer attribution
- Cryptographic audit trail support (localStorage persistence)

### SLA Timer Component
- Visual countdown with progress bar
- Priority-based color coding
- Automatic deadline calculations
- Overdue notifications
- Real-time updates every minute

### Progress Tracker
- Multi-stage workflow visualization
- Stage completion indicators
- Timestamps for each stage
- Visual progress bar

### Responsive Design
- Mobile-first approach
- Sidebar navigation with collapse support
- Grid-based layouts
- Touch-friendly controls

## Directory Structure

```
src/
├── components/
│   └── dashboard/
│       ├── mcc/
│       │   ├── MCCOverview.tsx
│       │   ├── DepartmentManagement.tsx
│       │   └── CityWideAnalytics.tsx
│       ├── department-head/
│       │   ├── DepartmentHeadOverview.tsx
│       │   ├── ContractorManagement.tsx
│       │   └── TaskAssignment.tsx
│       └── shared/
│           ├── DashboardSidebar.tsx
│           ├── LanguageToggle.tsx
│           ├── SLATimer.tsx
│           ├── AuditLogs.tsx
│           └── ProgressTracker.tsx
├── pages/
│   └── dashboard/
│       ├── MCCDashboard.tsx
│       └── DepartmentHeadDashboard.tsx
├── hooks/
│   └── dashboard/
│       ├── useAuditLog.ts
│       ├── useTaskAssignment.ts
│       ├── useDepartmentManagement.ts
│       └── useSLATimer.ts
├── services/
│   └── dashboard/
│       └── dashboardService.ts
└── locales/
    ├── i18n.ts
    ├── en.json
    ├── es.json
    ├── fr.json
    ├── de.json
    └── hi.json
```

## Installation

### 1. Install Dependencies

```bash
cd client
bun install
# or
npm install
```

### 2. Configure i18n

The i18n configuration is already set up in `src/locales/i18n.ts`. It will:
- Auto-detect browser language
- Fall back to English if language not available
- Save language preference to localStorage

### 3. Import in Main App

In your `main.tsx` or `App.tsx`:

```typescript
import i18n from './locales/i18n';
import { I18nextProvider } from 'react-i18next';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      {/* Your app components */}
    </I18nextProvider>
  );
}
```

## Usage Examples

### Using MCC Dashboard

```typescript
import MCCDashboard from '@/pages/dashboard/MCCDashboard';

function App() {
  return <MCCDashboard />;
}
```

### Using Department Head Dashboard

```typescript
import DepartmentHeadDashboard from '@/pages/dashboard/DepartmentHeadDashboard';

function App() {
  return <DepartmentHeadDashboard />;
}
```

### Using Individual Components

```typescript
import { DepartmentManagement } from '@/components/dashboard/mcc/DepartmentManagement';
import { SLATimer } from '@/components/dashboard/shared/SLATimer';
import { AuditLogs } from '@/components/dashboard/shared/AuditLogs';

// In your component
<DepartmentManagement />
<SLATimer deadline={new Date()} taskId="TASK-001" priority="high" />
<AuditLogs entries={auditLogs} taskId="TASK-001" />
```

## Hooks

### useAuditLog
Manage audit logs with persistence:

```typescript
const { logs, addLog, clearLogs } = useAuditLog();

addLog({
  action: 'updated',
  performer: 'John Doe',
  timestamp: new Date(),
  description: 'Updated department status',
  changes: {
    status: { old: 'pending', new: 'active' }
  }
});
```

### useSLATimer
Manage SLA timers and deadline calculations:

```typescript
const { registerTimer, calculateDeadline, isOverdue, getSLAConfig } = useSLATimer();

const deadline = calculateDeadline('critical'); // 4 hours
registerTimer('TASK-001', deadline);

if (isOverdue('TASK-001')) {
  console.log('Task is overdue!');
}
```

### useTaskAssignment
Handle task assignment operations:

```typescript
const { assignTask, updateTaskStatus, isLoading } = useTaskAssignment();

const result = await assignTask('TASK-001', 'CONTRACTOR-001', deadline);
await updateTaskStatus('TASK-001', 'in-progress');
```

### useDepartmentManagement
Manage department operations:

```typescript
const { sendInvitation, createDepartment, isLoading } = useDepartmentManagement();

await createDepartment('Water Supply', 'John Doe', 'john@municipality.gov');
await sendInvitation('john@municipality.gov', 'DEPT-001');
```

## Service Layer

The `dashboardService` provides mock API endpoints. Replace with actual backend calls:

```typescript
import { dashboardService } from '@/services/dashboard/dashboardService';

const departments = await dashboardService.getDepartments();
const tasks = await dashboardService.getTasks('DEPT-001');
const analytics = await dashboardService.getCityWideAnalytics();
```

## Styling

- **Framework**: Tailwind CSS
- **Components**: Shadcn UI
- **Icons**: Lucide React
- **Charts**: Recharts

## i18n Keys Structure

```json
{
  "dashboard": { /* navigation items */ },
  "mcc": { /* MCC-specific keys */ },
  "departmentHead": { /* Department Head-specific keys */ },
  "stages": { /* workflow stages */ },
  "sla": { /* SLA-related keys */ },
  "auditLog": { /* audit log keys */ },
  "common": { /* shared keys */ }
}
```

## Color Scheme

- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)
- **Background**: Light Gray (#f3f4f6)

## Performance Optimizations

- Memoized components for expensive renders
- Lazy loading of dashboard sections
- Efficient re-renders with proper dependency arrays
- LocalStorage caching for audit logs and preferences

## Security Considerations

- Audit logs are stored in localStorage (client-side only for demo)
- For production: Implement backend cryptographic audit trail
- Use JWT tokens for authentication
- Implement role-based access control (RBAC) on backend
- Encrypt sensitive data in transit

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

## Future Enhancements

- [ ] Real-time WebSocket updates for tasks
- [ ] Advanced filtering and search
- [ ] Export reports (PDF, CSV)
- [ ] Email notifications
- [ ] Mobile app companion
- [ ] Advanced analytics dashboards
- [ ] Integration with payment systems
- [ ] Document upload and management
- [ ] SMS notifications
- [ ] Push notifications

## Troubleshooting

### i18n not working
- Ensure `I18nextProvider` wraps your app in `main.tsx`
- Check that translation files are in `locales/` folder
- Clear browser cache and localStorage

### Components not rendering
- Verify Shadcn UI components are installed
- Check Tailwind CSS is configured properly
- Ensure Lucide React icons are available

### Charts not displaying
- Verify Recharts is installed
- Check data is being passed correctly
- Ensure container has defined height/width

## Contributing

When adding new features:
1. Create new components in appropriate folder
2. Add i18n translations to all language files
3. Create hooks if needed in `hooks/dashboard/`
4. Add service methods to `dashboardService.ts`
5. Update this documentation

## License

MIT
