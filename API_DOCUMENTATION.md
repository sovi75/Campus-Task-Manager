# API Documentation
## Campus Task Manager API Specifications

---

## 1. Overview
The Campus Task Manager backend exposes a REST API served over HTTP. Except for registration and login endpoints, **all endpoints require JWT (JSON Web Token) authentication** passed as a Bearer token in the `Authorization` header.

- **Base URL**: `http://localhost:5000/api`
- **Request Format**: `application/json`
- **Response Format**: `application/json`

---

## 2. Authentication API (`/auth`)

### 2.1 Register User
Create a new student account.

*   **URL**: `/auth/register`
*   **Method**: `POST`
*   **Authentication**: None
*   **Request Body**:
    ```json
    {
      "name": "Alex Mercer",
      "email": "alex@university.edu",
      "password": "securepassword123"
    }
    ```
*   **Success Response (Code 201)**:
    ```json
    {
      "status": "success",
      "message": "Registration successful",
      "data": {
        "_id": "60d0fe4f5311236168a109ca",
        "name": "Alex Mercer",
        "email": "alex@university.edu",
        "createdAt": "2026-07-02T12:00:00.000Z",
        "token": "eyJhbGciOiJIUzI1NiIsIn..."
      }
    }
    ```
*   **Error Response (Code 400)**:
    ```json
    {
      "status": "error",
      "message": "User already exists with this email address"
    }
    ```

---

### 2.2 Login User
Authenticate an existing student.

*   **URL**: `/auth/login`
*   **Method**: `POST`
*   **Authentication**: None
*   **Request Body**:
    ```json
    {
      "email": "alex@university.edu",
      "password": "securepassword123"
    }
    ```
*   **Success Response (Code 200)**:
    ```json
    {
      "status": "success",
      "message": "Login successful",
      "data": {
        "_id": "60d0fe4f5311236168a109ca",
        "name": "Alex Mercer",
        "email": "alex@university.edu",
        "createdAt": "2026-07-02T12:00:00.000Z",
        "token": "eyJhbGciOiJIUzI1NiIsIn..."
      }
    }
    ```
*   **Error Response (Code 401)**:
    ```json
    {
      "status": "error",
      "message": "Invalid email or password"
    }
    ```

---

### 2.3 Logout User
Log out of the current session.

*   **URL**: `/auth/logout`
*   **Method**: `POST`
*   **Authentication**: None
*   **Success Response (Code 200)**:
    ```json
    {
      "status": "success",
      "message": "Logged out successfully. Please remove your access token."
    }
    ```

---

### 2.4 Get Current User Profile
Retrieve account info for the logged-in student.

*   **URL**: `/auth/me`
*   **Method**: `GET`
*   **Headers**: `Authorization: Bearer <token>`
*   **Success Response (Code 200)**:
    ```json
    {
      "status": "success",
      "data": {
        "_id": "60d0fe4f5311236168a109ca",
        "name": "Alex Mercer",
        "email": "alex@university.edu",
        "createdAt": "2026-07-02T12:00:00.000Z"
      }
    }
    ```

---

## 3. Tasks API (`/tasks`)

### 3.1 Get Tasks (With Search & Filter Options)
Retrieve a list of tasks for the logged-in user.

*   **URL**: `/tasks`
*   **Method**: `GET`
*   **Headers**: `Authorization: Bearer <token>`
*   **Query Parameters (Optional)**:
    - `status`: Filter by status (`Pending` or `Completed`).
    - `priority`: Filter by priority (`Low`, `Medium`, or `High`).
    - `category`: Filter by category (`Assignment`, `Exam`, `Project`, or `Personal`).
    - `search`: Find tasks matching keyword in title or description.
    - `sort`: Sort results by `dueDate_desc` (newest first), `createdAt_desc` (creation date descending), or `priority_desc` (priority level). Defaults to `dueDate` (due date ascending).
*   **Success Response (Code 200)**:
    ```json
    {
      "status": "success",
      "results": 1,
      "data": [
        {
          "_id": "60d0fed65311236168a109cd",
          "title": "Math HW 4",
          "description": "Complete Exercises 1 to 10",
          "dueDate": "2026-07-15T00:00:00.000Z",
          "priority": "High",
          "status": "Pending",
          "category": "Assignment",
          "courseCode": "MAT101",
          "reminders": {
            "enabled": true,
            "option": "1 hour before"
          },
          "userId": "60d0fe4f5311236168a109ca",
          "createdAt": "2026-07-02T12:05:00.000Z",
          "updatedAt": "2026-07-02T12:05:00.000Z"
        }
      ]
    }
    ```

---

### 3.2 Create Task
Create a new task for the logged-in user.

*   **URL**: `/tasks`
*   **Method**: `POST`
*   **Headers**: `Authorization: Bearer <token>`
*   **Request Body**:
    ```json
    {
      "title": "Organic Chem Review",
      "dueDate": "2026-07-20T00:00:00.000Z",
      "priority": "Medium",
      "category": "Exam",
      "courseCode": "CHM202",
      "description": "Review chapters 1-4",
      "reminders": {
        "enabled": true,
        "option": "1 day before"
      }
    }
    ```
*   **Success Response (Code 201)**:
    ```json
    {
      "status": "success",
      "message": "Task created successfully",
      "data": {
        "_id": "60d0ff8a5311236168a109cf",
        "title": "Organic Chem Review",
        "dueDate": "2026-07-20T00:00:00.000Z",
        "priority": "Medium",
        "status": "Pending",
        "category": "Exam",
        "courseCode": "CHM202",
        "reminders": {
          "enabled": true,
          "option": "1 day before"
        },
        "userId": "60d0fe4f5311236168a109ca",
        "createdAt": "2026-07-02T12:10:00.000Z",
        "updatedAt": "2026-07-02T12:10:00.000Z"
      }
    }
    ```

---

### 3.3 Update Task
Update task details.

*   **URL**: `/tasks/:id`
*   **Method**: `PUT`
*   **Headers**: `Authorization: Bearer <token>`
*   **Request Body**:
    ```json
    {
      "status": "Completed"
    }
    ```
*   **Success Response (Code 200)**:
    ```json
    {
      "status": "success",
      "message": "Task updated successfully",
      "data": {
        "_id": "60d0ff8a5311236168a109cf",
        "title": "Organic Chem Review",
        "dueDate": "2026-07-20T00:00:00.000Z",
        "priority": "Medium",
        "status": "Completed",
        "category": "Exam",
        "courseCode": "CHM202",
        "reminders": {
          "enabled": true,
          "option": "1 day before"
        },
        "userId": "60d0fe4f5311236168a109ca",
        "createdAt": "2026-07-02T12:10:00.000Z",
        "updatedAt": "2026-07-02T12:12:00.000Z"
      }
    }
    ```

---

### 3.4 Delete Task
Delete a single task.

*   **URL**: `/tasks/:id`
*   **Method**: `DELETE`
*   **Headers**: `Authorization: Bearer <token>`
*   **Success Response (Code 200)**:
    ```json
    {
      "status": "success",
      "message": "Task deleted successfully"
    }
    ```

---

### 3.5 Bulk Status Update
Update the status of multiple tasks at once.

*   **URL**: `/tasks/bulk-status`
*   **Method**: `POST`
*   **Headers**: `Authorization: Bearer <token>`
*   **Request Body**:
    ```json
    {
      "ids": ["60d0fed65311236168a109cd", "60d0ff8a5311236168a109cf"],
      "status": "Completed"
    }
    ```
*   **Success Response (Code 200)**:
    ```json
    {
      "status": "success",
      "message": "2 tasks updated to Completed successfully"
    }
    ```

---

### 3.6 Bulk Delete Tasks
Delete multiple tasks at once.

*   **URL**: `/tasks/bulk-delete`
*   **Method**: `POST`
*   **Headers**: `Authorization: Bearer <token>`
*   **Request Body**:
    ```json
    {
      "ids": ["60d0fed65311236168a109cd", "60d0ff8a5311236168a109cf"]
    }
    ```
*   **Success Response (Code 200)**:
    ```json
    {
      "status": "success",
      "message": "2 tasks deleted successfully"
    }
    ```
