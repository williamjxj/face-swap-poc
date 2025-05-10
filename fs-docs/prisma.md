# Next.js with Prisma and PostgreSQL Example

This guide walks through setting up a Next.js application with Prisma ORM and PostgreSQL. We'll create a simple blog application with user authentication and post management.

## Project Setup

First, let's create a new Next.js project:

```bash
# Create a new Next.js app
npx create-next-app@latest my-blog
cd my-blog

# Install dependencies
npm install @prisma/client
npm install prisma --save-dev
```

## Initialize Prisma

```bash
npx prisma init
```

This will create a `prisma` directory with a `schema.prisma` file and a `.env` file.

## Setup PostgreSQL Database

Update the `.env` file with your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/my-blog?schema=public"
```

## Define Prisma Schema

Edit the `prisma/schema.prisma` file:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Generate Prisma Client and Run Migrations

```bash
# Create a migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

## Create Prisma Client Instance

Create a file `lib/prisma.ts`:

```js
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

export default prisma
```

## API Routes

Create a file `pages/api/users/index.ts`:

```js
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { hash } from 'bcrypt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create a new user
    const { name, email, password } = req.body
    try {
      const hashedPassword = await hash(password, 10)
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      })
      
      // Don't send password back to client
      const { password: _, ...userWithoutPassword } = user
      res.status(201).json(userWithoutPassword)
    } catch (error) {
      res.status(500).json({ error: 'Error creating user' })
    }
  } else if (req.method === 'GET') {
    // Get all users
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      res.status(200).json(users)
    } catch (error) {
      res.status(500).json({ error: 'Error fetching users' })
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
```

Create a file `pages/api/posts/index.ts`:

```js
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create a new post
    const { title, content, published, authorId } = req.body
    try {
      const post = await prisma.post.create({
        data: {
          title,
          content,
          published: published || false,
          author: { connect: { id: authorId } },
        },
      })
      res.status(201).json(post)
    } catch (error) {
      res.status(500).json({ error: 'Error creating post' })
    }
  } else if (req.method === 'GET') {
    // Get all posts
    try {
      const posts = await prisma.post.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
      res.status(200).json(posts)
    } catch (error) {
      res.status(500).json({ error: 'Error fetching posts' })
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
```

Create a file `pages/api/posts/[id].ts`:

```js
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const postId = req.query.id as string
  
  if (req.method === 'GET') {
    // Get a single post
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' })
      }
      
      res.status(200).json(post)
    } catch (error) {
      res.status(500).json({ error: 'Error fetching post' })
    }
  } else if (req.method === 'PUT') {
    // Update a post
    const { title, content, published } = req.body
    try {
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          title,
          content,
          published,
        },
      })
      res.status(200).json(updatedPost)
    } catch (error) {
      res.status(500).json({ error: 'Error updating post' })
    }
  } else if (req.method === 'DELETE') {
    // Delete a post
    try {
      await prisma.post.delete({
        where: { id: postId },
      })
      res.status(204).end()
    } catch (error) {
      res.status(500).json({ error: 'Error deleting post' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
```

## Simple Frontend Example

Create a file `pages/index.tsx`:

```tsx
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import prisma from '../lib/prisma'
import { useState } from 'react'

export const getServerSideProps: GetServerSideProps = async () => {
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    props: { posts: JSON.parse(JSON.stringify(posts)) },
  }
}

export default function Home({ posts }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Blog</h1>
      
      <div className="grid gap-6">
        {posts.map((post) => (
          <div key={post.id} className="border p-4 rounded-md">
            <h2 className="text-2xl font-semibold">{post.title}</h2>
            <p className="text-gray-500">By {post.author.name}</p>
            <p className="mt-2">{post.content?.substring(0, 150)}...</p>
            <Link href={`/posts/${post.id}`}>
              <a className="text-blue-500 mt-2 inline-block">Read more</a>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Create a file `pages/posts/[id].tsx`:

```tsx
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import prisma from '../../lib/prisma'

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const post = await prisma.post.findUnique({
    where: {
      id: String(params?.id),
    },
    include: {
      author: {
        select: { name: true },
      },
    },
  })

  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: { post: JSON.parse(JSON.stringify(post)) },
  }
}

export default function Post({ post }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/">
        <a className="text-blue-500 mb-4 inline-block">← Back to home</a>
      </Link>
      
      <h1 className="text-4xl font-bold">{post.title}</h1>
      <p className="text-gray-500 mt-2">By {post.author.name}</p>
      
      <div className="mt-8 prose">
        <p>{post.content}</p>
      </div>
    </div>
  )
}
```

## Setup Auth Utilities (Optional)

Create a file `lib/auth.ts`:

```js
import { compare } from 'bcrypt'
import prisma from './prisma'

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return null
  }

  const isPasswordValid = await compare(password, user.password)
  
  if (!isPasswordValid) {
    return null
  }

  // Don't return password to client
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}
```

## Additional Dependencies

Don't forget to install these additional packages:

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

## Database Seeding (Optional)

Create a file `prisma/seed.ts`:

```js
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create a test user
  const hashedPassword = await hash('password123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
    },
  })

  // Create some posts
  await prisma.post.createMany({
    data: [
      {
        title: 'Getting Started with Next.js',
        content: 'Next.js is a React framework for production...',
        published: true,
        authorId: user.id,
      },
      {
        title: 'Using Prisma with PostgreSQL',
        content: 'Prisma is a next-generation ORM...',
        published: true,
        authorId: user.id,
      },
      {
        title: 'Draft Post',
        content: 'This is a draft post...',
        published: false,
        authorId: user.id,
      },
    ],
  })

  console.log('Database seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Update `package.json` to include the seed script:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
},
```

Then install ts-node:

```bash
npm install --save-dev ts-node
```

Run the seed script:

```bash
npx prisma db seed
```

## Conclusion

This setup provides a solid foundation for a Next.js application with Prisma and PostgreSQL. It includes:

1. User and Post models with relationships
2. API routes for CRUD operations
3. Server-side rendering with data fetching
4. Basic frontend pages
5. Authentication utilities
6. Database seeding

You can expand this example by adding:
- User authentication with Next.js middleware
- Form validation
- Error handling
- Optimistic UI updates
- Pagination
- Search functionality
- Categories or tags for posts