// router.js
const express = require('express');
const router = express.Router();

// Import controller
const logincontroller = require('./controller/logincontroller');
const multerConfig = require('./middleware/multermiddleware');
const Assigncontroller = require('./controller/Assigncontroller')
const addproject = require('./controller/addproject')

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


module.exports = router;
