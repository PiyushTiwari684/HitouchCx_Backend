import prisma from '../../../config/db.js'; 


const addBankDetails = async (req, res) => {
  try {
    const { id } = req.user; // Assuming userId comes from auth middleware
    const { 
      bankAccountNumber, 
      bankIFSC, 
      accountHolderName, 
      panNumber 
    } = req.body;

    // Validate required fields
    if (!bankAccountNumber || !bankIFSC || !accountHolderName || !panNumber) {
      return res.status(400).json({
        success: false,
        message: 'All bank details are required: bankAccountNumber, bankIFSC, accountHolderName, panNumber'
      });
    }

    // Validate IFSC format (basic validation)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(bankIFSC)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IFSC code format'
      });
    }

    // Validate PAN format (basic validation)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PAN number format'
      });
    }

    // Check if agent exists
    const agent = await prisma.agent.findUnique({
      where: { userId : id}
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found'
      });
    }

    // Update bank details
    const updatedAgent = await prisma.agent.update({
      where: { userId : id},
      data: {
        bankAccountNumber,
        bankIFSC: bankIFSC.toUpperCase(),
        accountHolderName: accountHolderName.trim(),
        panNumber: panNumber.toUpperCase()
      },
      select: {
        id: true,
        bankAccountNumber: true,
        bankIFSC: true,
        accountHolderName: true,
        panNumber: true,
        updatedAt: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Bank details updated successfully',
      data: updatedAgent
    });

  } catch (error) {
    console.error('Error adding bank details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update bank details',
      error: error.message
    });
  }
};


const getBankDetails = async (req, res) => {
  try {
    const { id } = req.user;

    const agent = await prisma.agent.findUnique({
      where: { userId:id },
      select: {
        bankAccountNumber: true,
        bankIFSC: true,
        accountHolderName: true,
        panNumber: true
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found'
      });
    }

    // Mask sensitive information
    const maskedBankDetails = {
      bankAccountNumber: agent.bankAccountNumber 
        ? `****${agent.bankAccountNumber.slice(-4)}` 
        : null,
      bankIFSC: agent.bankIFSC,
      accountHolderName: agent.accountHolderName,
      panNumber: agent.panNumber 
        ? `${agent.panNumber.slice(0, 2)}****${agent.panNumber.slice(-4)}` 
        : null,
      isComplete: !!(agent.bankAccountNumber && agent.bankIFSC && agent.accountHolderName && agent.panNumber)
    };

    return res.status(200).json({
      success: true,
      data: maskedBankDetails
    });

  } catch (error) {
    console.error('Error fetching bank details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bank details',
      error: error.message
    });
  }
};
    

export {addBankDetails,getBankDetails}