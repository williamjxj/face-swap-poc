# Managing a Next.js App with PM2

PM2 is a production process manager for Node.js applications. This guide walks you through using PM2 to run and manage a Next.js app.

---

## 🔧 Prerequisites

- Node.js and npm installed
- Your Next.js app is ready (with a `package.json`)
- You’ve run `npm run build` for production

---

## 🚀 Step-by-Step Guide

### ✅ 1. Install PM2 globally

```bash
npm install -g pm2
```

---

### 🛠 2. Build your Next.js app

```bash
npm run build
```

---

### ▶️ 3. Start the app with PM2

```bash
pm2 start npm --name "face-swap-app" -- run start
```

- `--name "face-swap-app"` sets a friendly name for the process.
- `run start` executes the `start` script from your `package.json`.

---

### 👀 4. Check app status

```bash
pm2 status
```

This shows running processes, their uptime, CPU/memory usage, etc.

---

### 🧾 5. View logs

```bash
pm2 logs face-swap-app
```

Or see all logs:

```bash
pm2 logs
```

---

### 🔄 6. Auto-restart on system reboot

```bash
pm2 startup
```

Then run the command it suggests to enable startup.

Save the current process list:

```bash
pm2 save
```

---

### ⏹ 7. Managing your app

- Restart:

```bash
pm2 restart face-swap-app
```

- Stop:

```bash
pm2 stop face-swap-app
```

- Delete:

```bash
pm2 delete face-swap-app
```

---

## ✅ That's it!

Your Next.js app is now managed by PM2 and will auto-restart if it crashes or the server reboots.
