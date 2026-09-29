import express from 'express';
import {
  createRepo,
  indexRepo,
  getRepos,
  getRepoById,
  getRepoFileContent,
  deleteRepo,
} from '../controllers/repoController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createRepo).get(getRepos);
router.route('/:repoId').get(getRepoById).delete(deleteRepo);
router.post('/:repoId/index', indexRepo);
router.get('/:repoId/file', getRepoFileContent);

export default router;
