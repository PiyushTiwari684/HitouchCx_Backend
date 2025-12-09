import prisma from '../../../config/db.js'; 

async function addBankDetails(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { bankAccountNumber, bankIFSC, accountHolderName, panNumber } = req.body || {};

    // Basic validation
    if (!bankAccountNumber || !bankIFSC || !accountHolderName) {
      return res.status(400).json({
        message: 'bankAccountNumber, bankIFSC, and accountHolderName are required',
      });
    }

    // Ensure agent exists
    const agent = await prisma.agent.findUnique({ where: { userId } });
    if (!agent) {
      return res.status(404).json({ message: 'Agent profile not found' });
    }

    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        bankAccountNumber,
        bankIFSC,
        accountHolderName,
        panNumber: panNumber ?? agent.panNumber,
      },
      select: {
        id: true,
        bankAccountNumber: true,
        bankIFSC: true,
        accountHolderName: true,
        panNumber: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ message: 'Bank details saved', data: updated });
  } catch (err) {
    console.error('addBankDetails error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getBankDetails(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId },
      select: {
        id: true,
        bankAccountNumber: true,
        bankIFSC: true,
        accountHolderName: true,
        panNumber: true,
        updatedAt: true,
      },
    });

      if (!agent) {
      return res.status(404).json({ message: 'Agent profile not found' });
    }

    return res.status(200).json({ message: 'Bank details fetched', data: agent });
  } catch (err) {
    console.error('getBankDetails error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


export {addBankDetails,getBankDetails}