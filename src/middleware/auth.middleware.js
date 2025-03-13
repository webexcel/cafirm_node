import jwttoken from "jsonwebtoken";
import createKnexInstance from "../../configs/db.js";

export const generateAccessToken = (user) => {
  return jwttoken.sign(user, process.env.JWT_SECRET_KEY, {
    expiresIn: "24h",
  });
};

export const generateRefreshToken = (user) => {
  return jwttoken.sign(user, process.env.TOKEN_SECRET, {
    expiresIn: "1d",
  });
};

export const validateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(400).send("Token not present");
  }

  jwttoken.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) {
      console.error("Token verification error:", err);
      if (err.name === "TokenExpiredError") {
        return res.status(401).send("Token Expired");
      }
      return res.status(403).send("Token invalid");
    } else {
      req.user = user;
      next();
    }
  });
};

export const refreshToken = async (req, res) => {
  
  const knex = createKnexInstance();

  const { token } = req.body;

  if (token) {
    const getUserTable = await knex("main.tokens")
      .select("refresh_token", "user_name", "id", "UserId")
      .where({
        acesstoken: token,
      });

    if (getUserTable) {
      try {
        const { refresh_token, user_name, id, UserId } = getUserTable[0];

        jwttoken.verify(
          refresh_token,
          process.env.TOKEN_SECRET,
          async (err, user) => {
            if (err) {
              console.error("Refresh Token verification error:", err.name);

              if (err.name === "TokenExpiredError") {
                return res.status(401).send("Refresh Token Expired");
              }
            } else {
              const accessToken = generateAccessToken({ user_name: user_name });
              const userData = await knex("main.tokens")
                .select("UserId", "firstname")
                .where({
                  refresh_token: refresh_token,
                })
                .update({
                  acesstoken: accessToken,
                });
              return res.status(200).json({
                token: accessToken,
                messages: "new access token generated successfully",
              });
            }
          }
        );
      } catch (err) {
        return res.status(404).json({
          message: "Cannot fetch data in data",
        });
      }
    } else {
      return res.status(403).json({
        message: "Invalid Token",
      });
    }
  } else {
    return res.status(404).json({
      message: "token not taken",
    });
  }
};
