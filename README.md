# ⭐ Store Rating System — Backend (Node.js + Express + PostgreSQL)

A robust backend API for the Store Rating & Management System, built with **Node.js**, **Express**, **Sequelize ORM**, **PostgreSQL**, and **JWT Authentication**.

This backend powers three distinct types of users, each with specific roles and permissions:

* **Normal User** $\rightarrow$ View stores, give/update ratings on stores.
* **Store Owner** $\rightarrow$ View detailed ratings received on their store(s).
* **Admin** $\rightarrow$ Comprehensive management of users & stores, view dashboard analytics.

---

## 📑 Table of Contents

* [🚀 Tech Stack](#-tech-stack)
* [📁 Project Structure](#-project-structure)
* [🛠 Local Setup](#-local-setup)
* [🔧 Environment Variables](#-environment-variables)
* [🗄 Database Setup](#-database-setup)
* [🚦 Available Scripts](#-available-scripts)
* [🌐 API Overview](#-api-overview)
    * [🔐 Auth Endpoints](#-auth-endpoints)
    * [👤 User Endpoints (`/user`)](#-user-endpoints-user)
    * [🏪 Store Owner Endpoints (`/owner`)](#-store-owner-endpoints-owner)
    * [🛠 Admin Endpoints (`/admin`)](#-admin-endpoints-admin)
* [🔒 Roles & Permissions](#-roles--permissions)
* [🚀 Deployment Notes](#-deployment-notes)
* [📄 License](#-license)

---

## 🚀 Tech Stack

| Technology | Description |
| :--- | :--- |
| **Node.js + Express** | Core framework for the RESTful API. |
| **PostgreSQL** | Primary relational database for data persistence. |
| **Sequelize ORM** | Object-Relational Mapper for seamless database interaction. |
| **JWT** | Secure, stateless authentication mechanism. |
| **bcrypt** | Hashing library for securing user passwords. |
| **dotenv** | Environment configuration management. |
| **Nodemon** | Auto-restarting server for development workflow. |

---

## 📁 Project Structure

The project follows a standard MVC-like structure for clarity and maintainability.

---
## 🛠 Local Setup

Follow these steps to get the backend running locally.

### 1. Install dependencies

npm install

### 2. Create a .env file

Create a file named .env in the root of the project and populate it with your environment variables.

### 3. Create PostgreSQL database

Ensure PostgreSQL is running and create the necessary database:

CREATE DATABASE store_rating;

### 4. Start server in development mode

npm run dev

The API server will be accessible at: http://localhost:5000/api

---

## 🔧 Environment Variables

The application requires the following environment variables to be set in the .env file:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| PORT | API server port. | 5000 |
| DATABASE_URL | Full PostgreSQL connection string URL. | postgres://username:password@localhost:5432/store_rating |
| JWT_SECRET | Secret key used for signing JWTs. | your_secret_key |
| JWT_EXPIRES_IN | Token expiry duration. | 7d |

---

## 🗄 Database Setup

The system relies on three main Sequelize models:

### 👤 User Model

| Field | Description | Constraints / Values |
| :--- | :--- | :--- |
| id | Primary Key | UUID/Integer |
| name | User's full name | String |
| email | Unique login identifier | String, Unique |
| password_hash | Hashed password | String (using bcrypt) |
| role | User's permission level | SYSTEM_ADMIN | NORMAL_USER | STORE_OWNER |
| address | User's address | String |

### 🏪 Store Model

| Field | Description | Constraints / Values |
| :--- | :--- | :--- |
| id | Primary Key | UUID/Integer |
| name | Store name | String |
| email | Store contact email | String |
| address | Store location | String |
| owner_id | Foreign key to the User who owns the store | References User.id |
| average_rating | Calculated average rating (denormalized) | Decimal |
| ratings_count | Total number of ratings (denormalized) | Integer |

### ⭐ Rating Model

| Field | Description | Constraints / Values |
| :--- | :--- | :--- |
| id | Primary Key | UUID/Integer |
| rating_value | The rating given | Integer (1–5) |
| comment | Optional comment on the rating | Text |
| user_id | Foreign key to the User who gave the rating | References User.id |
| store_id | Foreign key to the Store being rated | References Store.id |

---

## 🚦 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| Start dev server | npm run dev | Runs the server with **nodemon** for automatic restarts on file changes. |
| Start production | npm start | Runs the server in Node's production environment. |

---

## 🌐 API Overview

All endpoints are prefixed with /api.

### 🔐 Auth Endpoints

| Method | Endpoint | Description | Authentication |
| :--- | :--- | :--- | :--- |
| POST | /auth/register | Register a new user | None |
| POST | /auth/login | Log in a user and returns a **JWT** | None |

### 👤 User Endpoints (/user)

Requires **JWT** (Normal User access or higher).

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| GET | /user/stores | List all stores and the current user’s rating for each. | NORMAL_USER |
| POST | /user/stores/:id/rating | Create a new rating for a store. | NORMAL_USER |
| PUT | /user/stores/:id/rating | Update an existing rating for a store. | NORMAL_USER |
| GET | /user/me | Get the profile details of the logged-in user. | Any authenticated user |
| PUT | /user/me | Update the profile details of the logged-in user. | Any authenticated user |

### 🏪 Store Owner Endpoints (/owner)

Requires **JWT** (Store Owner access or higher).

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| GET | /owner/stores | Get a list of stores owned by the current user. | STORE_OWNER |
| GET | /owner/stores/:id/ratings | List all ratings received for a specific owned store. | STORE_OWNER |

### 🛠 Admin Endpoints (/admin)

Requires **JWT** (System Admin access only).

#### User Management

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | /admin/users | List all users. |
| GET | /admin/users/:id | Get details for a specific user. |
| POST | /admin/users | Create a new user (including admins/owners). |
| PUT | /admin/users/:id | Update a user's details or role. |
| DELETE | /admin/users/:id | Delete a user. |

#### Store Management

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | /admin/stores | List all stores. |
| GET | /admin/stores/:id | Get details for a specific store. |
| POST | /admin/stores | Create a new store and assign an owner. |
| PUT | /admin/stores/:id | Update a store's details or owner. |
| DELETE | /admin/stores/:id | Delete a store. |

#### Dashboard

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | /admin/dashboard | Get system-wide analytics (Total users, stores, ratings). |

---

## 🔐 Authentication

All authenticated routes require a valid JSON Web Token (JWT) passed in the Authorization header.

### Request Header Example:

Authorization: Bearer <token_received_on_login>

---

## 🔒 Roles & Permissions

Access control is enforced using dedicated Express middleware, utilizing functions like:

* role("SYSTEM_ADMIN")
* role("STORE_OWNER")
* role("NORMAL_USER")

**Key Permissions Logic:**
* Only **Admins** can create, update, or delete users and stores.
* Only **Store Owners** can view the ratings received on their specific store(s).
* **Normal Users** and other authenticated users can only edit their *own* profile (/user/me).

---

## 🚀 Deployment Notes

For production deployment:

* Use platforms like Railway, Render, or a dedicated cloud service.
* Set environment variables (especially JWT_SECRET and DATABASE_URL) using platform settings.
* Use a hosted PostgreSQL service (e.g., Supabase, Neon) and its connection string for the DATABASE_URL.
* Disable console.log() for sensitive data before deploying.

---

## 📄 License

This project is free to modify and use for learning or development purposes.
