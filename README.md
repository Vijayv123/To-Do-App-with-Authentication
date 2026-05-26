# To-Do App With Authentication

A full-stack To-Do app built with React, Node.js, Express, and MongoDB.

## Features

- Beautiful login and registration UI
- JWT-based authentication
- Protected to-do API routes
- Create, complete, edit, and delete tasks
- MongoDB persistence with Mongoose

## Setup

1. Install dependencies:

```bash
npm install
npm run install:all
```

2. Configure backend environment:

```bash
copy backend\.env.example backend\.env
```

Update `backend\.env` with your MongoDB connection string and JWT secret.

3. Run the app:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`
