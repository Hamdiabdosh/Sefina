import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import authRoutes from './modules/m01-auth/auth.routes';
import userRoutes from './modules/m01-users/user.routes';
import medresaRoutes from './modules/m02-medresa/medresa.routes';
import teacherRoutes from './modules/m03-teacher/teacher.routes';
import courseRoutes from './modules/m04-course/course.routes';
import medresaCourseRoutes from './modules/m04-course/medresa-course.routes';
import medresaStudentRoutes from './modules/m05-student/medresa-student.routes';
import studentRoutes from './modules/m05-student/student.routes';
import teacherStudentRoutes from './modules/m05-student/teacher-student.routes';
import attendanceRoutes from './modules/m06-attendance/attendance.routes';
import medresaAttendanceRoutes from './modules/m06-attendance/medresa-attendance.routes';
import { scheduleAttendanceCron } from './schedulers/attendance-cron';

const app = express();
const PORT = env.PORT;

app.use(helmet());

const devOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const allowed =
      origin === env.FRONTEND_URL ||
      (env.NODE_ENV !== 'production' && devOrigins.includes(origin));
    callback(allowed ? null : new Error(`CORS blocked origin: ${origin}`), allowed);
  },
  credentials: true,
}));

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
app.use(globalLimiter);

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/medresas', medresaRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/medresas/:medresaId/courses', medresaCourseRoutes);
app.use('/api/v1/medresas/:medresaId/students', medresaStudentRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/teacher/students', teacherStudentRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/medresas/:medresaId/attendance', medresaAttendanceRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
});

app.listen(PORT, () => {
  console.log(`Sefinet Al Neja backend running on port ${PORT}`);
  scheduleAttendanceCron();
});

export default app;
