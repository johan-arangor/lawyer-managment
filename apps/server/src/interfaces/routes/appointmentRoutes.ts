import { Router } from 'express';
import { AppointmentController } from '../controllers/AppointmentController';
import { authMiddleware, authorize } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AppointmentController();

// Public booking
router.post('/public/book', controller.book.bind(controller));

// Private management
router.use(authMiddleware);
router.get('/my', controller.getMyAppointments.bind(controller));
router.get('/', authorize(['ADMIN', 'LAWYER']), controller.getAll.bind(controller));
router.patch('/:id/status', authorize(['ADMIN', 'LAWYER']), controller.updateStatus.bind(controller));

export default router;
