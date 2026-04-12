import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware, authorize } from '../middlewares/authMiddleware';

const router = Router();
const userController = new UserController();

router.get('/', authMiddleware, authorize(['ADMIN', 'LAWYER']), userController.getAll.bind(userController));
router.post('/', authMiddleware, authorize(['ADMIN']), userController.create.bind(userController));
router.put('/:id', authMiddleware, authorize(['ADMIN']), userController.update.bind(userController));
router.delete('/:id', authMiddleware, authorize(['ADMIN']), userController.delete.bind(userController));

export default router;
