# Backend API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Governance Endpoints

### 1. Create Department
**POST** `/governance/departments`

Creates a new department and automatically generates login credentials for the contact person.

**Request Body:**
```json
{
  "name": "Water Supply Department",
  "description": "Manages water supply and distribution",
  "contactPerson": "John Doe",
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "governanceType": "city",
  "level": 1
}
```

**Response:**
```json
{
  "message": "Department created successfully",
  "department": {
    "_id": "...",
    "name": "Water Supply Department",
    "contactPerson": "John Doe",
    "email": "john.doe@example.com",
    "userId": "..."
  },
  "emailSent": true,
  "credentials": {
    "email": "john.doe@example.com",
    "password": "Dept1234"
  }
}
```

---

### 2. Get Departments
**GET** `/governance/departments?governanceType=city&level=1`

Retrieves all departments with optional filters.

**Query Parameters:**
- `governanceType` (optional): "city" or "panchayat"
- `level` (optional): 1-4

**Response:**
```json
[
  {
    "_id": "...",
    "name": "Water Supply Department",
    "contactPerson": "John Doe",
    "email": "john.doe@example.com",
    "userId": {...}
  }
]
```

---

### 3. Create Area
**POST** `/governance/areas`

Creates a new area/zone within a department and generates credentials.

**Request Body:**
```json
{
  "name": "North Zone",
  "description": "Northern area of the city",
  "contactPerson": "Jane Smith",
  "email": "jane.smith@example.com",
  "phone": "9876543210",
  "departmentId": "department_id_here",
  "governanceType": "city",
  "level": 2
}
```

**Response:**
```json
{
  "message": "Area created successfully",
  "area": {
    "_id": "...",
    "name": "North Zone",
    "contactPerson": "Jane Smith",
    "email": "jane.smith@example.com"
  },
  "emailSent": true,
  "credentials": {
    "email": "jane.smith@example.com",
    "password": "Area5678"
  }
}
```

---

### 4. Get Areas
**GET** `/governance/areas?governanceType=city&level=2&departmentId=...`

Retrieves all areas with optional filters.

**Query Parameters:**
- `governanceType` (optional): "city" or "panchayat"
- `level` (optional): 1-4
- `departmentId` (optional): Filter by department

**Response:**
```json
[
  {
    "_id": "...",
    "name": "North Zone",
    "contactPerson": "Jane Smith",
    "departmentId": {...}
  }
]
```

---

### 5. Add Officer
**POST** `/governance/officers`

Adds a new officer and generates credentials.

**Request Body:**
```json
{
  "name": "Mike Johnson",
  "email": "mike.j@example.com",
  "phone": "5551234567",
  "departmentId": "department_id_here",
  "areaId": "area_id_here",
  "governanceType": "city",
  "level": 3
}
```

**Response:**
```json
{
  "message": "Officer added successfully",
  "officer": {
    "_id": "...",
    "name": "Mike Johnson",
    "email": "mike.j@example.com",
    "userId": "..."
  },
  "emailSent": true,
  "credentials": {
    "email": "mike.j@example.com",
    "password": "Off9012"
  }
}
```

---

### 6. Get Officers
**GET** `/governance/officers?governanceType=city&level=3&areaId=...`

Retrieves all officers with optional filters.

**Query Parameters:**
- `governanceType` (optional): "city" or "panchayat"
- `level` (optional): 2-4
- `departmentId` (optional): Filter by department
- `areaId` (optional): Filter by area

**Response:**
```json
[
  {
    "_id": "...",
    "name": "Mike Johnson",
    "email": "mike.j@example.com",
    "departmentId": {...},
    "areaId": {...},
    "userId": {...}
  }
]
```

---

## Authentication Endpoints

### 1. Sign Up
**POST** `/auth/signup`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNo": "1234567890",
  "role": "User"
}
```

---

### 2. Sign In
**POST** `/auth/signin`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "_id": "...",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "city-level1"
}
```

---

### 3. Sign Out
**POST** `/auth/signout`

Clears the authentication cookie.

---

## Email Configuration

To enable email sending, configure the following in your `.env` file:

```env
USER_EMAIL="your-email@gmail.com"
USER_PASS="your-app-password"
FRONTEND_URL="http://localhost:5173"
```

### Setting up Gmail App Password:
1. Enable 2-Factor Authentication on your Google Account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate a new App Password for "Mail"
4. Use the 16-character password in `USER_PASS`

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "message": "Error description here"
}
```
