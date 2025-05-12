# Processing API Routes

| Name | Description | Example Usage |
|------|-------------|---------------|
| POST /api/face-fusion | Processes face fusion between a source image and target video. Accepts either multipart form data or JSON with file paths. Returns the processed video URL. | ```fetch('/api/face-fusion', {
  method: 'POST',
  body: formData // Contains 'source' image and 'target' video files
})``` |
| GET /api/face-swaps | Retrieves all face swap records with associated source, template and media data. | ```fetch('/api/face-swaps')``` |
| POST /api/face-swaps | Creates a new face swap record linking source, template and generated media. | ```fetch('/api/face-swaps', {
  method: 'POST',
  body: JSON.stringify({
    faceSourceId: 1,
    templateId: 1,
    generatedMediaId: 1
  })
})``` |
| GET /api/generated-media | Lists all generated media files with metadata. Returns file paths and sizes. | ```fetch('/api/generated-media')``` |
| DELETE /api/generated-media | Deletes a generated media file by filename. Also removes database record. | ```fetch('/api/generated-media?filename=output.mp4', {
  method: 'DELETE'
})``` |
