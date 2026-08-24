export const requirePlan = (allowedPlans = ["premium", "enterprise"]) => {
  return (req, res, next) => {
    const userPlan = req.user?.subscriptionPlan || "free";
    if (!allowedPlans.includes(userPlan)) {
      return res.status(403).json({
        message: `Tính năng này yêu cầu gói ${allowedPlans.join(" hoặc ").toUpperCase()}. Vui lòng nâng cấp tài khoản!`,
        requiredPlan: allowedPlans,
      });
    }
    next();
  };
};
