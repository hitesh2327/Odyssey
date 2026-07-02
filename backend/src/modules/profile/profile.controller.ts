import { Request, Response, NextFunction } from 'express';
import { profileService } from './profile.service';
import { resumeParserService } from './resume-parser.service';
import { ApiError } from '../../utils/ApiError';

export class ProfileController {
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await profileService.getProfile(userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await profileService.updateProfile(userId, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async replaceTopics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { topicIds } = req.body;
      const data = await profileService.replaceTopics(userId, topicIds);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = (req as any).file;
      if (!file) {
        throw new ApiError(400, 'No file uploaded');
      }
      const userId = req.user!.id;
      const avatarUrl = `/uploads/avatars/${file.filename}`;
      const data = await profileService.updateAvatar(userId, avatarUrl);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async removeAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await profileService.removeAvatar(userId);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  public async getResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const resumes = await profileService.getResumes(userId);
      res.status(200).json({ success: true, data: { resumes } });
    } catch (error) {
      next(error);
    }
  }

  public async uploadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = (req as any).file;
      if (!file) {
        throw new ApiError(400, 'No file uploaded');
      }
      const userId = req.user!.id;
      const fileType = file.mimetype === 'application/pdf' ? 'PDF' : 'DOCX';
      const resume = await profileService.uploadResume(
        userId,
        file.path,
        file.originalname,
        fileType,
        file.size
      );
      res.status(200).json({ success: true, data: { resume } });
    } catch (error) {
      next(error);
    }
  }

  public async setPrimaryResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const resumeId = req.params.resumeId;
      const resume = await profileService.setPrimaryResume(userId, resumeId);
      res.status(200).json({ success: true, data: { resume } });
    } catch (error) {
      next(error);
    }
  }

  public async deleteResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const resumeId = req.params.resumeId;
      await profileService.deleteResume(userId, resumeId);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  public async downloadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const resumeId = req.params.resumeId;
      const { absolutePath, fileName } = await profileService.getResumePath(userId, resumeId);
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.sendFile(absolutePath, (err) => {
        if (err) {
          next(err);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public async parseResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const resumeId = req.params.resumeId;
      const result = await resumeParserService.parseResume(resumeId, userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
