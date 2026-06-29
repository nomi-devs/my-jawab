# Jawab Backend

A modular NestJS backend application with authentication and user management.

## Features

- 🔐 **Authentication Module**: Complete authentication system with multiple auth types
  - Email/Phone authentication with verification
  - Google/Apple OAuth support
  - JWT-based token management
  - Password reset functionality
- 📱 **Device Management**: Track and manage user devices
- 🗄️ **Database**: MySQL database with TypeORM
- 🏗️ **Modular Architecture**: Organized module structure for scalability

## Project Structure

```
jawab-backend/
├── src/
│   ├── database/              # Database related files
│   │   ├── config/            # Database configuration
│   │   └── entities/          # TypeORM entities
│   ├── modules/               # Application modules
│   │   └── auth/              # Authentication module
│   │       ├── dto/           # Data Transfer Objects
│   │       ├── guards/        # Authentication guards
│   │       ├── decorators/    # Custom decorators
│   │       ├── device/        # Device management
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       └── auth.module.ts
│   ├── app.module.ts
│   └── main.ts
├── database/                  # SQL schema files
└── package.json
```

## Prerequisites

- Node.js (v18 or higher)
- MySQL database (phpMyAdmin)
- npm or yarn

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create a MySQL database named `jawab_auth` in phpMyAdmin
2. Import the SQL schema from `../database/jawab_auth.sql`

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=jawab_auth
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=1h

# Server Configuration
PORT=3000
```

**Important:** 
- If your MySQL root user has a password, update `DB_PASSWORD`
- Change `JWT_SECRET` to a strong random string (use: `openssl rand -base64 32`)

## Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will start on `http://localhost:3000`

## API Endpoints

All endpoints are prefixed with `/api/`

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify account
- `POST /api/auth/resend-verification` - Resend verification code
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/profile` - Get user profile (protected)

### Device Management

- `POST /api/devices` - Register device (protected)
- `GET /api/devices` - Get user devices (protected)
- `PUT /api/devices/:deviceId` - Update device (protected)
- `DELETE /api/devices/:deviceId` - Deactivate device (protected)

## Example Usage

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "auth_type": "email"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john@example.com",
    "password": "password123",
    "auth_type": "email"
  }'
```

### Get Profile (Protected)

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <access_token>"
```

## Development

### Adding New Modules

1. Create a new folder in `src/modules/`
2. Create module, service, and controller files
3. Import the module in `app.module.ts`

### Database Migrations

The application uses TypeORM. For production, consider:
- Setting `DB_SYNCHRONIZE=false`
- Using TypeORM migrations for schema changes

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database `jawab_auth` exists
- Verify the SQL schema has been imported

### Port Already in Use
- Change `PORT` in `.env` to a different port
- Or stop the process using port 3000

### Module Not Found Errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

## Documentation

- **[Application Guide](./APPLICATION_GUIDE.md)** - Complete application guide with architecture, setup, and best practices
- **[Auth Module API](./API_AUTH_MODULE.md)** - Complete API documentation for authentication module

## License

UNLICENSED
