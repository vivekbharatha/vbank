import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const authRouter = Router();
const authController = new AuthController();

authRouter.post('/register', authController.register.bind(authController));
authRouter.post('/login', authController.login.bind(authController));
authRouter.post('/logout', authController.logout.bind(authController));

export { authRouter };
