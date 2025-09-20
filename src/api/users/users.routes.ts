import express from "express";
import { protect } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/upload.middleware";
import { validate } from "../../middleware/validator";
import * as usersController from "./users.controller";
import * as usersValidation from "./users.validation";

const router = express.Router();

// All routes below are protected
router.use(protect);

router.get("/me", usersController.getMe);
router.put(
  "/me/picture",
  upload.single("profilePicture"),
  usersController.updateProfilePicture
);
router.get(
  "/search",
  usersValidation.search,
  validate,
  usersController.searchUsers
);

// Friend management
router.get("/friends", usersController.getFriends);
router.get("/friends/requests", usersController.getFriendRequests);
router.post(
  "/friends/request",
  usersValidation.friendRequest,
  validate,
  usersController.sendFriendRequest
);
router.put(
  "/friends/request/:userId",
  usersValidation.respondToRequest,
  validate,
  usersController.respondToFriendRequest
);
router.delete(
  "/friends/:userId",
  usersValidation.removeFriend,
  validate,
  usersController.removeFriend
);

export default router;
