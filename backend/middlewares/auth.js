const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "No token provided" });
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ error: "Formato de token inválido" });
  const token = parts[1];
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "change_this_secret",
    );
    req.user = payload;
    next();
  } catch (_) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};
