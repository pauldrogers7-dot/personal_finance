# 💰 Finance Tracker

A personal finance tracking application for managing accounts, transactions, budgets, and investments — built with React, Vite, and Tailwind CSS.

All data is stored locally in your browser (localStorage) — nothing is sent to any server.

---

## ✨ Features

- **Accounts** — Multiple account types (Checking, Savings, Credit Card, Investment, Property, Cash), drag-to-reorder, totals by account type
- **Transactions** — Add/edit/delete with payee autocomplete & auto-fill from previous transactions, split categories, custom icons
- **Recurring Transactions** — Automatic and manual posting, skip occurrences, pause/resume
- **Budget** — Set and track spending by category
- **Reports** — Visual breakdowns by category, account, and time period
- **Dashboard** — Customisable widgets and overview
- **Settings** — Custom categories with emoji icons, currency, and more

---

## 🚀 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 2. Install dependencies
cd frontend
npm install

# 3. Start the development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Building for Production

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`.

---

## 🌐 GitHub Pages Deployment

This project is configured to automatically deploy to **GitHub Pages** on every push to `main`.

### First-time setup

1. Push the project to a GitHub repository
2. Go to **Settings → Pages** in your GitHub repository
3. Under **Source**, select **GitHub Actions**
4. Push to `main` — the workflow will build and deploy automatically

Your app will be live at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

### Manual deployment

You can also trigger a deployment manually from the **Actions** tab in your GitHub repository → select **Deploy to GitHub Pages** → **Run workflow**.

---

## 🛠️ Tech Stack

- **React 19** — UI framework
- **Vite 7** — Build tool
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Styling
- **Radix UI** — Accessible component primitives
- **Recharts** — Charts and graphs
- **Lucide React** — Icons
- **localStorage** — Data persistence

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # Feature components (Accounts, Transactions, etc.)
│   │   └── ui/            # Shared UI primitives (shadcn/ui style)
│   ├── context/           # React context (FinanceContext)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities (finance-utils, categories, etc.)
│   └── types/             # TypeScript types
├── public/                # Static assets
└── package.json
```
