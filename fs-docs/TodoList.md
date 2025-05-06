
- Should the navigation links point to actual routes or remain as placeholders?
- Is there any existing API route setup for image generation?
- Should the buttons have actual functionality or just be static for now?

- Image generation API integration (likely using a service like OpenAI DALL-E, Stable Diffusion, etc.)
- Stripe integration for payments
- Form validation
- Gallery storage solution (local or cloud)


- Which image generation API/service should we use?
- Should we implement user authentication?
- Where should generated images be stored?
- What payment model (pay-per-image or subscription)?
- Should we implement a gallery feature now?

Walk through Stripe setup


## NextAuth.js

- signin.js
- Prisma Schema
- Session
- Token
- VerificationToken
- HTTPS
- NextAuth OAuth provider

### GCP: William Image Generator

### Azure: William-Image-Generator

1. logout cleanup all login info, such as tokens cookies etc.
2. if alreay login, home url directly redirects to generate page; if not, any routes redirects to home page.
3. I need react-icons to the items in More button, as well as in Footer items.