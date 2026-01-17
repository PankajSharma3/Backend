import User from '../model/userModel.js';
import generateToken from '../lib/utils/generateToken.js';
import Items from '../model/itemModel.js';

export const signup = async (req, res) => {
    try {
        const { username, password, role, displayName } = req.body;
        if (!username || !password || !role) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const existingUser = await User.findOne({ username: username, role: role });
        const existingDisplayName = await User.findOne({ displayName: displayName });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        if (existingDisplayName) {
            return res.status(400).json({ error: "Display name already exists" });
        }
        const newUser = new User({ username, password, role, displayName });
        await newUser.save();
        const token = await generateToken(newUser._id, res);
        return res.status(201).json({
            message: "User created successfully",
            userId: newUser._id,
            username: newUser.username,
            role: newUser.role,
            displayName: newUser.displayName,
            token: token // Include token for mobile apps
        });
    }
    catch (error) {
        console.error("Signup error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

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
        const token = await generateToken(user._id, res);
        return res.status(200).json({
            message: "Login successful",
            userId: user._id,
            username: user.username,
            role: user.role,
            displayName: user.displayName,
            token: token // Include token for mobile apps
        });
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

export const deleteUser = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        // Delete user
        const deletedUser = await User.findOneAndDelete({ username });
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete associated items/inventory
        await Items.deleteMany({ username });

        res.status(200).json({ message: "User and associated inventory deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}