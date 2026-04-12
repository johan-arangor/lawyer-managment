import { Router } from 'express';
import multer from 'multer';
import { CaseController } from '../controllers/CaseController';
import { authMiddleware, authorize } from '../middlewares/authMiddleware';

const router = Router();
const caseController = new CaseController();
const upload = multer({ storage: multer.memoryStorage() });

// All case routes require authentication
router.use(authMiddleware);

router.get('/stats', authorize(['ADMIN', 'LAWYER', 'CLIENT']), caseController.getStats.bind(caseController));
router.get('/', caseController.getAll.bind(caseController));
router.get('/:id', caseController.getById.bind(caseController));
router.post('/', authorize(['ADMIN', 'LAWYER']), caseController.create.bind(caseController));
router.put('/:id', authorize(['ADMIN', 'LAWYER']), caseController.update.bind(caseController));
router.delete('/:id', authorize(['ADMIN']), caseController.delete.bind(caseController));
router.post('/:id/documents', upload.single('file'), caseController.upload.bind(caseController));
router.post('/:id/notes', caseController.addNote.bind(caseController));
router.delete('/:id/notes/:noteId', authorize(['ADMIN']), caseController.deleteNote.bind(caseController));
router.post('/:id/links', caseController.addLink.bind(caseController));
router.delete('/:id/links/:linkId', authorize(['ADMIN']), caseController.deleteLink.bind(caseController));
router.post('/:id/payments', upload.single('file'), caseController.addPayment.bind(caseController));
router.patch('/:id/status', caseController.updateStatus.bind(caseController));
router.get('/:id/folder/:subfolder', caseController.getFolderUrl.bind(caseController));

export default router;
