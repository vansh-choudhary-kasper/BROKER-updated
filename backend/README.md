# Broker Management System

A comprehensive broker management system for handling tasks, companies, and financial transactions.

## Features

- **Authentication**: Secure user authentication with JWT tokens
- **Company Management**: Create, update, and manage company profiles
- **Task Management**: Create, assign, and track tasks
- **Bank Management**: Manage bank accounts and transactions
- **Expense Management**: Track and manage expenses with receipt uploads
- **Document Management**: Upload and manage documents for companies, tasks, and expenses
- **Email Notifications**: Automated email notifications for important events
- **Backup System**: Automated database backups

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **File Upload**: Multer
- **Email**: Nodemailer
- **Logging**: Winston
- **Validation**: Express Validator
- **Security**: Helmet, XSS Clean, HPP

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/broker-management-system.git
   cd broker-management-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/broker-management
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   JWT_COOKIE_NAME=auth_token
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   FILE_UPLOAD_MAX_SIZE=5242880
   FILE_UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf
   FILE_UPLOAD_DIR=uploads
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-email-password
   SMTP_FROM=noreply@brokermanagement.com
   FRONTEND_URL=http://localhost:3000
   ```

4. Create required directories:
   ```
   mkdir -p uploads logs
   ```

## Running the Application

### Development Mode

```
npm run dev
```

### Production Mode

```
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Companies

- `POST /api/companies` - Create a new company
- `GET 

` - Get all companies
- `GET /api/companies/:id` - Get a specific company
- `PUT /api/companies/:id` - Update a company
- `DELETE /api/companies/:id` - Delete a company
- `POST /api/companies/:id/documents` - Add documents to a company
- `DELETE /api/companies/:id/documents/:documentId` - Delete a document from a company

### Tasks

- `POST /api/tasks` - Create a new task
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PATCH /api/tasks/:id/status` - Update task status
- `POST /api/tasks/:id/comments` - Add a comment to a task
- `DELETE /api/tasks/:id/comments/:commentId` - Delete a comment from a task
- `POST /api/tasks/:id/attachments` - Add attachments to a task
- `DELETE /api/tasks/:id/attachments/:attachmentId` - Delete an attachment from a task

### Banks

- `POST /api/banks` - Create a new bank
- `GET /api/banks` - Get all banks
- `GET /api/banks/:id` - Get a specific bank
- `PUT /api/banks/:id` - Update a bank
- `DELETE /api/banks/:id` - Delete a bank
- `POST /api/banks/:id/documents` - Add documents to a bank
- `DELETE /api/banks/:id/documents/:documentId` - Delete a document from a bank

### Expenses

- `POST /api/expenses` - Create a new expense
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/:id` - Get a specific expense
- `PUT /api/expenses/:id` - Update an expense
- `DELETE /api/expenses/:id` - Delete an expense
- `POST /api/expenses/:id/receipts` - Add receipts to an expense
- `DELETE /api/expenses/:id/receipts/:receiptId` - Delete a receipt from an expense

## License

This project is licensed under the MIT License - see the LICENSE file for details. 