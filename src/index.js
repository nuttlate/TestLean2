import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// ตรวจสอบให้แน่ใจว่ามีการนำเข้า App จาก `./App.js` อย่างถูกต้อง
import App from "./App.js";

// ตรวจสอบให้แน่ใจว่ามีการนำเข้าไฟล์ CSS หลักของโปรเจกต์
// แม้จะใช้ Tailwind CDN แล้ว แต่ยังคงต้อง import ไฟล์ styles.css เพื่อโหลดฟอนต์หรือ CSS อื่นๆ ที่คุณอาจเพิ่มเอง
import "./styles.css";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
