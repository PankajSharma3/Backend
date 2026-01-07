import User from '../model/userModel.js';
import jwt from "jsonwebtoken";

// Optional authentication - doesn't block if no token (for development/mobile apps)
export const protectRoute = async (req, res, next) => {
	try {
		let token = req.cookies.jwt;

		// If no cookie, check Authorization header (for mobile apps)
		if (!token && req.headers.authorization) {
			const authHeader = req.headers.authorization;
			if (authHeader.startsWith('Bearer ')) {
				token = authHeader.substring(7);
			}
		}

		if (token) {
			try {
				const decoded = jwt.verify(token, process.env.JWT_SECRET);
				if (decoded) {
					const user = await User.findById(decoded.userId).select("-password");
					if (user) {
						req.user = user;
					}
				}
			} catch (tokenErr) {
				console.log("Token verification error:", tokenErr.message);
				// Continue without user - don't block
			}
		}

		next(); // Always continue
	} catch (err) {
		console.log("Error in protectRoute middleware", err.message);
		next(); // Continue even on error
	}
};