# Complaint Fetching - Admin Dashboard Integration

## Summary

Successfully implemented the complete flow to fetch complaints from the database and display them on the admin frontend dashboard.

## Changes Made

### 1. Backend (Already Existed)
- ✅ **Endpoint**: `POST /admin/all` - Already implemented in AdminController
- ✅ **Route**: Properly configured in AdminRouter
- ✅ **Model**: ComplaintModel properly structured with all necessary fields

### 2. Frontend Service Layer
**File**: `client/src/services/complaintService.ts`
- Created new type definitions matching backend schema:
  - `Complaint` interface with all backend fields
  - `ComplaintStats` interface
  - `AdminComplaintsResponse` interface
- Added API functions:
  - `getAllComplaints()` - Fetches all complaints from `/admin/all`
  - `getAdminComplaintStats()` - Fetches complaint statistics
  - `updateComplaintStatus()` - Updates complaint status via `/admin/status`

### 3. Complaints Table Component
**File**: `client/src/components/dashboard/shared/ComplaintsTable.tsx`
- Created a comprehensive complaints table with:
  - Searchable complaints (by complaint text, title, categories)
  - Filterable by status (All, To Do, In Progress, Completed, Resolved)
  - Detailed complaint view dialog
  - Status update functionality with comments
  - Priority badges (High/Medium/Low based on priority_factor)
  - Status badges with appropriate colors
  - Date formatting using date-fns
  - Full complaint details including:
    - AI-generated summary
    - Category tags
    - User who raised the complaint
    - Comment history
    - Proof documents

### 4. Admin Dashboard Integration
**File**: `client/src/pages/dashboard/Level1Dashboard.tsx`
- Added imports for complaint fetching
- Added state management:
  - `apiComplaints` - stores complaints from database
  - `isLoadingComplaints` - loading state
- Created `fetchComplaints()` function that calls the API
- Added `useEffect` to fetch complaints on component mount
- Updated statistics cards to show real-time data:
  - Total Complaints
  - Open Complaints
  - In Progress
  - Closed (Total)
- Added new "Complaints" tab with:
  - Full complaints table
  - Loading state
  - Refresh on update
- Updated charts to use API data:
  - Complaint Status Distribution (Bar Chart)
  - Priority Distribution (Pie Chart)

### 5. Environment Configuration
**File**: `client/.env`
- Created `.env` file with `VITE_API_URL=http://localhost:3000`

## How to Use

### 1. Start the Backend Server
```bash
cd server
npm install
npm start
```
The server should run on `http://localhost:3000`

### 2. Start the Frontend
```bash
cd client
npm install
npm run dev
```

### 3. Access Admin Dashboard
1. Navigate to the Level1Dashboard (Municipal Commissioner / Zilla Panchayat CEO)
2. Click on the "Complaints" tab
3. You'll see all complaints from the database
4. Use the search bar to search by text, title, or category
5. Use the filter dropdown to filter by status
6. Click "View" on any complaint to see full details and update status

## Features

### Complaints Table
- **Search**: Real-time search across complaint text, titles, and categories
- **Filter**: Filter by status (All, To Do, In Progress, Completed, Resolved)
- **View Details**: Click to see full complaint with all information
- **Update Status**: Change status and add comments directly from the detail view
- **Priority Indication**: Visual priority badges (High/Medium/Low)
- **Date Display**: Formatted dates for easy reading

### Status Management
- To Do
- In Progress
- Under Investigation
- Completed
- Resolved

### Priority Levels
- **High**: Priority Factor >= 0.7 (Red badge)
- **Medium**: Priority Factor >= 0.4 (Yellow badge)
- **Low**: Priority Factor < 0.4 (Gray badge)

## API Endpoints Used

1. **GET All Complaints**: `POST /admin/all`
2. **Update Status**: `PUT /admin/status`
   - Body: `{ complaint_id, status, comments }`

## Data Flow

```
Database (MongoDB) 
  ↓
Backend API (/admin/all)
  ↓
complaintService.getAllComplaints()
  ↓
Level1Dashboard (React State)
  ↓
ComplaintsTable Component
  ↓
User Interface
```

## Notes

- All complaint data is fetched from the MongoDB database via the backend API
- Status updates are immediately persisted to the database
- The dashboard automatically refreshes complaint data after any update
- The component handles loading states and error cases gracefully
- All dates are formatted using date-fns for consistency
