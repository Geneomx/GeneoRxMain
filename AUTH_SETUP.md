# GeneoRx Authentication Setup

## Overview
GeneoRx now has a complete authentication system with user registration, login, and session management integrated with MySQL.

## Database Configuration

### Environment Variables (.env)
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=geneorx
DB_USERNAME=root
DB_PASSWORD=
SESSION_DRIVER=database
```

The database is configured to use MySQL running on localhost with the `geneorx` database.

## Features Implemented

### 1. **User Registration**
- **Route**: `GET/POST /register`
- **View**: `resources/views/auth/register.blade.php`
- Users can create new accounts with:
  - Full Name
  - Email Address
  - Password (min 6 characters)
  - Password Confirmation
- Form validation prevents duplicate emails
- Passwords are securely hashed using Bcrypt

### 2. **User Login**
- **Route**: `GET/POST /login`
- **View**: `resources/views/auth/login.blade.php`
- Users can sign in with email and password
- Session-based authentication
- Failed login attempts show error messages

### 3. **User Logout**
- **Route**: `POST /logout`
- **Controller**: `AuthController@logout`
- Securely destroys user session
- Redirects to login page

### 4. **Protected Routes**
- Home page (/) requires authentication
- Redirects unauthenticated users to login
- List of protected routes in `routes/web.php`:
  ```
  GET  /                        → Home page
  POST /home/restore            → Restore user data
  ```

### 5. **Header Navigation**
- **When logged in:**
  - Shows user's name
  - Logout button
- **When logged out:**
  - Sign In link
  - Sign Up link

## Database Tables

### Users Table
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255),
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id BIGINT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  payload LONGTEXT,
  last_activity INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## File Structure

```
app/Http/Controllers/
├── AuthController.php          ← Authentication logic
├── HomeController.php          ← Home page (requires auth)
└── ...

resources/views/
├── auth/
│   ├── login.blade.php        ← Login form
│   └── register.blade.php     ← Registration form
├── layouts/
│   └── app.blade.php          ← Header with auth info
├── home.blade.php
└── welcome.blade.php

routes/
└── web.php                    ← Auth routes defined
```

## Usage

### For Users

#### 1. **Register a New Account**
1. Visit `http://localhost/register`
2. Fill in name, email, password
3. Click "Create Account"
4. Automatically logged in
5. Redirected to home page

#### 2. **Login to Existing Account**
1. Visit `http://localhost/login`
2. Enter email and password
3. Click "Sign In"
4. Redirected to home page

#### 3. **Logout**
1. Click "Logout" button in header
2. Session destroyed
3. Redirected to login page

### For Developers

#### Check if User is Authenticated
```php
if (Auth::check()) {
    echo "User is logged in";
}
```

#### Get Current User
```php
$user = Auth::user();
echo $user->name;
echo $user->email;
```

#### Protect a Route
```php
Route::middleware('auth')->group(function () {
    Route::get('/protected', function () {
        // Only logged-in users can access
    });
});
```

#### Add Authentication Check in Blade
```blade
@if (Auth::check())
    Welcome, {{ Auth::user()->name }}
@else
    Please log in
@endif
```

## Security Features

1. **Password Hashing**: Bcrypt with configurable rounds (12 by default)
2. **CSRF Protection**: All forms have CSRF tokens
3. **Session Management**: Database-backed sessions
4. **Email Validation**: Unique email requirement
5. **SQL Injection Prevention**: Laravel's query builder with parameter binding
6. **Cross-Site Scripting (XSS)**: Blade templating escapes HTML

## Configuration Files

### config/auth.php
- Defines authentication guards
- Password reset configuration
- Session/token setup

### config/session.php
- Session driver: database
- Session lifetime: 120 minutes (default)
- Secure cookies configuration

## Testing Login

1. Start XAMPP (MySQL must be running)
2. Navigate to `http://localhost/geneorx/` or `http://localhost`
3. Click "Sign Up" to create an account
4. Fill in test data (e.g., name: "John Doe", email: "john@example.com")
5. Click "Create Account"
6. You should be logged in and see the home page
7. Click "Logout" to test logout functionality
8. Click "Sign In" and use your credentials to log back in

## Troubleshooting

### "SQLSTATE[HY000]: General error: 1030 Got error 128 from storage engine"
- Check if MySQL service is running
- Restart MySQL service via XAMPP Control Panel

### "Column not found" errors
- Run `php artisan migrate` to create missing tables
- Check your .env file has correct database name

### "419 Page Expired"
- Clear browser cookies
- Session token may have expired
- Refresh the page and try again

### "Class 'Auth' not found"
- Make sure `use Illuminate\Support\Facades\Auth;` is imported
- Check your Laravel version compatibility

## Next Steps

1. **Email Verification**: Add email verification on registration
2. **Password Reset**: Implement forgot password functionality
3. **Two-Factor Authentication**: Add 2FA for enhanced security
4. **User Profiles**: Extend user model with profile data
5. **Role-Based Access Control**: Add user roles and permissions

## Support

For Laravel authentication documentation, visit: https://laravel.com/docs/11.x/authentication
