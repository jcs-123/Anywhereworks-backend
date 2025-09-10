const DailyWorklog = require('../model/DailyWorklog');

// Create multiple daily worklog entries
exports.createDailyWorklogs = async (req, res) => {
  try {
    const { dailyBreakdowns } = req.body;
    
    if (!dailyBreakdowns || !Array.isArray(dailyBreakdowns)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of daily breakdowns.'
      });
    }

    // Process each daily breakdown
    const results = {
      processed: 0,
      inserted: 0,
      updated: 0,
      errors: []
    };

    for (const breakdown of dailyBreakdowns) {
      try {
        // Prepare the data with proper field mapping
        const worklogData = {
          developer: breakdown.developer,
          date: new Date(breakdown.date),
          hoursWorked: breakdown.hoursWorked,
          dailyTarget: breakdown.dailyTarget || 6,
          status: breakdown.status,
          isOnline: breakdown.isOnline,
          dayType: breakdown.dayType, // Added dayType field
          tickets: breakdown.tickets || [],
          reportPeriod: {
            startDate: new Date(breakdown.reportPeriod.startDate),
            endDate: new Date(breakdown.reportPeriod.endDate)
          },
          // Set default values for new fields if not provided
          hide: breakdown.hide || 'unblock',
          devstatus: breakdown.devstatus || 'notcomplete'
        };

        // Use upsert to update existing or create new document
        const options = { 
          upsert: true, 
          new: true, 
          runValidators: true,
          setDefaultsOnInsert: true
        };
        
        const result = await DailyWorklog.findOneAndUpdate(
          { 
            developer: breakdown.developer, 
            date: new Date(breakdown.date) 
          },
          worklogData,
          options
        );
        
        // Check if the document was inserted or updated
        if (result.$isNew) {
          results.inserted++;
        } else {
          results.updated++;
        }
        results.processed++;
        
      } catch (error) {
        results.errors.push({
          developer: breakdown.developer,
          date: breakdown.date,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Processed ${results.processed} daily worklog entries (${results.inserted} inserted, ${results.updated} updated)`,
      results
    });

  } catch (error) {
    console.error('Error creating daily worklogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing daily worklogs',
      error: error.message
    });
  }
};


// Get all daily worklogs with optional filtering
exports.getDailyWorklogs = async (req, res) => {
  try {
    const {
      developer,
      startDate,
      endDate,
      status,
      hide,
      devstatus,
      dayType
    } = req.query;

    // Build filter object
    const filter = {};

    if (developer) {
      filter.developer = new RegExp(developer, 'i'); // Case-insensitive search
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid startDate format. Use YYYY-MM-DD.'
          });
        }
        filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid endDate format. Use YYYY-MM-DD.'
          });
        }
        end.setHours(23, 59, 59, 999); // Include entire end day
        filter.date.$lte = end;
      }
    }

    if (status) {
      filter.status = status;
    }

    if (hide) {
      filter.hide = hide;
    }

    if (devstatus) {
      filter.devstatus = devstatus;
    }

    if (dayType) {
      filter.dayType = dayType;
    }

    // Execute query without pagination - get all results
    const worklogs = await DailyWorklog.find(filter)
      .sort({ date: -1 }); // Sort by date descending

    res.status(200).json({
      success: true,
      message: 'Daily worklogs retrieved successfully',
      data: worklogs,
      count: worklogs.length
    });
  } catch (error) {
    console.error('Error fetching daily worklogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching daily worklogs',
      error: error.message
    });
  }
};


exports.bulkUpdateDevStatus = async (req, res) => {
  try {
    let { ids, devstatus } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IDs array'
      });
    }

    // Default: only allow flipping notcomplete → completed
    if (!devstatus) {
      devstatus = "completed";
    }

    if (!['notcomplete', 'completed'].includes(devstatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid devstatus. Must be either "notcomplete" or "completed".'
      });
    }

    // Only update docs that are currently notcomplete
    const result = await DailyWorklog.updateMany(
      { _id: { $in: ids }, devstatus: 'notcomplete' },
      { 
        $set: { 
          devstatus: devstatus,
          updatedAt: new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `Updated devstatus for ${result.modifiedCount} worklogs`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error bulk updating devstatus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk updating devstatus',
      error: error.message
    });
  }
};




exports.updateDailyWorklog = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Worklog ID is required'
      });
    }

    // Handle date conversions if present
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    if (updateData.reportPeriod) {
      if (updateData.reportPeriod.startDate) {
        updateData.reportPeriod.startDate = new Date(updateData.reportPeriod.startDate);
      }
      if (updateData.reportPeriod.endDate) {
        updateData.reportPeriod.endDate = new Date(updateData.reportPeriod.endDate);
      }
    }

    updateData.updatedAt = new Date();

    const worklog = await DailyWorklog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!worklog) {
      return res.status(404).json({
        success: false,
        message: 'Daily worklog not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Daily worklog updated successfully',
      data: worklog
    });
  } catch (error) {
    console.error('Error updating daily worklog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating daily worklog',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

exports.bulkUpdateHide = async (req, res) => {
  try {
    const { ids, hide } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid IDs array"
      });
    }

    if (!["block", "unblock"].includes(hide)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hide value. Must be "block" or "unblock".'
      });
    }

    const result = await DailyWorklog.updateMany(
      { _id: { $in: ids } },
      { 
        hide,
        updatedAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: `Updated hide status to "${hide}" for ${result.modifiedCount} worklogs`,
      data: { modifiedCount: result.modifiedCount }
    });

  } catch (error) {
    console.error("❌ Error bulk updating hide status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while bulk updating hide status",
      error: error.message
    });
  }
};