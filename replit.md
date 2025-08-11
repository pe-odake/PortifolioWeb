# Portfolio Digital Web System

## Overview

This is a comprehensive digital portfolio web application built with Flask, designed to showcase projects, achievements, and professional work. The system provides both public viewing capabilities for visitors and administrative tools for content management. Key features include project management with media uploads, user authentication with comment and like functionality, responsive design with dark/light theme support, and social media integration for sharing projects.

The application follows a traditional Flask web application architecture with template-based rendering, SQLAlchemy ORM for database operations, and Flask-Login for authentication management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Template Engine**: Jinja2 templates with a component-based approach
- **CSS Framework**: Bootstrap 5 with custom CSS variables for theming
- **JavaScript**: Vanilla JavaScript for interactive features (theme switching, like buttons, gallery, animations)
- **Responsive Design**: Mobile-first approach with Bootstrap grid system
- **Theme System**: Dark/light mode toggle with localStorage persistence

### Backend Architecture
- **Web Framework**: Flask with Blueprint organization
- **Database ORM**: SQLAlchemy with declarative base model
- **Authentication**: Flask-Login with session management
- **Form Handling**: Flask-WTF with CSRF protection
- **File Upload**: Werkzeug secure filename handling with PIL image processing
- **Email System**: Flask-Mail for password reset and notifications

### Database Design
- **Users**: Authentication and profile management with admin roles
- **Projects**: Core content model with CRUD operations
- **Categories/Tags**: Content organization and filtering
- **Comments/Likes**: User engagement tracking
- **Media**: File upload management for projects
- **Site Settings**: Configurable site-wide settings

### Security Features
- **CSRF Protection**: Flask-WTF CSRF tokens on all forms
- **Password Security**: Werkzeug password hashing
- **File Upload Security**: Secure filename handling and file type validation
- **Session Management**: Flask-Login secure session handling

## External Dependencies

### Core Framework Dependencies
- **Flask**: Web application framework
- **SQLAlchemy**: Database ORM and connection pooling
- **Flask-Login**: User session management
- **Flask-WTF**: Form handling and CSRF protection
- **Flask-Mail**: Email functionality for password resets

### Frontend Dependencies
- **Bootstrap 5**: CSS framework with dark theme support
- **Font Awesome**: Icon library for UI elements
- **Pillow (PIL)**: Image processing for uploads and thumbnails

### Database
- **SQLite**: Default development database (configurable via DATABASE_URL)
- **Connection Pooling**: SQLAlchemy engine options for production readiness

### Email Service
- **SMTP Configuration**: Gmail SMTP by default (configurable)
- **Environment Variables**: MAIL_USERNAME, MAIL_PASSWORD for credentials

### File Storage
- **Local Storage**: Static file serving for uploads
- **Image Processing**: Automatic thumbnail generation and resizing

### Social Media Integration
- **Open Graph**: Meta tags for rich social media previews
- **Twitter Cards**: Enhanced Twitter sharing experience
- **LinkedIn Sharing**: Direct project sharing capabilities