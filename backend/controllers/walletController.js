const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

// Get User Wallet Balance and Activity History
const getWalletDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('name email walletBalance');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      walletBalance: user.walletBalance || 0,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletBalance: user.walletBalance || 0
      },
      transactions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWalletDetails
};
