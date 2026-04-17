# DocQuery Server

The backend service for the DocQuery application, providing API endpoints for document management, user authentication, application review, and analytics.

## Features

- **Authentication & Authorization**: Secure user authentication with JWT and role-based access control (Admin, PCAD, User).
- **Application Management**: Endpoints for submitting, reviewing (Approve/Reject/Revise), and managing applications.
- **Media Management**: Cloudinary integration for handling file uploads, including signature uploads with automatic background removal using `remove.bg`.
- **Analytics Dashboard**: Real-time aggregation of application statistics and trends.
- **Contract Tracking**: Endpoints for querying and filtering NCCC contracts.
- **Export Capabilities**: Generate and export application data to Excel or Zip archives.
- **Email Notifications**: Automated email notifications for status updates and new submissions using Resend.

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- Cloudinary (Media storage)
- remove.bg API (Image processing)
- Resend (Email service)

## Prerequisites

- Node.js (v18 or higher)
- MongoDB instance
- Cloudinary account
- remove.bg API key
- Resend API key

## Setup & Installation

1. Clone the repository and navigate to the server directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` (or configure the environment variables as required). Ensure you include:
   - `PORT`
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `REMOVE_BG_API_KEY`
   - Email service credentials

4. Start the development server:
   ```bash
   npm run dev
   ```

## Key Endpoints

- **Auth**: `/api/v1/auth/*`
- **Users**: `/api/v1/users/*` (Profile, Signatures)
- **Applications**: `/api/v1/applications/*` (Submission, Analytics, Review)
- **Admin**: `/api/v1/admin/*` (User Management, Global Archive)
- **Media**: `/api/v1/media/*` (File Uploads, Downloads)

## Recent Updates

- Added `GET /api/v1/applications/analytics` for optimized dashboard statistics.
- Integrated `remove.bg` for processing uploaded user signatures.
- Implemented the Application Review Queue with robust Approve/Reject/Revise workflows.
