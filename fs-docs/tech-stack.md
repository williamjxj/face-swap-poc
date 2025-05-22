# Tech Stack

## Module & Purpose

| Module               | Purpose                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------ |
| formidable           | Parse incoming form data and file uploads in Node.js                                       |
| framer-motion        | React animation library for declarative, complex animations                                |
| form-data            | Create and handle multipart/form-data streams for HTTP requests                            |
| lucide-react         | React icon library providing customizable SVG icons                                        |
| pg                   | PostgreSQL client for Node.js to interact with databases                                   |
| tailwindcss-animate  | Tailwind CSS plugin adding CSS animation utilities                                         |
| postcss              | Tool for transforming CSS with JavaScript plugins                                          |
| @tailwindcss/postcss | Official Tailwind CSS PostCSS plugin to integrate Tailwind with PostCSS                    |
| headlessui/react     | Unstyled, accessible UI components for React, designed to integrate with Tailwind CSS      |
| prisma/client        | Auto-generated Prisma Client for database access in Node.js and TypeScript/JavaScript apps |
| prisma               | Next-generation ORM for Node.js and TypeScript, used to define and manage database schema  |
| sharp                | convert, Resize, crop, and rotate images                                                   |

## DB Table Based APIs

```tree
/src/app/api/
├── auth/
│   └── [...nextauth]/
│       └── route.js
├── target-templates/
│   ├── route.js (GET, POST - list/create)
│   └── [id]/
│       └── route.js (GET, PUT, DELETE - single item ops)
├── generated-media/
│   ├── route.js (GET, POST - list/create)
│   └── [id]/
│       └── route.js (GET, PUT, DELETE - single item ops)
├── face-sources/
│   ├── route.js (GET, POST - list/create)
│   └── [id]/
│       └── route.js (GET, PUT, DELETE - single item ops)
├── guidelines/
│   └── route.js (GET - list only)
└── users/
    ├── route.js (GET, POST)
    └── [id]/
        └── route.js (GET, PUT, DELETE)
```

### 🥬 Storage Operations APIs

```tree
/src/app/api/storage/
├── outputs/
│   ├── route.js (GET - list files)
│   ├── upload/route.js (POST - upload)
│   └── delete/route.js (DELETE)
├── sources/
│   ├── route.js (GET - list files)
│   ├── upload/route.js (POST - upload)
│   └── delete/route.js (DELETE)
└── templates/
    ├── route.js (GET - list files)
    ├── upload/route.js (POST - upload)
    └── delete/route.js (DELETE)
```

### 🥒 Processing APIs

```tree
/src/app/api/processing/
├── face-fusion/
│   └── route.js (POST - process fusion)
└── face-swap/
    └── route.js (POST - process swap)
```

### 🌶 identity

- `identify` file size (file)

### 🌽 sharp npm module

- Resize, crop, and rotate images
- Convert images between formats (JPEG, PNG, WebP, AVIF, GIF, TIFF, SVG)
- Compress and optimize images for web use
- Extract image metadata
- Perform advanced operations like compositing, color adjustment, and more

```jsx
sharp('input.jpg')
  .resize(200, 200)
  .toFile('output.webp', (err, info) => {
    // Processed image saved as output.webp
  })
```

### 🌽 CORS

- Using `middleware` to add `CORS` headers
- Configuring `CORS` for API routes in `next.config.js`


### 🌽

### 🌽 video

```jsx
<video width="320" height="240" controls preload="none">
  <source src="/path/to/video.mp4" type="video/mp4" />
  <track src="/path/to/captions.vtt" kind="subtitles" srcLang="en" label="English" />
  Your browser does not support the video tag.
</video>
```

### 🥕 Claude, Gemini, o4-mini, GPT-4o, o4-mini (preview)

| Model                 | Coding Strengths & Benchmarks                                                                                                               | Notable Weaknesses/Notes                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **GPT-4.1**           | Top performer: 54.6% on SWE-bench Verified (real-world coding tasks), excels at code diffs, multi-step instructions, and context retention. | Best for complex, large-scale coding.    |
| **Claude 3.7 Sonnet** | State-of-the-art on TAU-bench; praised by users for generating complete, high-quality, modern JS code in one go.                            | No major weaknesses noted.               |
| **Claude 3.5 Sonnet** | 49% on SWE-bench Verified; strong at agentic coding, tool use, and multi-step development.                                                  | Slightly behind GPT-4.1 and 3.7 Sonnet.  |
| **Gemini 2.5 Pro**    | #1 on WebDev Arena leaderboard; excels at web app development, code transformation, and editing.                                            | Especially strong for web-focused tasks. |
| **GPT-4o**            | Fast, good for boilerplate and syntax, but scores much lower (33.2% SWE-bench), often oversimplifies and requires more debugging.           | Weaker for complex coding.               |
| **o4-mini (preview)** | Competitive on Python (99.5% AIME), strong for fast, cost-efficient coding, especially in high-throughput scenarios.                        | Smaller size, not as strong as GPT-4.1.  |

## Coding Styles

- `ESLint` for code quality checks and unused imports detection - configured via `.eslintrc.js` and `eslint.config.mjs`
- `Prettier` for consistent code formatting - configured via `.prettierrc`
- `EditorConfig` for consistent editor settings - configured via `.editorconfig`
- `VS Code Integration` - configured via `settings.json`

## Cleanup codes

```text
For a Next.js (v15.2.4) app with AI features, how can I clean up the project before deploying to production? Specifically, how do I remove unused, unnecessary, or deprecated code and files?

please do whatever you can do upon your best knowledges and experiences, help me cleanup codes, and merge codes/functions if they are similar.
```

```bash
# Install dependency-cruiser for analyzing code dependencies
$ npm install --save-dev dependency-cruiser

# Install npm-check for finding unused dependencies
$ npm install --save-dev npm-check
```
