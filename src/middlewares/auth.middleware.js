import jwt from "jsonwebtoken";

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Helper function to generate JWT token
export const generateToken = (userId, userType) => {
  return jwt.sign(
    { id: userId, userType: userType },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );
};

export default { verifyToken, generateToken };
