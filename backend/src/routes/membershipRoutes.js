import express from 'express';
import { getAllMemberships, getMembershipByUniqueKey, createMembership,
        updateMembership, deleteMembership, patchMembership, 
        deleteAllMemberships, validateMembership} from '../controllers/membershipController.js';

const router = express.Router();

// Routes
router.get('/', getAllMemberships); // Get all memberships
router.post('/', createMembership); // Create new membership
router.get('/:unique_key', getMembershipByUniqueKey); // Get membership by unique_key
router.put('/:unique_key', updateMembership); // Update membership by unique_key
router.delete('/:unique_key', deleteMembership); // Delete membership by unique_key
router.delete('/', deleteAllMemberships);

router.patch('/:unique_key', patchMembership) //update patch membership 
router.post('/validate/', validateMembership);

export default router;
