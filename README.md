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
