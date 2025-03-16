# Modern Authentication System

A comprehensive authentication and user management system built with Next.js, MongoDB, and modern security practices. This application provides a complete solution for user authentication and account management.

## Features

### Authentication Methods
- **Email & Password**: Traditional authentication with email verification
- **Magic Link**: Passwordless authentication via email
- **GitHub OAuth**: Single sign-on with GitHub accounts
- **Session Management**: Secure JWT-based session handling with HTTP-only cookies

### User Management
- **User Registration**: Create accounts with email verification
- **Email Verification**: Verify email addresses to activate accounts
- **Password Management**: Secure password hashing and reset functionality
- **Profile Management**: Update user profile information

### Security Features
- **HTTP-only Cookies**: Prevent client-side JavaScript access to authentication tokens
- **CSRF Protection**: Protection against cross-site request forgery
- **Password Validation**: Strong password requirements with zod schema validation
- **Secure Routes**: Protected routes with middleware authentication checks

## Architecture

The system is built using:
- **Next.js 14**: Full-stack React framework with App Router
- **MongoDB**: NoSQL database for user data storage
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Zod**: TypeScript-first schema validation
- **JWT (jose)**: JSON Web Tokens for secure authentication
- **Nodemailer**: Email delivery for verification and password reset

## API Endpoints

The system provides the following API endpoints:

- `/api/auth/register`: Create a new user account
- `/api/auth/signin`: Authenticate with email and password
- `/api/auth/signout`: End the current session
- `/api/auth/verify`: Verify email address
- `/api/auth/magic-link`: Request magic link login
- `/api/auth/forgot-password`: Request password reset
- `/api/auth/reset-password`: Set a new password with a valid token
- `/api/auth/change-password`: Update password for authenticated users
- `/api/auth/github`: GitHub OAuth authentication flow