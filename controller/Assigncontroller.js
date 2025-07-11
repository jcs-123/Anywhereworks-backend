const Ticket = require('../model/Assignmodel');
const User = require('../model/loginmodel');
const nodemailer = require('nodemailer');

exports.createTicket = async (req, res) => {
  try {
    const {
      projectName,
      subject,
      description,
      expectedHours,
      assignedTo,
      assignedBy,
      ticketType,
    } = req.body;

    const file = req.file ? req.file.filename : null;

    // Basic Validation
    if (!projectName || !subject || !description || !expectedHours || !assignedTo || !assignedBy || !ticketType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (isNaN(expectedHours) || expectedHours <= 0) {
      return res.status(400).json({ error: 'Expected hours must be a positive number' });
    }

    // Create new ticket
    const newTicket = new Ticket({
      projectName,
      subject,
      description,
      expectedHours,
      file,
      assignedTo,
      assignedBy,
      ticketType,
      assignedDate: new Date()
    });

    await newTicket.save();

    // ✅ Email Notification Logic
    const assignee = await User.findOne({ gmail: assignedTo });

    if (assignee && assignee.gmail) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'jcs@jecc.ac.in',       // 🔐 Use env vars in prod
          pass: 'gyjg bbsl gvmd mxks',  // 🔐 Use env vars in prod
        },
      });

      const mailOptions = {
        from: '"AnywhereWorks" <jcs@jecc.ac.in>',
        to: assignee.gmail,
        subject: `📌 New Ticket Assigned: TICKET-${newTicket.ticketNo}`,
        html: `
          <div style="font-family: Arial; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #1400FF;">New Ticket Assigned</h2>
            <p>Hello <strong>${assignee.name || assignedTo}</strong>,</p>
            <p>You have been assigned a new ticket:</p>
            <ul>
              <li><strong>Ticket No:</strong> TICKET-${newTicket.ticketNo}</li>
              <li><strong>Project:</strong> ${projectName}</li>
              <li><strong>Type:</strong> ${ticketType}</li>
              <li><strong>Subject:</strong> ${subject}</li>
              <li><strong>Expected Hours:</strong> ${expectedHours}</li>
              <li><strong>Assigned By:</strong> ${assignedBy}</li>
              <li><strong>Assigned On:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            
      <p style="margin-top: 20px; font-style: italic; color: #444;">
        Thank you for your continued dedication and hard work. We appreciate your contribution to the success of our team.
      </p>
            <p style="font-size: 12px; color: #888;">This is an automated message from AnywhereWorks.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    return res.status(201).json({
      message: '✅ Ticket created and email sent successfully',
      ticket: newTicket,
    });

  } catch (error) {
    console.error('❌ Error creating ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================

exports.getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });

    if (!tickets.length) {
      return res.status(404).json({ message: 'No tickets found' });
    }

    return res.status(200).json({ tickets });

  } catch (error) {
    console.error('❌ Error fetching tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================

// In your ticket controller (e.g., controllers/ticketController.js)
exports.updateTicketStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updateData = { status };
    if (status === 'Completed') {
      updateData.completedTime = new Date(); // ✅ Set completed time
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(id, updateData, { new: true });

    res.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating status' });
  }
};

// controllers/ticketController.js
exports.requestAdditionalTime = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { hours, reason, requestedBy } = req.body;

    if (!hours || !reason || !requestedBy) {
      return res.status(400).json({ error: 'Hours, reason, and requestedBy are required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const timeRequest = {
      hours,
      reason,
      requestedBy,
      status: 'Pending',
      createdAt: new Date()
    };

    ticket.timeRequests.push(timeRequest);
    await ticket.save();

    return res.status(200).json({
      message: '✅ Time request submitted',
      timeRequest
    });
  } catch (error) {
    console.error('❌ Error submitting time request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getreqTickets = async (req, res) => {
  try {
    const { assignedTo, status, ticketNo } = req.query;

    // Build query dynamically
    const query = {};
    if (assignedTo) query.assignedTo = assignedTo;
    if (status) query.status = status;
    if (ticketNo) query.ticketNo = ticketNo;

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tickets
    });
  } catch (err) {
    console.error('Error fetching tickets:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tickets'
    });
  }
};



// In controllers/Assigncontroller.js


exports.updateTimeRequestStatus = async (req, res) => {
  try {
    const { ticketId, status, responseNote } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket || !ticket.timeRequests.length) {
      return res.status(404).json({ success: false, message: 'Ticket or time request not found' });
    }

    // Get the latest time request (last one in array)
    const lastRequest = ticket.timeRequests[ticket.timeRequests.length - 1];

    // Update status and append note to the reason
    lastRequest.status = status;

    if (responseNote && responseNote.trim()) {
      lastRequest.reason += `\nAdmin Note: ${responseNote.trim()}`;
    }

    lastRequest.respondedBy = null; // You can set req.user._id if authentication is added

    await ticket.save();

    res.status(200).json({ success: true, message: 'Time request updated successfully' });
  } catch (err) {
    console.error('Error updating time request:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



// GET completed tickets (status === 'Completed' or 'Verified')
exports.getCompletedTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      status: { $in: ['Completed', 'Verified'] }
    }).sort({ completedTime: -1 });

    // Optionally process each ticket
    const processed = tickets.map(ticket => {
      const approvedRequests = ticket.timeRequests?.filter(req => req.status === 'Approved') || [];

      const totalExtraHours = approvedRequests.reduce((sum, req) => sum + req.hours, 0);

      return {
        ...ticket._doc, // spread the raw data
        approvedExtraHours: totalExtraHours,
        approvedTimeRequests: approvedRequests
      };
    });

    res.status(200).json({ success: true, data: processed });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching completed tickets', 
      error: err.message 
    });
  }
};


// PUT /tickets/:id/verify
exports.verifyTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status: 'Verified' }, { new: true });
    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

//requestsatataus get
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('timeRequests.requestedBy', 'name email')     // populate requestedBy user
      .populate('timeRequests.respondedBy', 'name email')     // populate respondedBy user
      .sort({ createdAt: -1 });                                // latest tickets first

    res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Server error retrieving tickets' });
  }
};


// Controller to get filtered ticket data
exports.getAllData = async (req, res) => {
  try {
    const { startDate, endDate, reportType, developer, project } = req.query;

    const query = {
      assignedDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (reportType === 'developer' && developer) {
      query.assignedTo = new RegExp(`\\b${developer}\\b`, 'i'); // matches developer inside comma-separated string
    }

    if (reportType === 'project' && project) {
      query.projectName = project;
    }

    const data = await Ticket.find(query).sort({ assignedDate: 1 });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


exports.getAllDashboardData = async (req, res) => {
  try {
    const tickets = await Ticket.find().lean();

    const summarizeByType = (type) => {
      const filtered = tickets.filter(t => t.ticketType === type);
      return {
        assigned: filtered.filter(t => t.status === 'Assigned').length,
        working: filtered.filter(t => t.status === 'Working').length,
        completed: filtered.filter(t => t.status === 'Completed').length,
        pending: filtered.filter(t => t.status === 'Pending').length
      };
    };

    const response = {
      development: summarizeByType('Development'),
      maintenance: summarizeByType('Maintenance'),
      tickets: tickets.map(ticket => {
        const latestTimeRequest = ticket.timeRequests?.length
          ? ticket.timeRequests[ticket.timeRequests.length - 1]
          : null;

        return {
          ticketNo: ticket.ticketNo,
          status: ticket.status,
          assignedTo: ticket.assignedTo,
          ticketType: ticket.ticketType,
          projectName: ticket.projectName,
          subject: ticket.subject,
          expectedHours: ticket.expectedHours || '-',
          timeRequests: latestTimeRequest ? [latestTimeRequest] : []
        };
      })
    };

    res.status(200).json(response);

  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
};
