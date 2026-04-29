import { Router } from 'express';
import { AvailabilityController } from '../controllers/AvailabilityController';
import { authMiddleware, authorize } from '../middlewares/authMiddleware';

const router = Router();
const controller = new AvailabilityController();

// Public check
router.get('/public', controller.getPublicAvailability.bind(controller));

// Private management
router.use(authMiddleware);
router.get('/:lawyerId', authorize(['ADMIN', 'LAWYER']), controller.getByLawyer.bind(controller));
router.put('/:lawyerId', authorize(['ADMIN', 'LAWYER']), controller.update.bind(controller));

export default router;
