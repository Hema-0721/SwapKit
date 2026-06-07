# SwapKit (SchoolSwap) 🎒🔁

SwapKit (SchoolSwap) is a hyperlocal, trust-based Progressive Web App (PWA) marketplace built on the MERN stack. It allows parents in Indian K-12 school communities to swap, barter, or donate outgrown school supplies—such as textbooks, uniforms, school shoes, and bags—directly with other verified parents in the same school campus.

---

## 🌟 Key Features

*   **Verified School Networks**: Parents join using their child's school campus registration code. Transactions occur only between families of the same campus, ensuring trust and physical safety.
*   **Double-Match Barter Engine**: Automatically pairs parents who are transitioning grades in opposite directions (e.g., Parent A moving Grade 8 ➔ 9, and Parent B moving Grade 9 ➔ 8) to swap textbooks directly.
*   **Progressive Web App (PWA)**: Zero-install PWA optimized for lightweight mobile viewports ($\ge 375\text{px}$) with local Workbox offline feed caching.
*   **Real-time Socket Chat**: Direct messaging channel for parents to negotiate exchanges, complete with instant Socket.io message synchronization and barter match alerts.
*   **Free Donation Corner**: A dedicated zero-cash area for parents to donate uniforms, stationery, and bags directly to low-income families or registered NGOs.
*   **School Syllabus Checklists**: Access official recommended syllabus books and accessories by grade with one-click "Find Secondhand" marketplace browse filters.
*   **Trust Rating & Reviews**: A rating system enabling parents to leave feedback post-exchange, calculating rolling average ratings.

---

## 🛠️ Technology Stack

### Backend (`/server`)
*   **Node.js** & **Express** (TypeScript)
*   **MongoDB Atlas** with **Mongoose** ODM
*   **Socket.io** (WebSockets for real-time messaging)
*   **Winston** & **Morgan** (Logging)
*   **Zod** (Request schema validations)

### Frontend (`/client`)
*   **React 19** & **Vite** (TypeScript)
*   **Tailwind CSS 3.x** (Layout & styling)
*   **Zustand** (Global state management)
*   **Axios** with automatic JWT Token Rotation interceptors
*   **Vite PWA Plugin** (Service worker & Web App Manifest)

---

## 📁 Project Structure

```
SwapKit/
├── client/                 # React 19 Frontend Web Application
│   ├── src/
│   │   ├── components/     # Reusable UI parts (Navbar, Buttons, Cards)
│   │   ├── pages/          # View routes (Feed, Detail, Chats, Profile, Checklist)
│   │   ├── services/       # API Axios wrapper, WebSockets, and mock i18n
│   │   ├── store/          # Zustand global states (Auth, UI Toasts)
│   │   ├── App.tsx         # Router configuration & Guards
│   │   └── main.tsx        # Mount point
│   ├── tailwind.config.js  # Styling variables
│   └── vite.config.ts      # Vite PWA builder configurations
│
└── server/                 # Express REST API & WebSockets Server
    ├── src/
    │   ├── config/         # DB & Environment loader
    │   ├── controllers/    # Route controllers (Auth, Listings, Chats, Reviews)
    │   ├── middleware/     # Auth checks, rate-limiters, image uploads
    │   ├── models/         # Mongoose schemas (User, Listing, Chat, Review, School)
    │   ├── routes/         # Express endpoint maps
    │   ├── scripts/        # Seed script and automated integration tests
    │   ├── services/       # Barter match engine scans
    │   └── index.ts        # Server entry listener
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js v20+** and **npm v10+** installed on your machine.

### 2. Backend Setup (`/server`)
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your Environment Variables by creating a `.env` file:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://gurrapuhemasree7_db_user:RjTgxyOSTDHOOM4S@swapkit.lfpdk16.mongodb.net/?appName=SwapKit
   JWT_ACCESS_SECRET=super_secret_access_key_123!
   JWT_REFRESH_SECRET=super_secret_refresh_key_456!
   CLOUDINARY_CLOUD_NAME=djidml0mv
   CLOUDINARY_API_KEY=546864855873773
   CLOUDINARY_API_SECRET=Mv2wy3zLcqqA3qSyTblvAVetIew
   ```
4. Seed the database with mock schools, users, and 252 items covering all classes, categories, and exchange modes:
   ```bash
   npm run seed
   ```
5. Run the API automated integration tests:
   ```bash
   npm run test:endpoints
   ```
6. Start the development API server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup (`/client`)
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development bundler:
   ```bash
   npm run dev
   ```
4. Build the PWA optimized bundle for production:
   ```bash
   npm run build
   ```

---

## 🔑 Test Credentials & Verification

To test the application features in development mode, log in with any of these pre-seeded parent accounts:

| User | Mobile Number | School Network | Grade Default |
| :--- | :--- | :--- | :--- |
| **Priya Sharma** | `9876543210` | Delhi Public School, Nagpur | Class 8 |
| **Rajan Verma** | `9876543211` | Delhi Public School, Nagpur | Class 9 |
| **Karan Joshi** | `9876543213` | Kendriya Vidyalaya, Pune | Class 5 |
| **Sister Anitha (NGO)** | `9876543212` | St. Mary's High School, Hyderabad | Class 5 |

*   **Mock Verification OTP**: Use the static code **`123456`** for verification.
