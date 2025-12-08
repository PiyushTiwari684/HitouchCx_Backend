import prisma from '../../../config/db.js'; 


//Convert ms to hours
const msToHours = ms => ms / (1000 * 60 * 60);

//getting the ranges within which we need the hours from
const getTimeRanges = () => {
  // compute date ranges (simple UTC-based)
  const now = new Date();
  // month: start at first day of current month, end at first day of next month
  // 1st day of current month of current year midnight
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  // 1st day of next month of current year midnight
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));

  // week (Monday start): find Monday of the current week and end after 7 days
  const day = now.getUTCDay(); // returns a number for day like wednesday will be 3
  const daysFromMonday = (day + 6) % 7; // 0 for Monday, 1 for Tuesday, etc.

  //Date for today
  const weekStartLocal = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

  // Moving the today date back to monday
  weekStartLocal.setUTCDate(weekStartLocal.getUTCDate() - daysFromMonday);

  //Week First Day midnight
  const weekStart = new Date(Date.UTC(weekStartLocal.getUTCFullYear(), weekStartLocal.getUTCMonth(), weekStartLocal.getUTCDate(), 0, 0, 0));
  // Creates copy of weekStart to have weekend midnight date
  const weekEnd = new Date(weekStart);
  //Next Monday meaning end of the current weak
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  return { monthStart, monthEnd, weekStart, weekEnd }
}

// compute hours for a single activity log clamped inside a date range
const hoursFromLogInRange = (log, rangeStart, rangeEnd) => {
  if (!log || !log.startTime || !log.endTime) return 0; // skip open/invalid logs
  const start = new Date(log.startTime);
  const end = new Date(log.endTime);
  if (end <= start) return 0; // Invalid log

  // no overlap
  if (start >= rangeEnd || end <= rangeStart) return 0;

  //If activity log started before rangeStart and still going on then add rangeStart else start
  const s = start < rangeStart ? rangeStart : start;
  //If activity log ended after rangeEnd then add rangeEnd else the end
  const e = end > rangeEnd ? rangeEnd : end;

  if (e <= s) return 0;

  return msToHours(e - s);
}

// sum hours of logs in a range
const hoursWorkedInRange = (activityLogs = [], rangeStart, rangeEnd) => {
  return activityLogs.reduce((acc, curr) => acc + hoursFromLogInRange(curr, rangeStart, rangeEnd), 0);
}


const getDashboardInfo = async (req, res) => {
  try {
    const { agentId } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        firstName: true,
        profilePhotoUrl: true,


        //Gig Application
        GigApplication: {
          select: {
            opportunity: {
              select: {
                title: true,
                category: true,
                deadline: true,
                payAmount: true
              }
            },
            selectedGig: {
              select: {
                id: true,
                status: true,
                activityLogs: true,
                createdAt: true,
                submittedWorks: {
                  select: {
                    id: true,
                    title: true,
                    Payment: true
                  }
                }
              }
            }
          }
        },

        // Timestamps
        createdAt: true,
        updatedAt: true,

      }
    });
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // flatten all activity logs across all gig applications/selected gigs
    //flatMap is used to get arrays values : [[1,20],3,4] as [1,20,3,4]
    const allActivityLogs = (agent.GigApplication || [])
      .flatMap(ga => ga.selectedGig ? (ga.selectedGig.activityLogs || []) : []);


    const { monthStart, monthEnd, weekStart, weekEnd } = getTimeRanges()

    //Getting final hours
    const totalHoursThisMonth = Math.round(hoursWorkedInRange(allActivityLogs, monthStart, monthEnd) * 100) / 100;
    const totalHoursThisWeek = Math.round(hoursWorkedInRange(allActivityLogs, weekStart, weekEnd) * 100) / 100;

    //Payments Logic

    // Flatten all payments from submitted works
    const allPayments = (agent.GigApplication || [])
      .flatMap(ga => ga.selectedGig?.submittedWorks || [])
      .flatMap(sw => sw.Payment || []);


    // Task-based payments (grouped by submitted work)
    const taskPayments = (agent.GigApplication || [])
      .flatMap(ga => ga.selectedGig?.submittedWorks || [])
      .map(sw => ({
        submittedWorkId: sw.id,
        title: sw.title,
        payments: sw.Payment || []
      }));

    // console.log(taskPayments)

    // Pending payments
    const pendingPayments = allPayments.filter(p => p.status === 'PENDING');


    // Total payments made (sum of completed payments)
    const totalPaymentsMade = allPayments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    //Active Projects/Work/Gigs

    // Gigs on hold (SelectedGig.status === 'IN_PROGRESS')
    const gigsInProgress = (agent.GigApplication || [])
      .filter(ga => ga.selectedGig?.status === 'IN_PROGRESS')
      .map(ga => {
        const log = ga.selectedGig?.activityLogs?.[0] || null;
        return {
          opportunity: ga.opportunity,
          status: ga.selectedGig.status,
          lastActivityLog: log,
          opportunity: ga.opportunity,
        };
      });

    console.log(gigsInProgress)

    return res.status(200).json({
      success: true,
      data: {
        agentName:agent.firstName,
        profileUrl:agent.profilePhotoUrl,
        totalHoursThisMonth,
        totalHoursThisWeek,
        taskPayments,
        pendingPayments,
        totalPaymentsMade,
        gigsInProgress
      }
    });

  } catch (error) {
    console.error('Error fetching agent:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch agent information',
      message: error.message
    });
  }
};

export { getDashboardInfo };