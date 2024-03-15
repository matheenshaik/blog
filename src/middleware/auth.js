const jwt = require("jsonwebtoken")



const authentication = function (req, res, next) {
    {
        try {
            let token = req.headers["x-api-key"];
            // console.log(token);

            if (!token) {
                return res.send({ status: false, msg: "token must be present in the request header" })
            }
            let decodedToken = jwt.verify(token, "functionUp-project1")
            // console.log(decodedToken);
            if (!decodedToken) return res.status(401).send({ status: false, msg: "token is not valid" })
            req["decodedToken"] = decodedToken
            next()
        } catch (err) {
            console.log("This is the error :", err.message)
            res.status(500).send({ msg: " server Error", error: err.message })

        }
    }
}




module.exports.authentication = authentication;
