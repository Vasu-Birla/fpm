// routes/router.js
import express from 'express';

import * as apiController from '../controllers/apiController.js'; 

import { profileUpload , fileUpload } from '../middleware/uploader.js';

import * as cronJobs from '../controllers/cronJobsController.js';

const router = express.Router();


//======== APIs Routes =======================


router.route('/v1/health').get(apiController.checkHealth)


router.post('/cronjobs/cnc/daily-refresh', cronJobs.cncDailyRefresh);






//======== APIs Routes =======================

export default router;
