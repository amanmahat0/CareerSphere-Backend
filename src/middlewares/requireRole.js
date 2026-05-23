/**
 * Middleware to check user role-based access
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    // Check if user's role/userType is in allowed roles
    const userRole = req.user.role || req.user.userType;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not have permission to perform this action.",
      });
    }

    next();
  };
};

export default requireRole;
