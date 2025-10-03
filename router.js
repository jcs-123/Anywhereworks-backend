// router.js
const express = require('express');
const router = express.Router();

// Import controller
const logincontroller = require('./controller/logincontroller');
const multerConfig = require('./middleware/multermiddleware');
const Assigncontroller = require('./controller/Assigncontroller')
const addproject = require('./controller/addproject')
const dailyWorklogController = require('./controller/dailyWorklogController')
const RENEWAL = require('./controller/renewaldate')


// Route: GET /get-login
router.post('/login', logincontroller.loginUser);
router.post('/forgot-password', logincontroller.sendOtp);
router.post('/verify-otp', logincontroller.verifyOtp);
router.post('/reset-password', logincontroller.resetPassword);
router.post('/assign', multerConfig.single('file'), Assigncontroller.createTicket);
router.get('/tickets', Assigncontroller.getTickets);



router.put('/tickets/:id', Assigncontroller.updateTicketStatus);


// routes/ticketRoutes.js
router.post('/tickets/:id/request-time', Assigncontroller.requestAdditionalTime);
router.get('/ticketrequest', Assigncontroller.getreqTickets);
router.post('/ticketrequest/update-status', Assigncontroller.updateTimeRequestStatus);
router.get('/completed', Assigncontroller.getCompletedTickets);
router.put('/tickets/:id/verify', Assigncontroller.verifyTicket);
router.get('/ticketsreqtime', Assigncontroller.getAllTickets);
router.get('/getalldataa',Assigncontroller.getAllData);
router.get('/getdashboardata',Assigncontroller.getAllDashboardData);



router.post('/add', addproject.addProject);
router.get('/all', addproject.getProjects);
// worklog

// POST /api/daily-worklogs - Create multiple daily worklog entries
router.post('/daily-worklogs', dailyWorklogController.createDailyWorklogs);
router.get('/daily-worklogs', dailyWorklogController.getDailyWorklogs);
router.post('/daily-worklogs/devstatus', dailyWorklogController.bulkUpdateDevStatus);
router.put('/daily-worklogs/:id', dailyWorklogController.updateDailyWorklog);
router.post("/bulk-update-hide", dailyWorklogController.bulkUpdateHide);
// RENEWAL
router.get('/renewals', RENEWAL.list);          // GET all renewals (with filters)
router.get('/renewals/alerts', RENEWAL.alerts); // GET alerts (expired & due soon)
router.get('/renewals/:id', RENEWAL.getOne);    // GET one renewal by ID
router.post('/renewals', RENEWAL.create);       // CREATE a new renewal
router.put('/renewals/:id', RENEWAL.update);    // UPDATE a renewal by ID
router.delete('/renewals/:id', RENEWAL.remove); // DELETE a renewal by ID
router.get("/send-reminders", RENEWAL.sendReminders); 
module.exports = router;

module.exports = router;
