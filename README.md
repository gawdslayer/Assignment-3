# Note-Taking App

A full-stack note-taking application built with Node.js, Express, MongoDB.

## Features

- User authentication and authorization
- Create, read, update, and delete notes
- Secure password hashing
- JWT-based authentication
- Responsive design
- Real-time updates

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
5. Start the development server:
   ```bash
   npm run dev:full
   ```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Notes
- GET /api/notes - Get all notes for authenticated user
- POST /api/notes - Create a new note
- GET /api/notes/:id - Get a specific note
- PUT /api/notes/:id - Update a note
- DELETE /api/notes/:id - Delete a note

## Project Structure

```
note-taking-app/
├── client/                 # React frontend
├── controllers/           # Route controllers
├── middleware/           # Custom middleware
├── models/              # Database models
├── routes/             # API routes
├── server.js          # Entry point
└── package.json      # Project dependencies
```



## Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- Protected routes
- Input validation
- Error handling middleware

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 
