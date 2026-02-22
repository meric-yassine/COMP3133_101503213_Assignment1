# COMP3133 – Assignment 1  
## Employee Management System (GraphQL + Node.js + MongoDB)

### Student Name: Meriç Yassine  
### Student ID: 101503213  
### Course: COMP 3133 – Full Stack Development II  
### Semester: Winter 2026  

---

## 📌 Project Overview

This project is a backend Employee Management System developed using:

- Node.js
- Express.js
- GraphQL (Apollo Server)
- MongoDB Atlas
- Cloudinary (for employee profile images)
- Postman (API testing)

The system supports user authentication and full CRUD operations for employees, including image upload functionality.

---

## 🛠 Technologies Used

- Node.js
- Express
- Apollo Server (GraphQL)
- MongoDB Atlas
- Mongoose
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- Cloudinary (image hosting)
- Postman (API testing)

---

## 🗄 Database Structure

### Database Name: `comp3133_101503213_Assignment1`


### Collections:
- users
- employees

---

## 👤 Users Collection Schema

| Field        | Type   | Description |
|-------------|--------|-------------|
| username    | String | Unique username |
| email       | String | Unique email |
| password    | String | Hashed password |
| created_at  | Date   | Account creation date |
| updated_at  | Date   | Account update date |

---

## 👨‍💼 Employees Collection Schema

| Field              | Type   | Description |
|-------------------|--------|-------------|
| first_name        | String | Required |
| last_name         | String | Required |
| email             | String | Unique |
| gender            | String | Male / Female / Other |
| designation       | String | Required |
| salary            | Float  | Must be ≥ 1000 |
| date_of_joining   | Date   | Required |
| department        | String | Required |
| employee_photo    | String | Cloudinary URL |
| created_at        | Date   | Creation date |
| updated_at        | Date   | Update date |

---

## 🔐 Authentication

- Passwords are hashed using bcrypt.
- JWT tokens are generated upon successful login.

### Sample User Credentials
`Username: meric`

`Password: 123456`


---

## 🚀 How To Run The Project

### 1️⃣ Clone Repository
`git clone https://github.com/meric-yassine/COMP3133_101503213_Assignment1.git`

`cd COMP3133_101503213_Assignment1`


---

### 2️⃣ Install Dependencies

`npm install`


---

### 3️⃣ Create `.env` File

Create a `.env` file in the root folder:

`MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key`

`CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret`


---

### 4️⃣ Start Server

`node server.js`


Server will run at:

`http://localhost:4000/graphql`


---

## 🧪 API Operations Implemented

### User Operations
- Signup
- Login

### Employee Operations
- Add New Employee (with image upload)
- Get All Employees
- Search Employee by ID
- Search Employee by Designation
- Search Employee by Department
- Update Employee by ID
- Delete Employee by ID

All APIs were tested using Postman.

---

## ☁️ Cloudinary Integration

Employee profile pictures are uploaded to Cloudinary and the secure URL is stored in MongoDB.

---

## 📂 Submission Components

- Word document containing labeled screenshots
- Postman collection export (.json)
- Project ZIP file (without node_modules)
- GitHub repository link
- Sample user credentials included

---

## 📸 Screenshots Included

- MongoDB Atlas database structure
- Users collection documents
- Employees collection documents
- Postman API testing (all operations)
- Cloudinary image upload proof

---

## 🎯 Conclusion

This project successfully demonstrates the implementation of a GraphQL-based backend system with secure authentication, database operations, image handling, and API testing using modern full-stack technologies.

---



