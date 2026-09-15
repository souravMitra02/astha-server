const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {

    const authHeader = req.headers.authorization;

     if (!authHeader) {
    return res.status(401).json({
      message: "অনুমতি নেই, টোকেন দেওয়া হয়নি",
    });
    }
    
    const token = authHeader.split(" ")[1];
     if (!token) {
    return res.status(401).json({
      message: "অনুমতি নেই, বৈধ টোকেন পাওয়া যায়নি",
    });
  }
    try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  console.log("decoded:", decoded);

  req.user = decoded;

  next();
} catch (error) {
  return res.status(401).json({
    message: "টোকেন অবৈধ অথবা মেয়াদ শেষ হয়েছে",
  });
}
};


module.exports = authMiddleware;