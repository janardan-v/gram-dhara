# Project Overview

Gram Dhara is a civic issue reporting platform with a Node.js/Express backend and a static frontend. It is designed to support end-to-end report submission, administrative review, assignment, status updates, and communication for water and infrastructure complaints.

## Objectives

- Provide citizens with a simple workflow for reporting issues with photos, location, and optional voice notes.
- Enable department admins and super admins to manage reports, assign work, update status, and resolve issues.
- Preserve audit trails, notifications, and analytics for operational visibility.
- Use a modular backend structure to separate routes, controllers, models, middleware, and utilities.

## Functional Requirements

- User registration and login with credential validation
- Password reset via email token
- JWT-based access and refresh token authentication
- Citizen report submission with media upload
- Role-based access control for admin, department admin, and super admin users
- Report assignment, status updates, and resolution with completion photos
- Notices/announcements management for admins
- Notifications for users and task reminders for assigned officials
- Report history and analytics capture

## Architecture

Gram Dhara uses a RESTful Node.js backend and static frontend. The backend is segmented into:

- `routes/` for endpoint definitions
- `controllers/` for request handling and business logic
- `models/` for Mongoose schema definitions
- `middlewares/` for authentication, authorization, upload validation, and error handling
- `utils/` for Cloudinary uploads, email delivery, analytics generation, and notification scheduling

The frontend uses static HTML/CSS/JS pages with a shared API client (`frontend/js/api-client.js`) that interacts with backend endpoints via `fetch`.

## Authentication Flow

1. User registers with username, name, email, password, and phone number.
2. Login validates credentials and returns access and refresh JWTs.
3. Access token is used for protected routes via `Authorization: Bearer` header or cookie.
4. Refresh token is stored in the user document and can be exchanged for a new access token via `/api/v1/users/refresh-token`.
5. Logout clears the refresh token from the user record and clears cookies.
6. Forgot password sends a timed reset token by email, and reset uses token validation against hashed token and expiry.

## Authorization Model

Roles recorded in `User.role`:

- `citizen` — report submission and personal report/notification views
- `department_admin` — admin dashboard actions, report assignment, status updates, notice management
- `super_admin` — super-admin-only routes for user role control

Middleware enforces authorization:

- `authMiddleware` validates JWT and attaches `req.user`
- `admin.middleware.js` enforces department admin or super admin access
- `superAdmin.middleware.js` enforces super admin access
- `departmentAdmin.middleware.js` validates department association for assigned reports

## Report Lifecycle

1. Citizen submits a report via `/api/v1/reports/submit` with title, description, category, photo, and location.
2. The report is stored in MongoDB with status `pending` and a history entry is created.
3. Admins retrieve reports through protected report endpoints.
4. Admins assign a report to an official or department using `/api/v1/admin/reports/:reportId/assign`.
5. Status changes are saved through `/api/v1/admin/reports/:reportId/status` with notifications and history entries.
6. A report can be resolved with a completion photo using `/api/v1/admin/reports/:reportId/resolve`.
7. Pending reports older than 48 hours trigger reminder notifications from an hourly cron job.

## Backend Components

### Controllers

- `user.controller.js` — registration, login, logout, refresh token, current user, password reset, and password change
- `report.controller.js` — report submission, user report retrieval, report details, and report list retrieval
- `admin.controller.js` — admin stats, user management, report status changes, assignments, and resolution with completion photo
- `analytic.controller.js` — dashboard summary retrieval and manual analytics generation
- `notice.controller.js` — notice creation, update, delete, and retrieval
- `notification.controller.js` — user notification retrieval and read state updates
- `reportAssignment.controller.js` — retrieve assignment by report and update assignment status
- `reportHistory.controller.js` — fetch report history
- `department.controller.js` — create and list departments
- `superAdmin.controller.js` — super admin role update

### Routes

- `user.routes.js` — public auth and user management endpoints
- `report.router.js` — protected report submission and retrieval endpoints
- `admin.router.js` — admin management and report operation endpoints
- `analytic.router.js` — analytics dashboard endpoints
- `notice.router.js` — public notice listing and protected notice management
- `notification.router.js` — protected user notification endpoints
- `reportAssignment.router.js` — protected assignment endpoints
- `reportHistory.router.js` — protected report history endpoint
- `department.router.js` — department creation and listing endpoints
- `superAdmin.router.js` — super admin user role endpoint

### Models

- `User` — authentication and authorization state
- `Report` — user reports, media URLs, status, priority, and location
- `Category` — report category definitions
- `Department` — department records linked to admin users
- `Notice` — announcements with archive flag
- `Notification` — user messages and unread/read state
- `ReportAssignment` — report assignment details
- `ReportHistory` — audit log of status changes
- `Analytic` — summary metrics for reporting

### Middlewares

- `auth.middleware.js` — JWT verification and user attachment
- `admin.middleware.js` — admin route guard for department_admin and super_admin
- `superAdmin.middleware.js` — super admin guard
- `departmentAdmin.middleware.js` — department-admin-specific report access
- `upload.middleware.js` — Multer file upload handling and validation
- `error.middleware.js` — centralized error response formatting

### Utilities

- `cloudinary.js` — uploads local files to Cloudinary and removes temporary files
- `sendEmail.js` — sends email via Resend SDK
- `analytics.service.js` — aggregates report statistics and persists analytics records
- `notification.service.js` — scheduled reminders for old pending reports
- `asyncHandler.js` — wraps async route handlers
- `ApiError.js` / `ApiResponse.js` — structured error and response objects

## Frontend Structure

### Pages

- `frontend/login/` — login and forgot password
- `frontend/index.html` — landing or home page
- `frontend/reset-password.html` — password reset page
- `frontend/dashboard/admin/` — admin dashboard and modules
- `frontend/dashboard/department-admin/` — department admin dashboard and modules
- `frontend/dashboard/user/` — user dashboard, report creation, notifications, and settings

### Shared JS

- `frontend/js/api-client.js` — API client wrapper for authenticated backend calls
- `frontend/js/auth-check.js` — authentication guard for protected pages
- `frontend/js/auth.js` — legacy auth functions (login/register)

### Dashboard Modules

- `complaints/` — report list and action handling
- `analytics/` — analytics display and report generation
- `categories/` — category management UI
- `departments/` — department listing and creation
- `notices/` — notices display and admin notice management
- `notifications/` — user notification view
- `settings/` — profile and password update UI
- `my-reports/` — citizen report history and details
- `new-complaint/` — report submission form
- `pump-status/`, `water-quality/` — additional dashboard pages for user context

## Database Design

### User

Purpose: store authentication, authorization, and profile data.
Relationships:
- referenced by reports, notifications, assignments, departments, notices, history.
Important fields:
- `userId` — UUID
- `username`, `name`, `email`, `passwordHash`
- `role` — `citizen`, `department_admin`, `super_admin`
- `refreshToken` — current refresh JWT
- `passwordResetToken`, `passwordResetExpires`

### Report

Purpose: record citizen issue submissions.
Relationships:
- `userId` -> User
- `categoryId` -> Category
Important fields:
- `reportId` — UUID
- `photo_url`, `voice_recording_url`, `completion_photo_url`
- `location_lat`, `location_lng`
- `status` — `pending`, `in_progress`, `resolved`, `rejected`
- `priority` — `low`, `medium`, `high`

### Category

Purpose: define report categories.
Important fields:
- `categoryId` — UUID
- `name`, `description`

### Department

Purpose: group admin users and assign reports.
Relationships:
- `userId` -> User
Important fields:
- `departmentId`, `name`, `description`, `contactInfo`

### Notice

Purpose: announcements for users and admins.
Relationships:
- `postedBy` -> User
Important fields:
- `noticeId`, `title`, `content`, `isArchived`

### Notification

Purpose: store user-facing alerts.
Relationships:
- `userId` -> User
- `reportId` -> Report
Important fields:
- `notificationId`, `message`, `status` (`unread`/`read`)

### ReportAssignment

Purpose: track work assignments.
Relationships:
- `reportId` -> Report
- `departmentId` -> Department
- `assigned_to_userId` -> User
Important fields:
- `assignmentId`, `status` (`assigned`, `in_progress`, `completed`), `remarks`

### ReportHistory

Purpose: preserve an audit trail of report status changes.
Relationships:
- `reportId` -> Report
- `changedByUserId` -> User
Important fields:
- `historyId`, `previousStatus`, `newStatus`, `changedAt`

### Analytic

Purpose: store generated system metrics.
Relationships:
- `categoryId` -> Category (optional)
Important fields:
- `analyticsId`, `reportCount`, `resolvedCount`, `avgResolutionTime`, `generatedAt`

## API Overview

### Authentication & User

Handles registration, login, logout, token refresh, current user retrieval, password change, forgot password, and password reset.

### Report Management

Handles report submission, fetching a users reports, listing all reports, and retrieving individual report details.

### Admin Operations

Handles dashboard stats, user management, role updates, user deletion, report status updates, report assignment, and issue resolution with completion photo uploads.

### Analytics

Handles fetching the latest analytics summary and manually triggering analytics generation.

### Notifications

Handles user notification retrieval and marking notifications as read.

### Notices

Handles public notice retrieval and protected notice creation, updates, deletion, and admin listing.

### Departments

Handles department creation and public department listing.

### Report History and Assignments

Handles fetching report history and assignment details by report, and updating assignment status.

## Engineering Decisions

- JWT + refresh tokens support stateless access while enabling session renewal.
- Role-based middleware keeps authorization centralized and reusable.
- Multer disk storage with field validation ensures upload type control before Cloudinary storage.
- Cloudinary is used for media hosting and removes temporary local files after upload.
- Report history is captured for every status transition and resolution.
- Notification entries are persisted so UI can show per-user alerts.
- Hourly cron job provides automated reminders without requiring external scheduling infrastructure.
- Resend SDK is used for sending transactional emails, including password reset and pending report reminders.
- The backend uses ES modules for modern Node.js structure.

## Security Considerations

- Access tokens are validated with `ACCESS_TOKEN_SECRET`.
- Refresh tokens are stored and compared against the value in the user document.
- Passwords are hashed with bcrypt and never returned in responses.
- Password reset tokens are hashed before storage and expire after 10 minutes.
- File uploads are restricted by field name, content type, file count, and size.
- Protected routes require authentication, and admin routes enforce role checks.

## Background Jobs

- `backend/src/index.js` schedules an hourly cron job (`0 * * * *`) to run `sendPendingReportNotifications()`.
- The job checks for reports that have remained pending for more than 48 hours and sends reminders to assigned officials.

## Notification Flow

- Notifications are created when report status changes, assignments occur, or pending report reminders are triggered.
- `notification.controller.js` fetches notifications for the authenticated user and enriches them with report details.
- Users can mark notifications as read through the provided endpoint.

## Analytics Flow

- `analytics.service.js` computes report count, resolved count, and average resolution time from report documents.
- Analytics records are persisted in the `Analytic` collection.
- Analytics generation is triggered after report creation and status updates, and can also be run manually.

## File Upload Flow

- `upload.middleware.js` saves incoming files to `./public/temp`.
- `cloudinary.js` uploads files from disk to Cloudinary and deletes the local temporary copy.
- Supported upload fields include `photo`, `voiceRecording`, and `completionPhoto`.
- The upload middleware enforces a 10MB per-file limit and limits the number of files.

## Folder Structure

- `backend/` — server application and API implementation
  - `src/app.js` — Express application setup and route mounting
  - `src/index.js` — server startup, DB connection, cron scheduling
  - `src/routes/` — route definitions
  - `src/controllers/` — controller logic
  - `src/models/` — Mongoose schemas
  - `src/middlewares/` — auth, RBAC, uploads, error handling
  - `src/utils/` — Cloudinary, email, analytics, notifications
  - `src/db/` — MongoDB connection helper
- `frontend/` — static UI pages and dashboard modules
  - `frontend/js/api-client.js` — shared API client
  - `frontend/login/` — auth-related pages
  - `frontend/dashboard/` — admin and user dashboards

## Environment Variables

- `MONGODB_URI` — MongoDB connection URI
- `DB_NAME` — database name set in `backend/src/constant.js`
- `ACCESS_TOKEN_SECRET` — JWT access token secret
- `REFRESH_TOKEN_SECRET` — JWT refresh token secret
- `ACCESS_TOKEN_EXPIRY` — access token expiry interval
- `REFRESH_TOKEN_EXPIRY` — refresh token expiry interval
- `CLOUDINARY_CLOUD_NAME` — Cloudinary config
- `CLOUDINARY_API_KEY` — Cloudinary config
- `CLOUDINARY_API_SECRET` — Cloudinary config
- `RESEND_API_KEY` — Resend email service API key
- `EMAIL_FROM` — email sender address
- `PORT` — backend server port
- `CORS_ORIGIN` — allowed frontend origin for CORS

## Local Development

1. Install backend dependencies in `backend/`:
   - `npm install`
2. Create a `.env` file with MongoDB, JWT, Cloudinary, Resend, and CORS settings.
3. Run the backend server:
   - `npm run dev`
4. Open frontend pages directly in a browser or serve them from a local static server.
