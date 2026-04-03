# Finance Backend API

Node.js + Express + MongoDB backend for user management, financial records, and dashboard summaries.

## Overview

This repository contains a backend API only. It provides:

- JWT-based authentication
- refresh token persistence in the user document
- role-based authorization for `admin`, `analyst`, and `viewer`
- user management endpoints
- financial record management with validation, pagination, sorting, and filtering
- dashboard aggregation endpoints with optional date range filtering
- centralized validation and error handling

The codebase is structured so routes stay thin, controllers handle HTTP flow, services hold aggregation logic, and models define data constraints.

## API Documentation

Postman collection documentation:

- [Finance Backend API Documentation](https://documenter.getpostman.com/view/41552921/2sBXionANb)

## Architecture

The application follows a layered structure:

- routes define endpoint paths and middleware order
- controllers handle request parsing, authorization checks, and HTTP responses
- services hold aggregation logic for dashboard data
- models define MongoDB schemas, indexes, and document behavior
- validators define request and query validation rules
- middlewares handle auth, roles, validation, and global errors
- utils contain shared wrappers for consistent responses and errors

This separation supports maintainability and makes business rules easier to trace.

## Core Features

### Authentication and User Management

- register user
- login user
- logout user
- refresh access token
- get current user
- update account details
- list all users for admins
- get a single user by ID for admins
- update user role for admins
- update user status for admins
- delete users by setting status to `inactive`

### Financial Records

- create financial records
- list financial records with pagination, filtering, and sorting
- fetch a single financial record by ID
- update financial records
- delete financial records by marking them deleted
- admin can create records for any user
- analysts can read their own records
- admins can read all records

### Dashboard Analytics

- total income
- total expenses
- net balance
- category-wise totals
- recent transactions
- monthly trends
- optimized dashboard summary aggregation
- optional date range filtering for dashboard data

### Reliability and Validation

- request validation for registration, login, and financial record mutation endpoints
- query parameter validation for record listing
- global error handling for Mongoose, JWT, duplicate key, and malformed JSON errors

## Roles and Access Control

### Viewer

- can access dashboard summary
- cannot create, update, or delete financial records
- cannot access admin-only user routes
- cannot list financial records

### Analyst

- can access dashboard summary
- can list financial records
- can only fetch their own record by ID
- cannot create, update, or delete financial records
- cannot access admin-only user routes

### Admin

- full access to user management
- full access to financial record management
- can create financial records for any user
- can read all records
- can access dashboard summary

## Data Modeling

### User model

Defined in [src/models/user.model.js](src/models/user.model.js).

Fields:

- `name`
- `email`
- `password`
- `role`
- `refreshToken`
- `status`

Behavior:

- passwords are hashed before save
- password field is excluded by default from queries
- JWT access and refresh tokens are generated from model methods

### Financial record model

Defined in [src/models/financialRecord.model.js](src/models/financialRecord.model.js).

Fields:

- `userId`
- `amount`
- `type`
- `category`
- `date`
- `notes`
- `isDeleted`

Behavior:

- `userId` references `User`
- `amount` must be positive
- `type` must be `income` or `expense`
- `category` is normalized to lowercase
- `date` cannot be in the future
- deletion is handled through the `isDeleted` flag

Indexes:

- `userId + category`
- `userId + date`
- `userId + type`

## API Reference

Base path:

- `/api/v1`

### Users

#### Public

- `POST /api/v1/users/register`
- `POST /api/v1/users/login`

#### Authenticated

- `POST /api/v1/users/logout`
- `POST /api/v1/users/refresh-token`
- `POST /api/v1/users/change-password`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/update-account`

#### Admin only

- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id/role`
- `PATCH /api/v1/users/:id/status`
- `DELETE /api/v1/users/:id`

### Financial Records

#### Create record

- `POST /api/v1/financial-records`

Admin only.

Request body:

- `userId`
- `amount`
- `type`
- `category`
- `date` optional
- `notes` optional

#### List records

- `GET /api/v1/financial-records`

Allowed for admin and analyst.

Query parameters:

- `page`
- `limit`
- `type`
- `category`
- `minAmount`
- `maxAmount`
- `startDate`
- `endDate`
- `sortBy`
- `order`

Pagination response metadata:

- `totalRecords`
- `totalPages`
- `currentPage`
- `limit`

#### Get one record

- `GET /api/v1/financial-records/:id`

Rules:

- admin can access any record
- non-admin users can only access records owned by their own `userId`

#### Update record

- `PATCH /api/v1/financial-records/:id`

Admin only.

#### Delete record

- `DELETE /api/v1/financial-records/:id`

Admin only. The record is marked deleted through `isDeleted`.

### Dashboard

- `GET /api/v1/dashboard/summary`

Accessible to admin, analyst, and viewer.

Optional query parameters:

- `startDate`
- `endDate`

Returned fields:

- `totalIncome`
- `totalExpenses`
- `netBalance`
- `categoryTotals`
- `recentTransactions`
- `monthlyTrends`

## Validation Rules

Validation is implemented using express-validator and the shared `validateRequest` middleware.

### User registration

- `name` required, 2 to 50 characters
- `email` required and valid
- `password` required and minimum 6 characters

### Login

- `email` required and valid
- `password` required

### Financial record create

- `userId` required and valid MongoDB ObjectId
- `amount` required and positive number
- `type` required and must be `income` or `expense`
- `category` required and 2 to 50 characters
- `date` valid if provided
- `notes` maximum 500 characters if provided

### Financial record update

- at least one updatable field is required
- `amount` positive if provided
- `type` must be `income` or `expense` if provided
- `category` 2 to 50 characters if provided
- `date` valid if provided
- `notes` maximum 500 characters if provided

### Financial record list query

- `page` positive integer
- `limit` positive integer
- `sortBy` one of `date`, `amount`, `category`
- `order` one of `asc`, `desc`
- `type` one of `income`, `expense`
- `minAmount` number if provided
- `maxAmount` number if provided
- `startDate` valid date if provided
- `endDate` valid date if provided

## Error Handling

The app uses a global error middleware that normalizes:

- custom `ApiError`
- Mongoose validation errors
- Mongoose cast errors
- JWT token errors
- duplicate key errors
- malformed JSON payloads
- unexpected errors

Success responses use the shared `ApiResponse` wrapper.

## Environment Variables

Create a `.env` file in the project root.

Required values used by the application:

```env
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d
NODE_ENV=development
```

Important:

- the database name is set in [src/constants.js](src/constants.js) as `financeDB`
- the connection string is built from `MONGODB_URI` plus that database name

## Local Setup

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

The app starts from [src/index.js](src/index.js), loads environment variables, connects to MongoDB, and then starts listening on the configured port.

## Implementation Notes

- cookies are configured as HTTP-only
- refresh tokens are persisted in the user document
- financial record deletion is soft delete through `isDeleted`
- user deletion is implemented by setting user status to `inactive`
- dashboard summary is computed with aggregation and can use optional date filters
- record listing supports pagination, filtering, and sorting
- single-record access respects role-based ownership rules

## Repository Structure

```text
src/
	app.js
	constants.js
	index.js
	controllers/
		dashboard.controller.js
		financialRecord.controller.js
		user.controller.js
	db/
		index.js
	middlewares/
		auth.middleware.js
		error.middleware.js
		role.middleware.js
		validateRequest.js
	models/
		financialRecord.model.js
		user.model.js
	routes/
		dashboard.routes.js
		financialRecord.routes.js
		user.routes.js
	services/
		dashboard.service.js
	utils/
		ApiError.js
		ApiResponse.js
		asyncHandler.js
	validators/
		financialRecord.validators.js
		user.validators.js
```

## License

ISC
