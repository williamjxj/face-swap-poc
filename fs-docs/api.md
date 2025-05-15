# Face Swap POC API Documentation

This document outlines all the API endpoints available in the Face Swap POC application.

## Templates

| From File | API Name | Methods | Parameters | Notes |
|-----------|----------|---------|------------|-------|
| templates/route.js | /api/templates | GET | - | Returns all active templates ordered by creation date |
| templates/route.js | /api/templates | POST | `{ name, type, filePath, thumbnailPath, fileSize, duration, mimeType, authorId }` | Creates new template |
| upload-template/route.js | /api/upload-template | POST | FormData: `{ file, name, type }` | Uploads new template video/image. Size limits: video(150MB), image(10MB), GIF(50MB) |
| delete-template/route.js | /api/delete-template | DELETE | `id` (query param) | Deletes template and its associated files |

## Face Sources

| From File | API Name | Methods | Parameters | Notes |
|-----------|----------|---------|------------|-------|
| face-sources/route.js | /api/face-sources | GET | - | Returns all face sources |
| face-sources/route.js | /api/face-sources | POST | `{ imageUrl, authorId }` | Creates new face source |
| face-sources/route.js | /api/face-sources | DELETE | `{ filename }` | Deletes a face source |
| upload-source/route.js | /api/upload-source | POST | FormData: `{ file }` | Uploads new source image |

## Face Fusion

| From File | API Name | Methods | Parameters | Notes |
|-----------|----------|---------|------------|-------|
| face-fusion/route.js | /api/face-fusion | POST | `{ source, target }` | Performs face swap operation |

## Generated Media

| From File | API Name | Methods | Parameters | Notes |
|-----------|----------|---------|------------|-------|
| generated-media/route.js | /api/generated-media | GET | - | Lists all generated media |
| generated-media/route.js | /api/generated-media | DELETE | `filename` (query param) | Deletes generated media |
| download-media/route.js | /api/download-media | GET | `filename` (query param) | Download generated media file |
| delete-output/route.js | /api/delete-output | DELETE | `filename` (query param) | Deletes generated output file |

## Authentication & User

| From File | API Name | Methods | Parameters | Notes |
|-----------|----------|---------|------------|-------|
| auth/[...nextauth]/route.js | /api/auth/[...nextauth] | GET, POST | - | NextAuth.js authentication endpoints |
| profile/route.js | /api/profile | GET | - | Get user profile |
| logout/route.js | /api/logout | POST | - | User logout |

## Payment

| From File | API Name | Methods | Parameters | Notes |
|-----------|----------|---------|------------|-------|
| payment/stripe/route.js | /api/payment/stripe | POST | `{ amount, currency }` | Create Stripe payment intent |
| payment/stripe/webhook/route.js | /api/payment/stripe/webhook | POST | - | Stripe webhook handler |
| checkout/route.js | /api/checkout | POST | `{ videoId }` | Create checkout session |

## Others

| From File | API Name | Methods | Parameters | Notes |
|-----------|----------|---------|------------|-------|
| guidelines/route.js | /api/guidelines | GET | - | Get face swap guidelines |
| gallery/route.js | /api/gallery | GET | - | Get public gallery items |

## Response Format

Most API endpoints return JSON responses in the following format:

Success Response:
```json
{
  "success": true,
  "data": { ... }
}
```

Error Response:
```json
{
  "error": "Error message",
  "stack": "Stack trace (development only)"
}
```

## Error Handling

- All API routes include error handling
- HTTP 500 for server errors
- HTTP 400 for invalid requests
- HTTP 404 for not found resources
- HTTP 401 for unauthorized access
- HTTP 403 for forbidden actions

## File Upload Limits

- Video templates: 150MB
- Image templates: 10MB
- GIF templates: 50MB
- Face source images: 10MB

## Notes

1. All routes under `/api/*` are protected by authentication except:
   - `/api/auth/*`
   - `/api/guidelines`
   - `/api/gallery`

2. File uploads are processed to create thumbnails where applicable

3. Generated media requires payment for full access (without watermark)

4. Template and source files are stored in the following directories:
   - Source images: `/public/sources/`
   - Template videos: `/public/videos/`
   - Generated outputs: `/public/outputs/`
   - Thumbnails: `/public/thumbnails/`
