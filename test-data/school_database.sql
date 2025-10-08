-- ============================================
-- School Database Setup Script
-- Purpose: Create and populate a test database for AI SQL Assistant
-- Database: PostgreSQL
-- Created: October 2025
-- ============================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- ============================================
-- Table: departments
-- Description: Academic departments in the school
-- ============================================
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    building VARCHAR(50),
    budget DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: teachers
-- Description: Faculty members teaching courses
-- ============================================
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: students
-- Description: Students enrolled in the school
-- ============================================
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE NOT NULL,
    enrollment_date DATE NOT NULL,
    graduation_year INTEGER,
    gpa DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: courses
-- Description: Courses offered by the school
-- ============================================
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    credits INTEGER NOT NULL,
    semester VARCHAR(20) NOT NULL,
    academic_year INTEGER NOT NULL,
    max_students INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: enrollments
-- Description: Student course enrollments
-- ============================================
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
    final_grade VARCHAR(2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- ============================================
-- Table: assignments
-- Description: Assignments for each course
-- ============================================
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    max_points INTEGER NOT NULL,
    assignment_type VARCHAR(50) NOT NULL CHECK (assignment_type IN ('homework', 'quiz', 'exam', 'project', 'lab')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: grades
-- Description: Student grades for assignments
-- ============================================
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    points_earned DECIMAL(5, 2) NOT NULL,
    submission_date TIMESTAMP,
    graded_date TIMESTAMP,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, assignment_id)
);

-- ============================================
-- POPULATE DATABASE WITH TEST DATA
-- ============================================

-- Insert Departments
INSERT INTO departments (name, building, budget) VALUES
('Mathematics', 'Science Building A', 250000.00),
('Computer Science', 'Technology Center', 500000.00),
('English', 'Humanities Hall', 180000.00),
('Science', 'Science Building B', 350000.00),
('History', 'Humanities Hall', 150000.00),
('Art', 'Creative Arts Center', 120000.00);

-- Insert Teachers
INSERT INTO teachers (first_name, last_name, email, phone, department_id, hire_date, salary) VALUES
('John', 'Smith', 'john.smith@school.edu', '555-0101', 1, '2015-08-15', 75000.00),
('Emily', 'Johnson', 'emily.johnson@school.edu', '555-0102', 2, '2017-09-01', 85000.00),
('Michael', 'Williams', 'michael.williams@school.edu', '555-0103', 3, '2014-08-20', 70000.00),
('Sarah', 'Brown', 'sarah.brown@school.edu', '555-0104', 4, '2016-09-05', 78000.00),
('David', 'Jones', 'david.jones@school.edu', '555-0105', 1, '2018-08-25', 72000.00),
('Jennifer', 'Garcia', 'jennifer.garcia@school.edu', '555-0106', 2, '2019-09-10', 82000.00),
('Robert', 'Martinez', 'robert.martinez@school.edu', '555-0107', 5, '2013-08-15', 68000.00),
('Lisa', 'Anderson', 'lisa.anderson@school.edu', '555-0108', 6, '2020-09-01', 65000.00);

-- Insert Students
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, enrollment_date, graduation_year, gpa) VALUES
('Alice', 'Cooper', 'alice.cooper@student.edu', '555-1001', '2006-03-15', '2022-09-01', 2026, 3.85),
('Bob', 'Wilson', 'bob.wilson@student.edu', '555-1002', '2006-07-22', '2022-09-01', 2026, 3.62),
('Charlie', 'Davis', 'charlie.davis@student.edu', '555-1003', '2005-11-08', '2022-09-01', 2026, 3.91),
('Diana', 'Miller', 'diana.miller@student.edu', '555-1004', '2006-01-30', '2022-09-01', 2026, 3.45),
('Ethan', 'Moore', 'ethan.moore@student.edu', '555-1005', '2006-05-14', '2022-09-01', 2026, 3.78),
('Fiona', 'Taylor', 'fiona.taylor@student.edu', '555-1006', '2006-09-03', '2022-09-01', 2026, 3.95),
('George', 'Thomas', 'george.thomas@student.edu', '555-1007', '2007-02-18', '2023-09-01', 2027, 3.55),
('Hannah', 'Jackson', 'hannah.jackson@student.edu', '555-1008', '2007-06-25', '2023-09-01', 2027, 3.72),
('Ian', 'White', 'ian.white@student.edu', '555-1009', '2007-10-12', '2023-09-01', 2027, 3.68),
('Julia', 'Harris', 'julia.harris@student.edu', '555-1010', '2007-04-07', '2023-09-01', 2027, 3.88),
('Kevin', 'Martin', 'kevin.martin@student.edu', '555-1011', '2008-01-20', '2024-09-01', 2028, 3.50),
('Laura', 'Thompson', 'laura.thompson@student.edu', '555-1012', '2008-08-15', '2024-09-01', 2028, 3.65),
('Marcus', 'Lee', 'marcus.lee@student.edu', '555-1013', '2008-03-28', '2024-09-01', 2028, 3.82),
('Nina', 'Walker', 'nina.walker@student.edu', '555-1014', '2008-11-05', '2024-09-01', 2028, 3.75),
('Oscar', 'Hall', 'oscar.hall@student.edu', '555-1015', '2008-07-19', '2024-09-01', 2028, 3.58);

-- Insert Courses (Fall 2025)
INSERT INTO courses (course_code, course_name, department_id, teacher_id, credits, semester, academic_year, max_students) VALUES
('MATH101', 'Algebra I', 1, 1, 3, 'Fall', 2025, 30),
('MATH201', 'Calculus I', 1, 5, 4, 'Fall', 2025, 25),
('CS101', 'Introduction to Programming', 2, 2, 4, 'Fall', 2025, 30),
('CS201', 'Data Structures', 2, 6, 4, 'Fall', 2025, 25),
('ENG101', 'English Composition', 3, 3, 3, 'Fall', 2025, 30),
('SCI101', 'Biology I', 4, 4, 4, 'Fall', 2025, 28),
('SCI201', 'Chemistry I', 4, 4, 4, 'Fall', 2025, 28),
('HIST101', 'World History', 5, 7, 3, 'Fall', 2025, 35),
('ART101', 'Introduction to Art', 6, 8, 3, 'Fall', 2025, 20),
('MATH102', 'Geometry', 1, 1, 3, 'Fall', 2025, 30);

-- Insert Enrollments
INSERT INTO enrollments (student_id, course_id, enrollment_date, status, final_grade) VALUES
-- Alice (Student 1)
(1, 2, '2025-09-01', 'active', NULL),
(1, 4, '2025-09-01', 'active', NULL),
(1, 5, '2025-09-01', 'active', NULL),
(1, 7, '2025-09-01', 'active', NULL),
-- Bob (Student 2)
(2, 1, '2025-09-01', 'active', NULL),
(2, 3, '2025-09-01', 'active', NULL),
(2, 5, '2025-09-01', 'active', NULL),
(2, 8, '2025-09-01', 'active', NULL),
-- Charlie (Student 3)
(3, 2, '2025-09-01', 'active', NULL),
(3, 4, '2025-09-01', 'active', NULL),
(3, 6, '2025-09-01', 'active', NULL),
(3, 9, '2025-09-01', 'active', NULL),
-- Diana (Student 4)
(4, 1, '2025-09-01', 'active', NULL),
(4, 3, '2025-09-01', 'active', NULL),
(4, 5, '2025-09-01', 'active', NULL),
(4, 6, '2025-09-01', 'active', NULL),
-- Ethan (Student 5)
(5, 2, '2025-09-01', 'active', NULL),
(5, 3, '2025-09-01', 'active', NULL),
(5, 7, '2025-09-01', 'active', NULL),
(5, 8, '2025-09-01', 'active', NULL),
-- Fiona (Student 6)
(6, 2, '2025-09-01', 'active', NULL),
(6, 4, '2025-09-01', 'active', NULL),
(6, 6, '2025-09-01', 'active', NULL),
(6, 9, '2025-09-01', 'active', NULL),
-- George (Student 7)
(7, 1, '2025-09-01', 'active', NULL),
(7, 3, '2025-09-01', 'active', NULL),
(7, 5, '2025-09-01', 'active', NULL),
(7, 8, '2025-09-01', 'active', NULL),
-- Hannah (Student 8)
(8, 2, '2025-09-01', 'active', NULL),
(8, 3, '2025-09-01', 'active', NULL),
(8, 6, '2025-09-01', 'active', NULL),
(8, 7, '2025-09-01', 'active', NULL),
-- Ian (Student 9)
(9, 1, '2025-09-01', 'active', NULL),
(9, 4, '2025-09-01', 'active', NULL),
(9, 5, '2025-09-01', 'active', NULL),
(9, 6, '2025-09-01', 'active', NULL),
-- Julia (Student 10)
(10, 2, '2025-09-01', 'active', NULL),
(10, 3, '2025-09-01', 'active', NULL),
(10, 7, '2025-09-01', 'active', NULL),
(10, 9, '2025-09-01', 'active', NULL);

-- Insert Assignments for CS101 (Course 3)
INSERT INTO assignments (course_id, title, description, due_date, max_points, assignment_type) VALUES
(3, 'Hello World Program', 'Write your first program', '2025-09-15', 10, 'homework'),
(3, 'Variables and Data Types', 'Practice with variables', '2025-09-22', 20, 'homework'),
(3, 'Midterm Quiz', 'Covers chapters 1-5', '2025-10-15', 50, 'quiz'),
(3, 'Final Project', 'Build a simple calculator', '2025-12-10', 100, 'project');

-- Insert Assignments for MATH201 (Course 2)
INSERT INTO assignments (course_id, title, description, due_date, max_points, assignment_type) VALUES
(2, 'Limits Practice', 'Calculate limits problems', '2025-09-18', 25, 'homework'),
(2, 'Derivatives Quiz', 'Basic derivatives', '2025-10-05', 40, 'quiz'),
(2, 'Integration Problems', 'Practice integration', '2025-11-08', 30, 'homework'),
(2, 'Final Exam', 'Comprehensive calculus exam', '2025-12-15', 100, 'exam');

-- Insert Assignments for ENG101 (Course 5)
INSERT INTO assignments (course_id, title, description, due_date, max_points, assignment_type) VALUES
(5, 'Essay 1: Personal Narrative', 'Write about a significant experience', '2025-09-25', 50, 'homework'),
(5, 'Grammar Quiz', 'Test on grammar rules', '2025-10-10', 30, 'quiz'),
(5, 'Research Paper', 'Choose a topic and research', '2025-11-20', 100, 'project'),
(5, 'Final Essay', 'Argumentative essay', '2025-12-12', 75, 'exam');

-- Insert Grades (Sample data for some students)
-- Alice's grades (enrollment_id 1-4)
INSERT INTO grades (enrollment_id, assignment_id, points_earned, submission_date, graded_date, feedback) VALUES
(1, 5, 23.0, '2025-09-18 14:30:00', '2025-09-20 10:00:00', 'Good work on limits!'),
(1, 6, 38.0, '2025-10-05 15:45:00', '2025-10-07 09:30:00', 'Excellent understanding of derivatives'),
(3, 9, 48.0, '2025-09-25 16:20:00', '2025-09-28 11:00:00', 'Well-written narrative');

-- Bob's grades (enrollment_id 5-8)
INSERT INTO grades (enrollment_id, assignment_id, points_earned, submission_date, graded_date, feedback) VALUES
(6, 1, 9.0, '2025-09-15 13:15:00', '2025-09-16 10:00:00', 'Perfect!'),
(6, 2, 18.0, '2025-09-22 14:00:00', '2025-09-23 09:00:00', 'Good job'),
(6, 3, 45.0, '2025-10-15 15:30:00', '2025-10-18 10:00:00', 'Strong performance'),
(7, 9, 42.0, '2025-09-25 17:00:00', '2025-09-28 11:00:00', 'Good effort, work on structure');

-- Charlie's grades (enrollment_id 9-12)
INSERT INTO grades (enrollment_id, assignment_id, points_earned, submission_date, graded_date, feedback) VALUES
(9, 5, 25.0, '2025-09-18 12:00:00', '2025-09-20 10:00:00', 'Perfect work!'),
(9, 6, 40.0, '2025-10-05 14:30:00', '2025-10-07 09:30:00', 'Excellent!'),
(10, 1, 10.0, '2025-09-15 10:00:00', '2025-09-16 10:00:00', 'Outstanding!');

-- ============================================
-- CREATE USEFUL VIEWS
-- ============================================

-- View: Student Course Performance
CREATE VIEW student_course_performance AS
SELECT 
    s.id as student_id,
    s.first_name || ' ' || s.last_name as student_name,
    c.course_code,
    c.course_name,
    COUNT(g.id) as assignments_completed,
    AVG(g.points_earned / a.max_points * 100) as average_percentage,
    e.status as enrollment_status
FROM students s
JOIN enrollments e ON s.id = e.student_id
JOIN courses c ON e.course_id = c.id
LEFT JOIN grades g ON e.id = g.enrollment_id
LEFT JOIN assignments a ON g.assignment_id = a.id
GROUP BY s.id, s.first_name, s.last_name, c.course_code, c.course_name, e.status;

-- View: Teacher Course Load
CREATE VIEW teacher_course_load AS
SELECT 
    t.id as teacher_id,
    t.first_name || ' ' || t.last_name as teacher_name,
    d.name as department_name,
    COUNT(DISTINCT c.id) as total_courses,
    COUNT(e.id) as total_students
FROM teachers t
JOIN departments d ON t.department_id = d.id
LEFT JOIN courses c ON t.id = c.teacher_id
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY t.id, t.first_name, t.last_name, d.name;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_students_graduation_year ON students(graduation_year);
CREATE INDEX idx_courses_semester_year ON courses(semester, academic_year);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_grades_enrollment ON grades(enrollment_id);
CREATE INDEX idx_assignments_course ON assignments(course_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Display summary statistics
SELECT 'Database Setup Complete!' as message;
SELECT 'Departments: ' || COUNT(*) as count FROM departments;
SELECT 'Teachers: ' || COUNT(*) as count FROM teachers;
SELECT 'Students: ' || COUNT(*) as count FROM students;
SELECT 'Courses: ' || COUNT(*) as count FROM courses;
SELECT 'Enrollments: ' || COUNT(*) as count FROM enrollments;
SELECT 'Assignments: ' || COUNT(*) as count FROM assignments;
SELECT 'Grades: ' || COUNT(*) as count FROM grades;

-- ============================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================

/*
-- Test Query 1: Get all students with their GPA
SELECT first_name, last_name, email, gpa 
FROM students 
ORDER BY gpa DESC;

-- Test Query 2: Show course enrollments
SELECT 
    s.first_name || ' ' || s.last_name as student,
    c.course_code,
    c.course_name,
    t.first_name || ' ' || t.last_name as teacher
FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
JOIN teachers t ON c.teacher_id = t.id
ORDER BY s.last_name, c.course_code;

-- Test Query 3: Average grade by course
SELECT 
    c.course_code,
    c.course_name,
    COUNT(DISTINCT e.student_id) as enrolled_students,
    AVG(g.points_earned / a.max_points * 100) as average_grade
FROM courses c
JOIN enrollments e ON c.id = e.course_id
LEFT JOIN grades g ON e.id = g.enrollment_id
LEFT JOIN assignments a ON g.assignment_id = a.id
GROUP BY c.id, c.course_code, c.course_name;

-- Test Query 4: Students with no grades yet
SELECT 
    s.first_name || ' ' || s.last_name as student,
    COUNT(e.id) as courses_enrolled,
    COUNT(g.id) as assignments_completed
FROM students s
JOIN enrollments e ON s.id = e.student_id
LEFT JOIN grades g ON e.id = g.enrollment_id
GROUP BY s.id, s.first_name, s.last_name
HAVING COUNT(g.id) = 0;

-- Test Query 5: Teacher workload
SELECT 
    t.first_name || ' ' || t.last_name as teacher,
    d.name as department,
    COUNT(DISTINCT c.id) as courses_teaching,
    COUNT(e.id) as total_students
FROM teachers t
JOIN departments d ON t.department_id = d.id
LEFT JOIN courses c ON t.id = c.teacher_id
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY t.id, t.first_name, t.last_name, d.name
ORDER BY total_students DESC;
*/
