const authorModel = require('../models/authorModel')
const jwt = require("jsonwebtoken")
let regex = new RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}');


// VALIDATION
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};



/***************************************************Create Author********************************************************/
//
const createAuthor = async function (req, res) {
    try {
        let data = req.body
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ Error: "Body  should be not empty" })
        }
        if (!isValid(data.fname)) return res.status(400).send({ status: false, msg: "fname is Required" })

        if (!isValid(data.lname)) return res.status(400).send({ status: false, msg: "lname is Required" })

        if (!isValid(data.title)) return res.status(400).send({ status: false, msg: "title is Required" })
        if (data.title !== "Mr" && data.title !== "Mrs" && data.title !== "Miss") return res.status(400).send({ status: false, msg: "title should be Mr, Mrs or Miss" })

        if (!isValid(data.password)) return res.status(400).send({ status: false, msg: "password is Required" })

        if (!isValid(data.email)) return res.status(400).send({ status: false, msg: "email is Required" }) 
        let checkMail = regex.test(data.email)
        if (checkMail == false) return res.status(400).send({ status: false, msg: "email is not valid" })

        let emailCheck = await authorModel.findOne({ email: data.email })
        if (emailCheck) return res.status(400).send({ status: false, msg: "email already used" })

        let authorCreated = await authorModel.create(data)
        res.status(201).send({status: true, msg: "author successfully created", data: authorCreated })
    }
    catch (error) {

        return res.status(500).send({ status: false, msg: error.message })
    }


}


/*************************************************Login Author**********************************************************/
let loginAuthor = async function (req, res) {
    try {
        let email = req.body.email;
        let password = req.body.password;

        if (!email) return res.status(400).send({ status: false, msg: 'please provide valid email id' });
        let checkMail = regex.test(email) 
        if (checkMail == false ) return res.status(400).send({ status: false, msg: "email is not valid" })

        if (!password) return res.status(400).send({ status: false, msg: 'please provide valid password' })

        let authors = await authorModel.findOne({ email: email, password: password });
        if (!authors) return res.status(400).send({
            status: false, msg: "email or the password is not correct",
        });

        let token = jwt.sign(
            {
                authorId: authors._id.toString(),
                project: 1,
                group: "group-51",
            },
            "functionUp-project1"
        );
        console.log(token);
        res.status(201).send({ status: true, data: { token } });
    } catch (err) {
        res.status(500).send({ msg: "Error", msg: err.message })
    }
};


module.exports.createAuthor = createAuthor
module.exports.loginAuthor = loginAuthor


