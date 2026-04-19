const jwt = require('jsonwebtoken');
module.exports = function(req,res,next){
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthenticated' });
  const token = auth.slice(7);
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  }catch(e){
    return res.status(401).json({ error: 'invalid token' });
  }
};
