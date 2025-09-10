import express from 'express';
import * as groupsController from './groups.controller';
import * as groupsValidation from './groups.validation';
import {validate} from '../../middleware/validator';
import {protect} from '../../middleware/auth.middleware';

const router = express.Router();

// All routes are protected and require a logged-in user
router.use(protect);

// Base group routes
router.route('/')
    .post(groupsValidation.createGroup, validate, groupsController.createGroup)
    .get(groupsController.getUserGroups);

router.route('/:groupId')
    .get(groupsValidation.groupIdParam, validate, groupsController.getGroupDetails)
    .put(groupsValidation.updateGroup, validate, groupsController.updateGroup)
    .delete(groupsValidation.groupIdParam, validate, groupsController.deleteGroup);

// Member management routes
router.post('/:groupId/members', groupsValidation.manageMemberBody, validate, groupsController.addMember);
router.delete('/:groupId/members/:userId', groupsValidation.manageMemberParams, validate, groupsController.removeMember);

// Trip routes (nested under groups)
router.route('/:groupId/trips')
    .post(groupsValidation.createTrip, validate, groupsController.createTrip)
    .get(groupsValidation.groupIdParam, validate, groupsController.getTripsForGroup);

router.put('/:groupId/trips/:tripId', groupsValidation.updateTrip, validate, groupsController.updateTripStatus);

// Message routes (nested under groups)
router.get('/:groupId/messages', groupsValidation.getMessages, validate, groupsController.getGroupMessages);

export default router;