import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// ------------------------------------------------------------------
// ส่วนนี้คือโค้ด Firebase Configuration ของคุณ (แก้ไขแล้ว)
// **สำคัญ: ตรวจสอบให้แน่ใจว่าค่าเหล่านี้ถูกต้องจาก Firebase Console ของคุณ**
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDXEZqkXqYbU06Sr-zGWlzjZjCHrQyi8AQ",
  authDomain: "trytolean-43e13.firebaseapp.com",
  projectId: "trytolean-43e13",
  storageBucket: "trytolean-43e13.firebasestorage.app",
  messagingSenderId: "252500419143",
  appId: "1:252500419143:web:2b999907c09297fc5ac762",
  measurementId: "G-CXDZ8FGYFC",
};

// สำหรับ appId ในโค้ด React ให้ใช้ค่าจาก firebaseConfig.projectId
const appId = firebaseConfig.projectId;
// initialAuthToken ไม่ต้องใช้ใน CodeSandbox สำหรับ Anonymous Sign-in
const initialAuthToken = null; // กำหนดให้เป็น null หรือ undefined เพื่อใช้ signInAnonymously

// Firebase App and Services
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log("Firebase App initialized successfully.");
  console.log("Firebase Config:", firebaseConfig); // เพิ่ม console log เพื่อตรวจสอบ config
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // คุณอาจต้องการแสดงข้อความข้อผิดพลาดที่นี่
}

// ------------------------------------------------------------------
// สิ้นสุดส่วน Firebase Configuration
// ------------------------------------------------------------------

// Utility function to format date toYYYY-MM-DD
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Calendar Component
const Calendar = ({ events, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday...
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate(); // Last day of current month

    const days = [];
    // Add leading empty days for the calendar grid
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= lastDayOfMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  const todayFormatted = formatDate(today);

  const handlePrevMonth = () => {
    setCurrentMonth((prevMonth) => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  const getMonthName = (date) => {
    return date.toLocaleString("th-TH", { month: "long", year: "numeric" });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">
          {getMonthName(currentMonth)}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-600 mb-2">
        <div>อาทิตย์</div>
        <div>จันทร์</div>
        <div>อังคาร</div>
        <div>พุธ</div>
        <div>พฤหัสบดี</div>
        <div>ศุกร์</div>
        <div>เสาร์</div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={index} className="h-16"></div>; // Empty cell
          }
          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
          );
          const dateFormatted = formatDate(date);
          const hasEvent = events.some((event) => event.date === dateFormatted);
          const isToday = dateFormatted === todayFormatted;

          return (
            <div
              key={index}
              onClick={() => onDateClick(date)}
              className={`h-16 flex flex-col items-center justify-center rounded-lg cursor-pointer transition duration-200
                                ${
                                  isToday
                                    ? "bg-blue-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-800 hover:bg-blue-100"
                                }
                                ${hasEvent ? "border-2 border-green-500" : ""}
                            `}
            >
              <span
                className={`text-lg font-semibold ${
                  isToday ? "text-white" : ""
                }`}
              >
                {day}
              </span>
              {hasEvent && (
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Event Modal Component
const EventModal = ({
  isOpen,
  selectedDate,
  eventToEdit,
  onClose,
  onSaveEvent,
  onDeleteEvent,
}) => {
  const [eventName, setEventName] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [personName, setPersonName] = useState("");
  const [personActivity, setPersonActivity] = useState("");
  const [impact, setImpact] = useState("");
  const [impactTimeframe, setImpactTimeframe] = useState("");
  const [status, setStatus] = useState("pending");
  const [startDate, setStartDate] = useState(""); // New state for start date
  const [endDate, setEndDate] = useState(""); // New state for end date
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setEventName(eventToEdit.eventName || "");
      setTimeSlot(eventToEdit.timeSlot || "");
      setPersonName(eventToEdit.personName || "");
      setPersonActivity(eventToEdit.personActivity || "");
      setImpact(eventToEdit.impact || "");
      setImpactTimeframe(eventToEdit.impactTimeframe || "");
      setStatus(eventToEdit.status || "pending");
      setStartDate(eventToEdit.startDate || ""); // Set start date from existing event
      setEndDate(eventToEdit.endDate || ""); // Set end date from existing event
      setIsEditing(true);
    } else {
      // Reset form for new event
      setEventName("");
      setTimeSlot("");
      setPersonName("");
      setPersonActivity("");
      setImpact("");
      setImpactTimeframe("");
      setStatus("pending");
      setStartDate(formatDate(selectedDate)); // Default new event start date to selected calendar date
      setEndDate(formatDate(selectedDate)); // Default new event end date to selected calendar date
      setIsEditing(false);
    }
  }, [eventToEdit, isOpen, selectedDate]); // Reset when modal opens, eventToEdit changes, or selectedDate changes

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventData = {
      date: formatDate(selectedDate), // Keep for calendar dot, but startDate/endDate are primary for duration
      eventName,
      timeSlot,
      personName,
      personActivity,
      impact,
      impactTimeframe,
      status,
      startDate, // Include start date in event data
      endDate, // Include end date in event data
    };
    onSaveEvent(eventData, eventToEdit?.id);
    onClose();
  };

  const handleDelete = () => {
    if (eventToEdit && eventToEdit.id) {
      onDeleteEvent(eventToEdit.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          {isEditing ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรมใหม่"} สำหรับ{" "}
          {selectedDate.toLocaleDateString("th-TH")}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="eventName"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              ชื่องาน:
            </label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="personName"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              น้องชื่ออะไร:
            </label>
            <input
              type="text"
              id="personName"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="startDate"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              วันที่เริ่มต้น:
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="endDate"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              วันที่สิ้นสุด:
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="timeSlot"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              ช่วงเวลา:
            </label>
            <input
              type="text"
              id="timeSlot"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="personActivity"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              ทำงานอะไร:
            </label>
            <input
              type="text"
              id="personActivity"
              value={personActivity}
              onChange={(e) => setPersonActivity(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="impact"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              ส่งผลอย่างไร:
            </label>
            <textarea
              id="impact"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              rows="3"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          <div className="mb-6">
            <label
              htmlFor="impactTimeframe"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              ช่วงเวลาไหน (ผลกระทบ):
            </label>
            <input
              type="text"
              id="impactTimeframe"
              value={impactTimeframe}
              onChange={(e) => setImpactTimeframe(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="status"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              สถานะ:
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">รอดำเนินการ</option>
              <option value="completed">เสร็จสมบูรณ์</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
            >
              {isEditing ? "บันทึกการแก้ไข" : "เพิ่มกิจกรรม"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200"
              >
                ลบกิจกรรม
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-200"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Component to display summary for each "Nong"
const NongSummary = ({ events }) => {
  const summary = {};

  events.forEach((event) => {
    const name = event.personName || "ไม่ระบุชื่อ";
    if (!summary[name]) {
      summary[name] = { pending: 0, completed: 0 };
    }
    if (event.status === "completed") {
      summary[name].completed++;
    } else {
      summary[name].pending++;
    }
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl mx-auto w-full mt-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        ภาพรวมกิจกรรมของแต่ละบุคคล
      </h2>
      {Object.keys(summary).length === 0 ? (
        <p className="text-gray-500 text-center">
          ยังไม่มีกิจกรรมสำหรับบุคคลใดๆ
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(summary).map(([name, counts]) => (
            <div key={name} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{name}</h3>
              <p className="text-gray-700">
                <span className="font-medium text-blue-600">งานค้าง:</span>{" "}
                {counts.pending} งาน
              </p>
              <p className="text-gray-700">
                <span className="font-medium text-green-600">เสร็จแล้ว:</span>{" "}
                {counts.completed} งาน
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Gantt Chart Component
const GanttChart = ({ events }) => {
  // Filter out events without valid start and end dates
  const validEvents = events.filter(
    (event) => event.startDate && event.endDate
  );

  // Group events by personName
  const groupedEvents = validEvents.reduce((acc, event) => {
    const name = event.personName || "ไม่ระบุชื่อ";
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(event);
    return acc;
  }, {});

  // Determine the overall time range for the Gantt chart
  let minDate = new Date();
  let maxDate = new Date();

  if (validEvents.length > 0) {
    const allDates = validEvents.flatMap((event) => [
      new Date(event.startDate),
      new Date(event.endDate),
    ]);
    minDate = new Date(Math.min(...allDates));
    maxDate = new Date(Math.max(...allDates));
  }

  // Adjust minDate to the start of its week and maxDate to the end of its week
  minDate.setDate(minDate.getDate() - minDate.getDay()); // Go to Sunday of the start week
  maxDate.setDate(maxDate.getDate() + (6 - maxDate.getDay())); // Go to Saturday of the end week

  // Extend the maxDate by a few weeks to ensure future events have space
  maxDate.setDate(maxDate.getDate() + 21); // Add 3 more weeks

  // Generate week headers for the timeline
  const weekHeaders = [];
  let currentWeekStart = new Date(minDate);
  while (currentWeekStart <= maxDate) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6); // แก้ไขจาก weekWeek.getDate() เป็น currentWeekStart.getDate()
    weekHeaders.push(
      `${currentWeekStart.getMonth() + 1}/${currentWeekStart.getDate()} - ${
        weekEnd.getMonth() + 1
      }/${weekEnd.getDate()}`
    );
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  // Define a fixed width for each week column (e.g., 100px)
  const WEEK_COLUMN_WIDTH = 100; // pixels

  // Calculate total width of the timeline
  const totalWeeks = weekHeaders.length;
  const timelineWidth = totalWeeks * WEEK_COLUMN_WIDTH;

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl mx-auto w-full mt-8 overflow-x-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Gantt Chart (ภาพรวมระยะเวลางานรายสัปดาห์)
      </h2>
      {Object.keys(groupedEvents).length === 0 ? (
        <p className="text-gray-500 text-center">
          ไม่มีกิจกรรมที่มีวันที่เริ่มต้นและสิ้นสุด
        </p>
      ) : (
        <div
          className="min-w-full"
          style={{ width: `${timelineWidth + 192}px` }}
        >
          {" "}
          {/* Add width for person/task column */}
          {/* Week Headers */}
          <div className="flex border-b border-gray-300 pb-2 mb-2">
            <div className="w-48 flex-shrink-0 font-bold text-gray-700">
              บุคคล / งาน
            </div>
            <div className="flex-grow flex">
              {weekHeaders.map((week, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 text-center font-bold text-gray-700 text-xs"
                  style={{ width: `${WEEK_COLUMN_WIDTH}px` }}
                >
                  {week}
                </div>
              ))}
            </div>
          </div>
          {/* Events Timeline */}
          {Object.entries(groupedEvents).map(([personName, personEvents]) => (
            <div key={personName} className="mb-4">
              <h3 className="font-bold text-lg text-gray-800 mb-2">
                {personName}
              </h3>
              {personEvents.map((event) => {
                const eventStartDate = new Date(event.startDate);
                const eventEndDate = new Date(event.endDate);

                const startOffsetDays =
                  (eventStartDate.getTime() - minDate.getTime()) /
                  (1000 * 60 * 60 * 24);
                const durationDays =
                  (eventEndDate.getTime() - eventStartDate.getTime()) /
                    (1000 * 60 * 60 * 24) +
                  1; // +1 to include end day

                const leftPx = (startOffsetDays / 7) * WEEK_COLUMN_WIDTH;
                const widthPx = (durationDays / 7) * WEEK_COLUMN_WIDTH;

                return (
                  <div key={event.id} className="flex items-center mb-1">
                    <div className="w-48 flex-shrink-0 text-sm text-gray-600 truncate pr-2">
                      {event.eventName}
                    </div>
                    <div className="flex-grow relative h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full rounded-full ${
                          event.status === "completed"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                        style={{
                          left: `${leftPx}px`,
                          width: `${widthPx}px`,
                        }}
                        title={`${event.eventName} (${event.startDate} - ${event.endDate})`}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventToEdit, setEventToEdit] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize Firebase and set up auth listener
  useEffect(() => {
    if (!auth) {
      console.error(
        "Firebase Auth service is not initialized. Please check firebaseConfig."
      );
      return; // Ensure auth is initialized
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        console.log("User authenticated. UID:", user.uid);
      } else {
        // Sign in anonymously if no user is logged in and no custom token provided
        if (!initialAuthToken) {
          try {
            const anonUser = await signInAnonymously(auth);
            setUserId(anonUser.user.uid);
            console.log("Signed in anonymously. User ID:", anonUser.user.uid);
          } catch (error) {
            console.error("Error signing in anonymously:", error);
            // เพิ่มการตรวจสอบ error.code เพื่อให้ข้อมูลเพิ่มเติม
            if (error.code === "auth/configuration-not-found") {
              console.error(
                "Firebase Auth Error: auth/configuration-not-found. This usually means your firebaseConfig is incorrect or your project is not properly set up in Firebase Console."
              );
            }
          }
        }
      }
      setIsAuthReady(true); // Auth state is ready
    });

    // Use custom token if provided (สำหรับ Canvas environment)
    const signIn = async () => {
      if (initialAuthToken) {
        try {
          await signInWithCustomToken(auth, initialAuthToken);
          console.log("Signed in with custom token.");
        } catch (error) {
          console.error("Error signing in with custom token:", error);
          // Fallback to anonymous if custom token fails
          try {
            const anonUser = await signInAnonymously(auth);
            setUserId(anonUser.user.uid);
            console.log("Signed in anonymously after custom token failure.");
          } catch (anonError) {
            console.error(
              "Error signing in anonymously after custom token failure:",
              anonError
            );
          }
        }
      } else {
        // Sign in anonymously for CodeSandbox/Vercel
        try {
          const anonUser = await signInAnonymously(auth);
          setUserId(anonUser.user.uid);
          console.log("Signed in anonymously.");
        } catch (error) {
          console.error("Error signing in anonymously:", error);
          if (error.code === "auth/configuration-not-found") {
            console.error(
              "Firebase Auth Error: auth/configuration-not-found. This usually means your firebaseConfig is incorrect or your project is not properly set up in Firebase Console."
            );
          }
        }
      }
      setIsAuthReady(true);
    };

    // หาก auth ยังไม่ถูกตั้งค่า หรือยังไม่มี currentUser ให้ลอง Sign In
    if (auth && !auth.currentUser) {
      signIn();
    } else if (auth && auth.currentUser) {
      setUserId(auth.currentUser.uid);
      setIsAuthReady(true);
    }

    return () => unsubscribe();
  }, []); // Run once on component mount

  // Fetch events when auth is ready and userId is available
  useEffect(() => {
    if (!isAuthReady || !db) {
      console.warn("Firestore or Auth not ready. Cannot fetch events.");
      return;
    }

    // Fetch from public collection for multi-user access
    const eventsCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/events`
    );
    const q = query(eventsCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedEvents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(fetchedEvents);
        console.log("Events fetched:", fetchedEvents);
      },
      (error) => {
        console.error("Error fetching events:", error);
        if (error.code === "permission-denied") {
          console.error(
            "Firestore Permission Denied: Check your Firestore Security Rules. Ensure 'allow read, write: if request.auth != null;' is set for the correct path."
          );
        }
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, db]); // Re-run when auth state or db changes

  const handleDateClick = (date) => {
    setSelectedDate(date);
    // Always open modal for adding a new event when clicking a calendar date
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEventToEdit(null); // Clear event to edit when closing
  };

  const handleSaveEvent = async (eventData, eventId = null) => {
    if (!db || !auth.currentUser) {
      // Ensure db and authenticated user are available for write
      console.error(
        "Firestore not available or user not authenticated. Cannot save event."
      );
      // คุณอาจต้องการแสดงข้อความแจ้งเตือนผู้ใช้ว่าไม่สามารถบันทึกได้
      return;
    }

    try {
      const eventsCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/events`
      );
      if (eventId) {
        // Update existing event
        const eventDocRef = doc(db, eventsCollectionRef, eventId);
        await updateDoc(eventDocRef, eventData);
        console.log("Event updated successfully in Firestore!");
      } else {
        // Add new event
        await addDoc(eventsCollectionRef, eventData);
        console.log("Event added successfully to Firestore!");
      }
    } catch (e) {
      console.error("Error saving event to Firestore: ", e);
      if (e.code === "permission-denied") {
        console.error(
          "Firestore Permission Denied: Check your Firestore Security Rules. Ensure 'allow read, write: if request.auth != null;' is set for the correct path."
        );
      }
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!db || !auth.currentUser) {
      // Ensure db and authenticated user are available for delete
      console.error(
        "Firestore not available or user not authenticated. Cannot delete event."
      );
      return;
    }

    try {
      const eventDocRef = doc(
        db,
        `artifacts/${appId}/public/data/events`,
        eventId
      );
      await deleteDoc(eventDocRef);
      console.log("Event deleted successfully!");
    } catch (e) {
      console.error("Error deleting event: ", e);
      if (e.code === "permission-denied") {
        console.error(
          "Firestore Permission Denied: Check your Firestore Security Rules. Ensure 'allow read, write: if request.auth != null;' is set for the correct path."
        );
      }
    }
  };

  // Calculate overall progress (this section now represents overall progress as events are public)
  const completedEvents = events.filter(
    (event) => event.status === "completed"
  ).length;
  const pendingEvents = events.filter(
    (event) => event.status === "pending"
  ).length;
  const totalEvents = events.length;
  const completionPercentage =
    totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 font-inter">
      <style>
        {`
                /* ไม่จำเป็นต้อง @import url ที่นี่แล้ว เพราะเราโหลดฟอนต์ใน public/index.html */
                body {
                    font-family: 'Inter', sans-serif;
                }
                `}
      </style>
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center drop-shadow-lg">
        ระบบการวางแผนล่วงหน้า
      </h1>
      {userId && (
        <p className="text-sm text-gray-600 mb-4">
          User ID:{" "}
          <span className="font-mono bg-gray-200 px-2 py-1 rounded-md">
            {userId}
          </span>
        </p>
      )}
      <Calendar events={events} onDateClick={handleDateClick} />

      {/* Overall Progress Section */}
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl mx-auto w-full mt-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          ภาพรวมความคืบหน้าของกิจกรรมทั้งหมด
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
            <span className="text-lg font-medium text-blue-800">
              กิจกรรมที่รอดำเนินการ:
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {pendingEvents}
            </span>
          </div>
          <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
            <span className="text-lg font-medium text-green-800">
              กิจกรรมที่เสร็จสมบูรณ์:
            </span>
            <span className="text-2xl font-bold text-green-600">
              {completedEvents}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            ความคืบหน้าโดยรวม:
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-right text-sm text-gray-600 mt-1">
            {completionPercentage.toFixed(1)}% เสร็จสมบูรณ์
          </p>
        </div>
      </div>

      {/* Nong Summary Section */}
      <NongSummary events={events} />

      {/* Gantt Chart Section */}
      <GanttChart events={events} />

      {/* All Events Log Section */}
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl mx-auto w-full mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          บันทึกกิจกรรมทั้งหมด:
        </h3>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center">
            ยังไม่มีกิจกรรมที่บันทึกไว้
          </p>
        ) : (
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-gray-50 p-3 rounded-lg mb-2 shadow-sm flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {event.eventName} ({event.date})
                  </p>
                  <p className="text-sm text-gray-600">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        event.status === "completed"
                          ? "bg-green-200 text-green-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {event.status === "completed"
                        ? "เสร็จสมบูรณ์"
                        : "รอดำเนินการ"}
                    </span>
                    {event.personName && ` - ${event.personName}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDate(new Date(event.date));
                    setEventToEdit(event);
                    setIsModalOpen(true);
                  }}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  แก้ไข
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <EventModal
        isOpen={isModalOpen}
        selectedDate={selectedDate}
        eventToEdit={eventToEdit}
        onClose={handleCloseModal}
        onSaveEvent={handleSaveEvent}
        onDeleteEvent={handleDeleteEvent}
      />
    </div>
  );
};

export default App;
