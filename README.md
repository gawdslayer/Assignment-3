# Note-Taking App

A full-stack note-taking application built with Node.js, Express, MongoDB, and an EJS server-rendered user interface.

## Features

- Secure user authentication and authorization with session management.
- Complete CRUD (Create, Read, Update, Delete) functionality for notes.
- Server-rendered UI using EJS and Express EJS Layouts.
- Download notes in various formats: TXT, Markdown, and PDF.
- RESTful API for note management.
- Filtering notes by tags.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd note-taking-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file in the root directory and add the following variables. Replace the placeholder values with your actual configuration.
    ```
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_for_api
    SESSION_SECRET=a_very_strong_session_secret
    PORT=5000
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5000`.

## API Endpoints

The API is protected, and most endpoints require authentication.

### Authentication (`/api/auth`)
- `POST /register` - Register a new user.
- `POST /login` - Login a user and receive a JWT.

### Notes (`/api/notes`)
- `GET /` - Get all notes for the authenticated user. Can be filtered by tag with a query parameter (e.g., `/api/notes?tag=work`).
- `POST /` - Create a new note.
- `GET /:id` - Get a specific note by its ID.
- `PUT /:id` - Update a note by its ID.
- `DELETE /:id` - Delete a note by its ID.
- `GET /:id/download/txt` - Download a note as a TXT file.
- `GET /:id/download/md` - Download a note as a Markdown file.
- `GET /:id/download/pdf` - Download a note as a PDF file.

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
