# Authentication APIs (Internship Assignment)

This project implements basic authentication APIs as part of an internship assignment.  
Features include:
- User Registration (email, username, password)
- User Login (username + password, JWT authentication)
- Forgot Password (reset link via email)
- Reset Password (secure token-based flow)

---

## 🚀 Deployment
The project is deployed on **Railway** and is live at:  
👉 [https://auth-app-production-2c17.up.railway.app](https://auth-app-production-2c17.up.railway.app)

All APIs are available under the prefix:
```
/api/v1/auth/
```

Example endpoints:
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

---

## ⚙️ Tech Stack
- **Node.js** with **Express**
- **PostgreSQL** (via `pg` pool connection)
- **JWT** for authentication
- **bcrypt** for password hashing
- **crypto (SHA-256)** for reset token hashing
- **Mailgun** for sending transactional emails (sandbox for demo, configurable for production)
- **dotenv** for environment variables

---

## 📂 Project Structure
```
.
├── config
|     └── db.js          # Database connection (pg Pool)
├── routes/              # Express routes (auth endpoints)
├── controllers/         # Controller logic for register/login/forgot/reset
├── utils
|     └── sendEmail.js   # Mailgun email helper
├── .env.example         # Reference environment variables
├── package.json
└── README.md
```

---

## 🔑 Environment Variables
A `.env.example` file is included for reference. Copy it to `.env` and update values:

```
DATABASE_PUBLIC_URL=...
PORT=...
JWT_SECRET=...
APP_BASE_URL=...
MAILGUN_API_KEY=...
MAILGUN_BASE_URL=...
MAILGUN_DOMAIN=...
MAILGUN_FROM_EMAIL=...
```

---

## 🔒 Security Highlights
- Passwords stored with **bcrypt hashing** (never plaintext).
- Reset tokens are random, stored as **SHA-256 hashes**, expire in 1 hour, and are single-use.
- JWTs issued on login, signed with secret key.
- Generic responses on forgot-password to avoid user enumeration.
- Environment variables are not committed; `.env.example` is provided instead.

---

## 🛠️ Local Setup
1. Clone the repo:  
   ```bash
   git clone https://github.com/kriti-shesh321/Auth-app.git
   cd Auth-app
   ```

2. Install dependencies:  
   ```bash
   npm install
   ```

3. Setup `.env` from `.env.example` and configure PostgreSQL + Mailgun.

4. Run migrations (minimal schema) using `db/init.sql` file 

5. Start the server:  
   ```bash
   npm run dev
   ```

6. Test with Postman or cURL.

---

## 📧 Email Notes
- For dev/demo: Mailgun sandbox domain is used (only authorized recipients).  
- For production: we can configure a verified sending domain in Mailgun with SPF/DKIM records.  
- Reset emails include a clickable link to `/reset-password?token=<token>`.

---

## 📹 Demo Video

[Video Link:](https://drive.google.com/file/d/1c2JnSlDO_SHnprAwyJi3SJXT65eMhRFr/view?usp=drive_link)

A demo video was recorded showing:  
1. Register → Login flow.  
2. Forgot-password request.  
3. Email with reset link (Mailgun).  
4. Reset-password → new password works, old fails.  

---

## 🧪 Postman Collection
A sanitized Postman collection is included for quick testing inside docs/BanaoAuthApp.json

### Variables to set in Postman:
- `railwayURL` → set to your deployed Railway URL (e.g., `https://auth-app-production-2c17.up.railway.app`)
- `localURL8000` → set to `http://localhost:8000` if testing locally
- `testEmail` → the email to use for signup/login/forgot-password requests

⚠️ **Note**: Forgot/Reset Password endpoints are fully functional, but since Mailgun sandbox restricts recipients, please refer to the demo video for a working run of the email reset flow.

---

## 🧑‍💻 Author

Made by Kriti Shrivastav — feel free to connect!