import User from '../model/userModel.js';
import generateToken from '../lib/utils/generateToken.js';

export const login = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password || !role) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const user = await User.findOne({ username: username, role: role });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (password != user.password) {
            return res.status(400).json({ error: "Incorrect password" });
        }
        generateToken(user._id, res);
        return res.status(200).json({ message: "Login successful", userId: user._id, username: user.username, role: user.role });
    }
    catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json({ user });
    }
    catch (error) {
        console.error("Get profile error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}