CREATE DATABASE IF NOT EXISTS bytequest_db;
USE bytequest_db;

-- 1. Users Table (Supports Admin, Instructor, and Student)
CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'instructor', 'student') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_email (email)
);

-- 2. Classrooms Table (Created by Instructors with a unique Join Code)
CREATE TABLE classrooms (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    instructor_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(50) NOT NULL, -- e.g., 'cpp', 'python', 'java'
    join_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_join_code (join_code),
    CONSTRAINT fk_classroom_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Classroom Members (Enrollment mapping students to classrooms)
CREATE TABLE classroom_members (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    classroom_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_room_student (classroom_id, student_id),
    CONSTRAINT fk_member_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_member_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Activities Table (Quizzes, Reviewers, Coding Challenges)
CREATE TABLE activities (
    id VARCHAR(50) NOT NULL,
    classroom_id INT UNSIGNED DEFAULT NULL,
    subject VARCHAR(50) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    concept VARCHAR(255) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    content JSON NOT NULL,
    test_cases JSON DEFAULT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_activity_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

-- 5. Submissions & Telemetry for ML pipeline
CREATE TABLE submissions (
    id VARCHAR(50) NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    activity_id VARCHAR(50) NOT NULL,
    code_submitted TEXT,
    score_pct DECIMAL(5,2) DEFAULT 0.00,
    is_success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_sub_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE telemetry_features (
    id VARCHAR(50) NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    task_id VARCHAR(50) NOT NULL,
    language VARCHAR(50) NOT NULL,
    prior_quiz_accuracy DECIMAL(4,3) NOT NULL,
    avg_solve_time_seconds DECIMAL(6,2) NOT NULL,
    compilation_error_count INT DEFAULT 0,
    attempts_before_success INT DEFAULT 1,
    hints_requested_count INT DEFAULT 0,
    task_difficulty_level INT DEFAULT 2,
    target_task_success INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);