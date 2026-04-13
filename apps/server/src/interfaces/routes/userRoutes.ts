import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware, authorize } from '../middlewares/authMiddleware';

const router = Router();
const userController = new UserController();

router.use(authMiddleware);

router.get('/', authorize(['ADMIN', 'LAWYER']), userController.getAll.bind(userController));
router.get('/clients', authorize(['ADMIN', 'LAWYER']), userController.getClients.bind(userController));
router.post('/', authorize(['ADMIN', 'LAWYER']), userController.create.bind(userController));
router.post('/:id/resend-confirmation', authorize(['ADMIN']), userController.resendConfirmation.bind(userController));
router.post('/:id/change-password', userController.changePassword.bind(userController));
router.put('/:id', userController.update.bind(userController));
router.delete('/:id', authorize(['ADMIN']), userController.delete.bind(userController));

export default router;
