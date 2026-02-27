import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import errorHandler from './error.js';

// Types
interface JwtPayload {
  id: string;
  role: string;
  [key: string]: any;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Token generation
export const generateToken = (user: { _id: string; role: string }): string => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "abcdef",
    { expiresIn: '1d' }
  );
};

// Base token verification
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = req.cookies?.access_token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);


  if (!token) {
    return next(errorHandler(401, 'You are not authenticated!'));
  }

  jwt.verify(token, process.env.JWT_SECRET || "abcdef", (err: jwt.VerifyErrors | null, decoded: unknown) => {
    if (err) {
      return next(errorHandler(403, 'Token is not valid!'));
    }
    
    // Type assertion to JwtPayload
    req.user = decoded as JwtPayload;
    console.log(req.user)
    next();
  });
};

// Admin verification middleware
export const verifyAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  verifyToken(req, res, () => {
    if (req.user?.role !== 'Admin') {
      return next(errorHandler(403, 'Admin access required!'));
    }
    next();
  });
};

// User ownership verification middleware
export const verifyUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  verifyToken(req, res, () => {
    if (req.user?.id === req.params.id || req.user?.role === 'Admin') {
      return next();
    }
    return next(errorHandler(403, 'Unauthorized access!'));
  });
};

// Optional: Role-based access control middleware
export const checkRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    verifyToken(req, res, () => {
      if (req.user?.role && roles.includes(req.user.role)) {
        return next();
      }
      return next(errorHandler(403, `Required roles: ${roles.join(', ')}`));
    });
  };
};

