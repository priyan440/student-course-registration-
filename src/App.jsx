import { useEffect, useMemo, useState } from "react";

const initialCourses = [
  {
    id: 1,
    code: "CS301",
    name: "Advanced Java Programming",
    faculty: "Dr. Priya Kumar",
    department: "Computer Science",
    credits: 4,
    capacity: 40,
    registered: 28,
    schedule: "Mon & Wed · 10:00 AM",
    room: "Lab 204"
  },
  {
    id: 2,
    code: "CS305",
    name: "Web Technology",
    faculty: "Mr. Arun Raj",
    department: "Computer Science",
    credits: 3,
    capacity: 35,
    registered: 31,
    schedule: "Tue & Thu · 11:00 AM",
    room: "Lab 108"
  },
  {
    id: 3,
    code: "CS310",
    name: "Database Management Systems",
    faculty: "Dr. Meena S",
    department: "Computer Science",
    credits: 4,
    capacity: 45,
    registered: 22,
    schedule: "Mon & Fri · 02:00 PM",
    room: "Room 302"
  },
  {
    id: 4,
    code: "CS315",
    name: "Computer Networks",
    faculty: "Mr. Karthik V",
    department: "Information Technology",
    credits: 3,
    capacity: 30,
    registered: 30,
    schedule: "Wed & Fri · 09:00 AM",
    room: "Room 201"
  },
  {
    id: 5,
    code: "CS320",
    name: "Cloud Computing",
    faculty: "Dr. Nisha P",
    department: "Information Technology",
    credits: 3,
    capacity: 40,
    registered: 16,
    schedule: "Tue & Thu · 03:00 PM",
    room: "Lab 301"
  }
];

const initialRegistrations = [
  { id: 101, student: "Arun Kumar", rollNo: "23CS101", courseId: 1 },
  { id: 102, student: "Priya S", rollNo: "23CS115", courseId: 2 },
  { id: 103, student: "Vishnu Raj", rollNo: "23CS122", courseId: 3 }
];

const blankForm = {
  code: "",
  name: "",
  faculty: "",
  department: "Computer Science",
  credits: 3,
  capacity: 30,
  schedule: "",
  room: ""
};

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [courses, setCourses] = useState(() => load("coursehub_courses", initialCourses));
  const [registrations, setRegistrations] = useState(() =>
    load("coursehub_registrations", initialRegistrations)
  );
  const [activeTab, setActiveTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem("coursehub_courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem("coursehub_registrations", JSON.stringify(registrations));
  }, [registrations]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const departments = ["All", ...new Set(courses.map((c) => c.department))];

  const filteredCourses = useMemo(() => {
    const q = search.toLowerCase().trim();
    return courses.filter((course) => {
      const matchesSearch =
        !q ||
        course.code.toLowerCase().includes(q) ||
        course.name.toLowerCase().includes(q) ||
        course.faculty.toLowerCase().includes(q);
      const matchesDepartment =
        department === "All" || course.department === department;
      return matchesSearch && matchesDepartment;
    });
  }, [courses, search, department]);

  const totalCapacity = courses.reduce((sum, c) => sum + Number(c.capacity), 0);
  const totalRegistered = courses.reduce((sum, c) => sum + Number(c.registered), 0);
  const availableSeats = Math.max(totalCapacity - totalRegistered, 0);
  const occupancy = totalCapacity
    ? Math.round((totalRegistered / totalCapacity) * 100)
    : 0;

  function notify(message) {
    setToast(message);
  }

  function openCreate() {
    setEditingId(null);
    setForm(blankForm);
    setModal("course");
  }

  function openEdit(course) {
    setEditingId(course.id);
    setForm({ ...course });
    setModal("course");
  }

  function saveCourse(event) {
    event.preventDefault();

    if (!form.code.trim() || !form.name.trim() || !form.faculty.trim()) {
      notify("Please fill all required fields.");
      return;
    }

    const capacity = Number(form.capacity);
    const credits = Number(form.credits);

    if (capacity < 1 || credits < 1) {
      notify("Capacity and credits must be positive.");
      return;
    }

    if (editingId) {
      setCourses((current) =>
        current.map((course) =>
          course.id === editingId
            ? {
                ...course,
                ...form,
                capacity,
                credits,
                registered: Math.min(course.registered, capacity)
              }
            : course
        )
      );
      notify("Course updated successfully.");
    } else {
      const exists = courses.some(
        (course) => course.code.toLowerCase() === form.code.trim().toLowerCase()
      );
      if (exists) {
        notify("Course code already exists.");
        return;
      }

      setCourses((current) => [
        ...current,
        {
          ...form,
          id: Date.now(),
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          faculty: form.faculty.trim(),
          capacity,
          credits,
          registered: 0
        }
      ]);
      notify("Course created successfully.");
    }

    setModal(null);
  }

  function deleteCourse(id) {
    const course = courses.find((item) => item.id === id);
    if (!course) return;

    if (course.registered > 0) {
      notify("Cannot delete a course with active registrations.");
      return;
    }

    if (!window.confirm(`Delete ${course.name}?`)) return;

    setCourses((current) => current.filter((item) => item.id !== id));
    notify("Course deleted.");
  }

  function registerStudent(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const student = data.get("student").trim();
    const rollNo = data.get("rollNo").trim().toUpperCase();
    const courseId = Number(data.get("courseId"));
    const course = courses.find((item) => item.id === courseId);

    if (!student || !rollNo || !course) {
      notify("Enter valid student details.");
      return;
    }

    if (course.registered >= course.capacity) {
      notify("This course is full.");
      return;
    }

    const duplicate = registrations.some(
      (item) =>
        item.rollNo.toLowerCase() === rollNo.toLowerCase() &&
        item.courseId === courseId
    );

    if (duplicate) {
      notify("Student is already registered for this course.");
      return;
    }

    setRegistrations((current) => [
      ...current,
      { id: Date.now(), student, rollNo, courseId }
    ]);
    setCourses((current) =>
      current.map((item) =>
        item.id === courseId
          ? { ...item, registered: item.registered + 1 }
          : item
      )
    );
    event.currentTarget.reset();
    notify("Student registered successfully.");
  }

  function dropRegistration(id) {
    const registration = registrations.find((item) => item.id === id);
    if (!registration) return;

    if (!window.confirm(`Drop ${registration.student}'s registration?`)) return;

    setRegistrations((current) => current.filter((item) => item.id !== id));
    setCourses((current) =>
      current.map((course) =>
        course.id === registration.courseId
          ? { ...course, registered: Math.max(course.registered - 1, 0) }
          : course
      )
    );
    notify("Registration dropped.");
  }

  function resetDemoData() {
    if (!window.confirm("Reset all data to the original demo data?")) return;
    setCourses(initialCourses);
    setRegistrations(initialRegistrations);
    notify("Demo data restored.");
  }

  const navItems = [
    ["dashboard", "Dashboard", "⌂"],
    ["courses", "Courses", "▦"],
    ["registrations", "Registrations", "✓"]
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>CourseHub</strong>
            <span>Academic Portal</span>
          </div>
        </div>

        <nav>
          {navItems.map(([id, label, icon]) => (
            <button
              key={id}
              className={activeTab === id ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab(id)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-card">
            <span className="mini-dot" />
            <div>
              <strong>System Online</strong>
              <small>Local data storage</small>
            </div>
          </div>
          <button className="reset-btn" onClick={resetDemoData}>
            ↻ Reset demo data
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">STUDENT SERVICES</p>
            <h1>
              {activeTab === "dashboard"
                ? "Course Registration"
                : activeTab === "courses"
                ? "Course Management"
                : "Student Registrations"}
            </h1>
          </div>
          <div className="profile">
            <div className="avatar">AD</div>
            <div>
              <strong>Admin</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {activeTab === "dashboard" && (
          <>
            <section className="hero">
              <div>
                <span className="hero-tag">ACADEMIC YEAR 2026–27</span>
                <h2>Manage courses with clarity.</h2>
                <p>
                  Create courses, monitor capacity and manage student
                  registrations from one simple dashboard.
                </p>
                <button className="primary-btn" onClick={openCreate}>
                  + Add New Course
                </button>
              </div>
              <div className="hero-art">
                <div className="art-circle circle-one" />
                <div className="art-circle circle-two" />
                <div className="art-card">
                  <span>LIVE CAPACITY</span>
                  <strong>{occupancy}%</strong>
                  <small>overall occupancy</small>
                </div>
              </div>
            </section>

            <section className="stats-grid">
              <Stat title="Total Courses" value={courses.length} icon="▦" />
              <Stat title="Registered Students" value={totalRegistered} icon="✓" />
              <Stat title="Available Seats" value={availableSeats} icon="○" />
              <Stat title="Occupancy Rate" value={`${occupancy}%`} icon="↗" />
            </section>

            <section className="content-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">OVERVIEW</p>
                  <h3>Course capacity</h3>
                </div>
                <button className="text-btn" onClick={() => setActiveTab("courses")}>
                  View all →
                </button>
              </div>

              <div className="capacity-list">
                {courses.slice(0, 5).map((course) => {
                  const percent = Math.round(
                    (course.registered / course.capacity) * 100
                  );
                  return (
                    <div className="capacity-row" key={course.id}>
                      <div className="course-avatar">{course.code.slice(0, 2)}</div>
                      <div className="capacity-info">
                        <strong>{course.name}</strong>
                        <span>
                          {course.code} · {course.faculty}
                        </span>
                      </div>
                      <div className="progress-wrap">
                        <div className="progress">
                          <div
                            className="progress-bar"
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                        <small>
                          {course.registered}/{course.capacity}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeTab === "courses" && (
          <section>
            <div className="toolbar">
              <div className="search-box">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by course, code or faculty..."
                />
              </div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {departments.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <button className="primary-btn" onClick={openCreate}>
                + Add Course
              </button>
            </div>

            <div className="course-grid">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={() => openEdit(course)}
                  onDelete={() => deleteCourse(course.id)}
                  onRegister={() => {
                    setActiveTab("registrations");
                    setTimeout(() => {
                      const select = document.getElementById("registration-course");
                      if (select) select.value = String(course.id);
                    }, 0);
                  }}
                />
              ))}
            </div>

            {!filteredCourses.length && (
              <div className="empty-state">
                <div>⌕</div>
                <h3>No courses found</h3>
                <p>Try another search or add a new course.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === "registrations" && (
          <section className="registration-layout">
            <div className="content-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">NEW REGISTRATION</p>
                  <h3>Register a student</h3>
                </div>
              </div>
              <form className="registration-form" onSubmit={registerStudent}>
                <label>
                  Student Name
                  <input name="student" required placeholder="e.g. Arun Kumar" />
                </label>
                <label>
                  Register Number
                  <input name="rollNo" required placeholder="e.g. 23CS101" />
                </label>
                <label>
                  Course
                  <select id="registration-course" name="courseId" required>
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option
                        key={course.id}
                        value={course.id}
                        disabled={course.registered >= course.capacity}
                      >
                        {course.code} — {course.name}
                        {course.registered >= course.capacity ? " (Full)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary-btn full" type="submit">
                  Register Student
                </button>
              </form>
            </div>

            <div className="content-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">RECORDS</p>
                  <h3>Recent registrations</h3>
                </div>
                <span className="count-pill">{registrations.length}</span>
              </div>

              <div className="registration-list">
                {registrations.map((registration) => {
                  const course = courses.find((item) => item.id === registration.courseId);
                  return (
                    <div className="registration-item" key={registration.id}>
                      <div className="student-avatar">
                        {registration.student
                          .split(" ")
                          .map((word) => word[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="student-info">
                        <strong>{registration.student}</strong>
                        <span>
                          {registration.rollNo} · {course?.code || "Deleted course"}
                        </span>
                      </div>
                      <button
                        className="danger-link"
                        onClick={() => dropRegistration(registration.id)}
                      >
                        Drop
                      </button>
                    </div>
                  );
                })}
              </div>

              {!registrations.length && (
                <div className="small-empty">No registrations yet.</div>
              )}
            </div>
          </section>
        )}
      </main>

      {modal === "course" && (
        <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">{editingId ? "UPDATE" : "CREATE"}</p>
                <h2>{editingId ? "Edit Course" : "Add New Course"}</h2>
              </div>
              <button className="close-btn" onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            <form className="course-form" onSubmit={saveCourse}>
              <label>
                Course Code *
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="CS401"
                  required
                />
              </label>
              <label>
                Course Name *
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Software Engineering"
                  required
                />
              </label>
              <label>
                Faculty *
                <input
                  value={form.faculty}
                  onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                  placeholder="Dr. Faculty Name"
                  required
                />
              </label>
              <label>
                Department
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option>Computer Science</option>
                  <option>Information Technology</option>
                  <option>Electronics</option>
                  <option>Management</option>
                </select>
              </label>
              <label>
                Credits
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: e.target.value })}
                />
              </label>
              <label>
                Capacity
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </label>
              <label>
                Schedule
                <input
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  placeholder="Mon & Wed · 10:00 AM"
                />
              </label>
              <label>
                Room
                <input
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  placeholder="Room 204"
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button className="primary-btn" type="submit">
                  {editingId ? "Save Changes" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function CourseCard({ course, onEdit, onDelete, onRegister }) {
  const percent = Math.round((course.registered / course.capacity) * 100);
  const full = course.registered >= course.capacity;
  const almostFull = percent >= 80 && !full;

  return (
    <article className="course-card">
      <div className="course-card-top">
        <span className="course-code">{course.code}</span>
        <span className={`status ${full ? "full" : almostFull ? "warning" : "open"}`}>
          {full ? "Full" : almostFull ? "Almost full" : "Open"}
        </span>
      </div>

      <h3>{course.name}</h3>
      <p className="faculty">{course.faculty}</p>

      <div className="course-meta">
        <span>◷ {course.schedule || "Schedule TBD"}</span>
        <span>⌂ {course.room || "Room TBD"}</span>
        <span>◆ {course.credits} credits</span>
      </div>

      <div className="card-capacity">
        <div>
          <span>Enrollment</span>
          <strong>
            {course.registered} / {course.capacity}
          </strong>
        </div>
        <div className="progress">
          <div
            className="progress-bar"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>

      <div className="card-actions">
        <button className="outline-btn" onClick={onEdit}>
          Edit
        </button>
        <button className="outline-btn danger" onClick={onDelete}>
          Delete
        </button>
        <button className="primary-small" disabled={full} onClick={onRegister}>
          {full ? "Full" : "Register"}
        </button>
      </div>
    </article>
  );
}

export default App;