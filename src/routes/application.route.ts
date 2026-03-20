import express from 'express';
import { ApplicationController } from '../controllers/application.controller';

const router = express.Router();

// Create a new application
router.post('/', ApplicationController.createApplication);

// Save application as draft (create or update)
router.post('/draft', ApplicationController.saveAsDraft);
router.put('/:id/draft', ApplicationController.saveAsDraft);

// Save and submit application (create or update)
router.post('/submit', ApplicationController.saveAndSubmit);
router.put('/:id/submit', ApplicationController.saveAndSubmit);

// Get all applications with filters
router.get('/', ApplicationController.getApplications);

// Get a single application by ID
router.get('/:id', ApplicationController.getApplicationById);

// Update an application
router.put('/:id', ApplicationController.updateApplication);

// Delete an application
router.delete('/:id', ApplicationController.deleteApplication);

// Get applications by contract ID
router.get('/contract/:contractId', ApplicationController.getApplicationsByContractId);

export default router;
