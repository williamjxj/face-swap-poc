## Module & Purpose

| Module              | Purpose                                                                                      |
|---------------------|----------------------------------------------------------------------------------------------|
| formidable          | Parse incoming form data and file uploads in Node.js                                        |
| framer-motion       | React animation library for declarative, complex animations                                 |
| form-data           | Create and handle multipart/form-data streams for HTTP requests                             |
| lucide-react        | React icon library providing customizable SVG icons                                        |
| pg                  | PostgreSQL client for Node.js to interact with databases                                   |
| tailwindcss-animate | Tailwind CSS plugin adding CSS animation utilities                                         |
| postcss             | Tool for transforming CSS with JavaScript plugins                                          |
| @tailwindcss/postcss| Official Tailwind CSS PostCSS plugin to integrate Tailwind with PostCSS                    |
| headlessui/react    | Unstyled, accessible UI components for React, designed to integrate with Tailwind CSS      |
| prisma/client       | Auto-generated Prisma Client for database access in Node.js and TypeScript/JavaScript apps |
| prisma              | Next-generation ORM for Node.js and TypeScript, used to define and manage database schema  |
| sharp | |


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


### 🌶  

### 🌽 

### 🥕 