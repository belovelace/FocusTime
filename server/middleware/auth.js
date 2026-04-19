const jwt = require('jsonwebtoken');
module.exports = function(req,res,next){
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthenticated' });
  const token = auth.slice(7);
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    // If userId was serialized as a string, convert back to BigInt when possible
    let uid = payload.userId;
    if (typeof uid === 'string' && /^\d+$/.test(uid)) {
      try { uid = BigInt(uid); } catch (e) { /* leave as string if conversion fails */ }
    }
    req.userId = uid;
    req.userRole = payload.role;
    next();
  }catch(e){
    return res.status(401).json({ error: 'invalid token' });
  }
};
