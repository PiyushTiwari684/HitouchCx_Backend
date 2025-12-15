import prisma from '../../../config/db.js';
import { buildProgress } from '../../../utils/onboardProgress.js';

const getProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        profileCompleted: true,
        kycCompleted: true,
        assessmentStatus: true,
        agreementSigned: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json(buildProgress(user));
  } catch (e) {
    return res.status(500).json({ error: 'Failed to get progress' });
  }
};


export {getProgress}