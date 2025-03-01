import jwt from 'jsonwebtoken';



export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Extract token from Bearer header

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Forbidden' }); // Token invalid
      }
      req.user = user; // Attach user info to request object
      next();
    });
  } else {
    return res.status(401).json({ message: 'Unauthorized' }); // No token provided
  }
};