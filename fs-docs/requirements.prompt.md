Requirements Specification for Face-Swap AI Application

## Overview
Implement face-swapping functionality in two identical React components using the Face Fusion API.

## Component Locations
- `src/app/face-fusion/page.jsx`
- `src/app/face-swap/page.jsx`

## Form Requirements
1. Component Structure
   - Implement as a form component
   - Include two input fields for file paths
   - Add submit functionality

2. Form Fields
   - `source`: String input for source image path
     - Format: Full path to PNG image
     - Example: `/public/source/1.png`
   
   - `target`: String input for target video path
     - Format: Full path to MP4 video
     - Example: `/public/videos/1.mp4`

## API Integration
1. Endpoint: `POST /api/face-swap`
2. Request Body:
   ```json
   {
     "source": "string",
     "target": "string"
   }
   ```

## File Path Requirements
1. Source Image:
   - Location: `/public/source/`
   - Format: PNG files only
   - Must be a valid file path

2. Target Video:
   - Location: `/public/videos/`
   - Format: MP4 files only
   - Must be a valid file path

## Validation
1. Ensure both fields are populated before submission
2. Verify file paths exist
3. Validate file formats (PNG for source, MP4 for target)

Reference: `fs-docs/Face Fusion API.pdf` for detailed API specifications