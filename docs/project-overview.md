# FaceFusion Project Overview

FaceFusion is a Next.js web application that provides AI-powered face swapping functionality. The application allows users to select or upload source face images and target templates (videos, images, GIFs), then generate face-swapped media by applying the source face to the target template.

## Key Components

### 1. Architecture

- **Framework**: Next.js 15 with React 19
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth and Microsoft Azure AD
- **Payment Processing**: Integration with Stripe
- **Face Swap Processing**: External API integration (Modal.run service)

### 2. Main Features

- **Face Source Management**: Upload and manage source face images
- **Template Selection**: Choose from various target templates (videos, images, GIFs)
- **Face Swap Generation**: Process face swaps with real-time progress tracking
- **Media Management**: View, download, and delete generated media
- **Payment Processing**: Purchase generated content to access unwatermarked versions

### 3. Database Models

As defined in the Prisma schema:

- **User**: Authentication and profile information
- **FaceSource**: User-uploaded face images
- **TargetTemplate**: Available templates for face swapping
- **GeneratedMedia**: Results of face swap operations
- **Payment**: Records of user purchases
- **Guideline**: Rules and guidelines for face swap usage

### 4. Workflow

1. User authenticates using NextAuth providers
2. User selects or uploads a source face image
3. User selects a target template (video, image, GIF)
4. User initiates face swap generation
5. System processes the face swap and displays progress
6. User views the result with options to purchase (if desired)
7. After payment, user can download unwatermarked content

### 5. MCP (Model Context Protocol) Integration

The project includes MCP configuration in `.vscode/mcp.json` with three servers:

- **context7**: Uses `@upstash/context7-mcp` package
- **postgres**: Local PostgreSQL connection for the facefusion database

This integration leverages the Model Context Protocol for AI model interactions, specifically for the face swapping functionality.

## Technical Implementation Highlights

1. **File Storage**: Media files are organized into directories for sources, templates, and outputs
2. **Watermarking**: Generated content is watermarked until purchased
3. **Video Processing**: Includes optimization, thumbnail generation, and watermarking
4. **Database Relationships**: Well-defined relationships between models using Prisma
5. **UI/UX**: Modern interface with real-time feedback and progress indicators

## API Endpoints

The application provides several API endpoints for various functionalities:

- **/api/face-sources**: Manage source face images
- **/api/templates**: Manage target templates
- **/api/face-fusion**: Process face swap operations
- **/api/generated-media**: Retrieve and manage generated media
- **/api/payment**: Handle payment processing

## Future Improvements

Based on the todo.md file, planned improvements include:

1. **Performance Optimizations**: Caching, media loading, and server-side rendering
2. **Security Enhancements**: Better authentication, rate limiting, and input validation
3. **User Experience Improvements**: Dark mode, notifications, and accessibility
4. **Feature Enhancements**: Batch processing, preview functionality, and better face detection
5. **Architecture Improvements**: TypeScript migration and modularization

## Implementation Details

- Video watermarking is enabled by default with configurable text, position, and opacity
- Media processing includes multiple stages: creation, processing, optimization, and watermarking
- Comprehensive error handling with specific error types for better user feedback
- Progress tracking during face swap generation provides real-time updates to users
