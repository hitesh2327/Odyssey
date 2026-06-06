import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Replace request values with verified parsed values
      req.body = parsed.body || req.body;
      req.query = parsed.query || req.query;
      req.params = parsed.params || req.params;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.errors
          .map((err) => {
            const field = err.path.slice(1).join('.'); // removes 'body', 'query', or 'params'
            return field ? `'${field}' ${err.message}` : err.message;
          })
          .join(', ');

        res.status(400).json({
          success: false,
          message: `Validation failed: ${errorDetails}`,
        });
        return;
      }
      return next(error);
    }
  };
};
