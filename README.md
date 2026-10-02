# CourseHub - Student Course Registration System

A modern React CRUD application for managing courses and student registrations.

## Features

- Dashboard with live statistics
- Create, read, update and delete courses
- Register students for courses
- Drop registrations
- Search and filter courses
- Capacity tracking
- Registration status badges
- Browser localStorage persistence
- Responsive modern UI
- Docker + Nginx production setup
- Ready for GitHub and Jenkins lab deployment

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown by Vite, usually:

```text
http://localhost:5173
```

## Production build

```bash
npm run build
npm run preview
```

## Docker

Build:

```bash
docker build -t student-course-registration .
```

Run:

```bash
docker run -d -p 3000:80 --name student-course-app student-course-registration
```

Open:

```text
http://localhost:3000
```

Stop:

```bash
docker stop student-course-app
```

Remove:

```bash
docker rm student-course-app
```

## CRUD operations

The Courses section supports:

- CREATE - Add a new course
- READ - View/search/filter courses
- UPDATE - Edit course details
- DELETE - Remove a course

Registration data is stored in browser localStorage for this lab version.
