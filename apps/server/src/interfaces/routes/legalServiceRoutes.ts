import { Router } from 'express';
import { LegalServiceController } from '../controllers/LegalServiceController';
import { authMiddleware, authorize } from '../middlewares/authMiddleware';

const router = Router();
const serviceController = new LegalServiceController();

// Public route for the website
router.get('/public', serviceController.getAll.bind(serviceController));

// Admin routes
router.use(authMiddleware);
router.get('/', authorize(['ADMIN']), serviceController.getAllAdmin.bind(serviceController));
router.post('/', authorize(['ADMIN']), serviceController.create.bind(serviceController));
router.put('/:id', authorize(['ADMIN']), serviceController.update.bind(serviceController));
router.delete('/:id', authorize(['ADMIN']), serviceController.delete.bind(serviceController));

export default router;
