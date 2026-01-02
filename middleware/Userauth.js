import jwt from 'jsonwebtoken';
import  ActiveSession  from '../models/ActiveSession.js'
import User  from '../models/User.js';


const isAuthenticatedUser = async (req, res, next) => {
  try {
    // Get token from Authorization Header (Bearer Token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split(' ')[1]; // Extract token

    // Verify the token
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    // Check if active session exists for the user
    const activeSession = await ActiveSession.findOne({
      where: { user_id: decodedData.user_id }
    });

    if (!activeSession || activeSession.token !== token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid session' });
    }

    // Fetch user details
    const user = await User.findOne({ where: { user_id: decodedData.user_id } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Attach user and chat history to request
    req.user = user;

    
    next(); // Proceed to next middleware
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export { isAuthenticatedUser };
