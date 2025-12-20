const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.headers['x-auth-token'] || req.headers['authorization'] && req.headers['authorization'].split(' ')[1] || req.cookies.token;
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};