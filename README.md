# SparkMotors — Sub Motor & Copper Spare Parts Shop

> Premium e-commerce website for submersible motor parts, copper winding wire, and pump accessories.

---

## ⚡ Quick Start

```bash
cd C:\Users\krish\.gemini\antigravity\scratch\spare-parts-shop

# Install dependencies
cmd /c "npm install"

# Seed database with sample data (22 products)
cmd /c "node seed.js"

# Start server
cmd /c "node server.js"

# Open http://localhost:3001
```

**Admin Login (Production):** `college1110kj@gmail.com` / `krishna1110` (or `admin` / `krishna1110`)
**Admin Login (Preview/Mock):** `admin@spareparts.com` / `admin123`

---

## 🏗 Architecture

```
spare-parts-shop/
├── server.js           # Express server (port 3001)
├── seed.js             # Sample data seeder
├── db/index.js         # SQLite + Sequelize
├── models/             # Category, Product, User, Order, CartItem
├── routes/             # products, categories, cart, orders, auth
└── public/             # Frontend SPA
    ├── index.html
    ├── css/style.css   # Industrial dark theme
    └── js/
        ├── api.js, components.js, app.js
        └── pages/ (home, products, productDetail, cart, checkout, auth, orders, admin)
```

## 🎨 Features

| Feature | Description |
|---------|-------------|
| Product Catalog | 22 products across 6 categories with search & filters |
| Product Detail | Specs table, pricing, discount badges, stock info |
| Shopping Cart | Add/remove items, quantity controls, order summary |
| Checkout | Shipping form, COD/UPI/Bank payment options |
| Auth | JWT-based login/register, admin role |
| Admin Dashboard | Stats, order management, product CRUD |
| Dark Theme | Industrial copper/orange accents, glassmorphism |

## 🚀 Going Live (Production Deployment)

This project is configured to be deployed easily to **Render.com** with **PostgreSQL**.

### 1. Create a Secure Admin Account
Don't use the default admin in production! Create your own secure admin account:
```bash
cmd /c "node create-admin.js --name \"Your Name\" --email \"you@email.com\" --password \"your_super_secret_password\""
```

### 2. Push to GitHub
First, upload this project to a new GitHub repository:
1. Go to GitHub and create a new repository called `spare-parts-shop`
2. Open your terminal in this folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/spare-parts-shop.git
   git push -u origin main
   ```

### 3. Deploy to Render.com (Free)
1. Go to [Render.com](https://render.com) and log in with GitHub
2. Click **New +** > **Blueprint**
3. Connect your `spare-parts-shop` GitHub repository
4. Render will automatically read the `render.yaml` file and set up:
   - A Node.js Web Service
   - A PostgreSQL Database
5. Wait ~5 minutes for it to build and deploy. You'll get a live URL (e.g., `sparkmotors.onrender.com`)!

---

## License

MIT
