import { Router } from 'express';
import { profileController } from './profile.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateProfileSchema, replaceTopicsSchema } from './profile.validation';
import { avatarUpload, resumeUpload } from '../../lib/multer';

const router = Router();

router.use(authMiddleware);

// Profile
router.get('/', profileController.getProfile);
router.patch('/', validate(updateProfileSchema), profileController.updateProfile);

// Topics
router.put('/topics', validate(replaceTopicsSchema), profileController.replaceTopics);

// Avatar
router.post('/avatar', avatarUpload.single('file'), profileController.uploadAvatar);
router.delete('/avatar', profileController.removeAvatar);

// Resumes
router.get('/resumes', profileController.getResumes);
router.post('/resumes', resumeUpload.single('file'), profileController.uploadResume);
router.patch('/resumes/:resumeId/primary', profileController.setPrimaryResume);
router.delete('/resumes/:resumeId', profileController.deleteResume);
router.get('/resumes/:resumeId/download', profileController.downloadResume);
router.post('/resumes/:resumeId/parse', profileController.parseResume);

export { router as profileRouter };
