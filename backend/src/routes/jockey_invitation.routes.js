const { Router } = require('express');
const { z } = require('zod');
const invitationController = require('../controllers/jockey_invitation.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

const createInvitationSchema = z.object({
  jockeyId: z.string().min(1),
  horseId: z.string().min(1),
  message: z.string().max(500).optional(),
});

const rejectInvitationSchema = z.object({
  rejectionNote: z.string().max(500).optional(),
});

router.use(authenticate);

// Owner: tạo và hủy invitation
router.post('/', authorize('owner'), validate(createInvitationSchema), invitationController.createInvitation);
router.delete('/:id', authorize('owner'), invitationController.cancelInvitation);

// Cả owner và jockey đều xem được
router.get('/', authorize('owner', 'jockey'), invitationController.getInvitations);
router.get('/:id', authorize('owner', 'jockey', 'admin'), invitationController.getInvitationById);

// Jockey: accept/reject
router.patch('/:id/accept', authorize('jockey'), invitationController.acceptInvitation);
router.patch('/:id/reject', authorize('jockey'), validate(rejectInvitationSchema), invitationController.rejectInvitation);

module.exports = router;
