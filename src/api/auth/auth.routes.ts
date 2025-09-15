import express from "express";
import {protect} from "../../middleware/auth.middleware";
import {validate} from "../../middleware/validator";
import * as authController from "./auth.controller";
import * as authValidation from "./auth.validation";

const router = express.Router();

router.post(
  "/register",
  authValidation.register,
  validate,
  authController.register
);



router.post("/login", authValidation.login, validate, authController.login);

router.post(
    "/verify-email",
    authValidation.verifyEmail,
    validate,
    authController.verifyEmail
);

router.post(
    "/resend-verification",
    authValidation.resendVerification,
    validate,
    authController.resendVerificationEmail
);


router.post("/refresh", authController.refreshToken);
router.post("/logout", protect, authController.logout);

export default router;
