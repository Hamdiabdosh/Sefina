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
import examTypeRoutes from './modules/m07-grades/exam-type.routes';
import gradeRoutes from './modules/m07-grades/grade.routes';
import gradeEditRequestRoutes from './modules/m07-grades/grade-edit-request.routes';
import medresaGradeRoutes from './modules/m07-grades/medresa-grade.routes';
import medresaCourseGradeRoutes from './modules/m07-grades/medresa-course-grade.routes';
import resultsRoutes from './modules/m07-grades/results.routes';
import feeStructureRoutes from './modules/m08-fees/fee-structure.routes';
import feePaymentRoutes from './modules/m08-fees/fee-payment.routes';
import medresaFeeRoutes from './modules/m08-fees/medresa-fee.routes';
import feesOverviewRoutes from './modules/m08-fees/fees-overview.routes';
import salaryRankRoutes from './modules/m09-salaries/salary-rank.routes';
import salaryPaymentRoutes from './modules/m09-salaries/salary-payment.routes';
import salaryTeacherRoutes from './modules/m09-salaries/salary-teacher.routes';
import salariesOverviewRoutes from './modules/m09-salaries/salaries-overview.routes';
import dashboardRoutes from './modules/m10-reports/dashboard.routes';
import reportRoutes from './modules/m10-reports/report.routes';
import { scheduleAttendanceCron } from './schedulers/attendance-cron';
import { scheduleSalaryCron } from './schedulers/salary-cron';
import { handleControllerError } from './lib/errors';

const app = express();
app.set('trust proxy', 1);
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

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/medresas', medresaRoutes);
app.use('/api/v1/teachers', salaryTeacherRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/medresas/:medresaId/courses', medresaCourseRoutes);
app.use('/api/v1/medresas/:medresaId/students', medresaStudentRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/teacher/students', teacherStudentRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/medresas/:medresaId/attendance', medresaAttendanceRoutes);
app.use('/api/v1/exam-types', examTypeRoutes);
app.use('/api/v1/grades', gradeRoutes);
app.use('/api/v1/grade-edit-requests', gradeEditRequestRoutes);
app.use('/api/v1/medresas/:medresaId/results', medresaGradeRoutes);
app.use('/api/v1/medresa-courses', medresaCourseGradeRoutes);
app.use('/api/v1/results', resultsRoutes);
app.use('/api/v1/fee-structures', feeStructureRoutes);
app.use('/api/v1/fee-payments', feePaymentRoutes);
app.use('/api/v1/medresas/:medresaId/fees', medresaFeeRoutes);
app.use('/api/v1/fees', feesOverviewRoutes);
app.use('/api/v1/salary-ranks', salaryRankRoutes);
app.use('/api/v1/salary-payments', salaryPaymentRoutes);
app.use('/api/v1/salaries', salariesOverviewRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  handleControllerError(err, res);
});

app.listen(PORT, () => {
  console.log(`Sefinet Al Neja backend running on port ${PORT}`);
  scheduleAttendanceCron();
  scheduleSalaryCron();
});

export default app;
