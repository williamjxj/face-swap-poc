# Face Swap POC

https://www.seaart.ai/zhCN/ai-tools/ai-face-swap

https://shop.ultimatech.hk/

A Next.js application for generating images with AI and processing payments.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Linux (CentOS) Deployment](#linux-centos-deployment)
3. [File Layout](#file-layout)
4. [Project Structure](#project-structure)
5. [Application Workflow](#application-workflow)
6. [Authentication](#authentication)
7. [Third Party APIs](#third-party-apis)
8. [Notes & Tips](#notes--tips)

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Environment variables (see `.env.example`)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables
Copy `.env.example` to `.env` and fill in:
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `AZURE_AD_CLIENT_ID` - Microsoft Azure AD client ID
- `AZURE_AD_CLIENT_SECRET` - Microsoft Azure AD client secret
- `AZURE_AD_TENANT_ID` - Microsoft Azure AD tenant ID
- `NEXT_PUBLIC_IMAGE_API_URL` - Image generation API endpoint
- `NEXT_PUBLIC_CHECKOUT_API_URL` - Payment processing API endpoint

## Linux (CentOS) Deployment

### 1. Install Node.js
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 3. Build and Run
```bash
npm install
npm run build
pm2 start "npm run start" --name face-swap-app
```

### 4. Configure Nginx (Optional)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        send_timeout 300s;
    }
}
```

## File Layout


## Project Structure

- **Framework**: Next.js 15 with React 19
- **Routing**: App router architecture
- **Components**: Server components by default
- **Styling**: TailwindCSS with PostCSS
- **State Management**: React context and hooks
- **Authentication**: NextAuth.js with JWT sessions

## Application Workflow

1. **Authentication**
   - User signs in via Google or Microsoft
   - JWT session established
   - Session persisted via cookies

2. **FaceFusion Video Generation**
   - User provides prompt and style
   - Request sent to image generation API
   - Generated image URL returned

3. **Checkout Process**
   - User selects image for purchase
   - Checkout session created
   - Redirect to payment processor

## Authentication

The application uses NextAuth.js with the following providers:
- Google OAuth
- Microsoft Azure AD

### Session Management
- JWT strategy for sessions
- Custom sign-in page at `/auth/signin`
- Session utilities:
  - `loginWithGoogle()`
  - `loginWithMicrosoft()`
  - `getCurrentSession()`
  - `logout()`
  - `isAuthenticated()`

## Third Party APIs

### Payment Processing API
- Endpoint: `NEXT_PUBLIC_CHECKOUT_API_URL`
- Required parameters:
  - `imageId`: ID of image to purchase
  - `imageUrl`: URL of image to purchase
- Returns:
  - `checkoutUrl`: Payment processor URL

## Notes & Tips

### Environment Setup
- Always keep `.env` out of version control
- Use `.env.example` as a template for required variables

### Customization
- Add more auth providers by editing `src/services/auth.js`
- Modify session callback behavior in auth options

### API Integration
- Standardize API responses with:
  - Success: `{ data }`
  - Error: `{ error }` with status code

### Development
- Use `npm run lint` to check code quality
- Enable Turbopack for faster dev server (`npm run dev --turbo`)


### Checkout

点击 Checkout 发起支付流程
3. 测试支付：卡号输入 4242 4242 4242 4242，Expiry date 输入任意未来的 MM/YY，cvc 输入任意三位数字
4. 完成支付后跳转回 Success page，可以下载图片

### CSS

`bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-lg`


### PostgreSQL@17

```bash
$ PGPASSWORD=William1! psql -h localhost -p 5432 -U postgres -d facefusion -c "\l"

$ PGPASSWORD=William1! psql -h 127.0.0.1 -p 5432 -U postgres -d facefusion -c "\conninfo"
```
