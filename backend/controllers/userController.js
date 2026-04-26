const userModel = require('../models/userModel.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const validator = require('validator');

const createToken = (id) => {
    return jwt.sign({id}, process.env.SECRET, { expiresIn: '2d' })
}

exports.signup = async (req, res) => {
    try {
        const { name, password, email } = req.body;
        if (!name || !password || !email) {
            return res.status(400).json({ "message": "All fields are mandatory" });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ "message": "Please enter a valid email" });
        }
        if (!validator.isStrongPassword(password)) {
            return res.status(400).json({ "message": "Please Enter a strong Password" });
        }

        const exists = await userModel.findOne({ email: email });

        if (exists) {
            return res.status(400).json({ "message": "email already exists" });
        }

        let newpw = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({ name: name, email: email, password: newpw, profilepic: null });

        const token = createToken(newUser._id);

       return res.status(200).json({ token, email, _id: newUser._id, name: newUser.name });

    }
    catch (error) {
        console.log(error);
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ "message": "all fields are mandatory" });
        }

        const exists = await userModel.findOne({ email: email });

        if (!exists) {
            return res.status(400).json({ "message": "email does not exists" });
        }

        const match = await bcrypt.compare(password, exists.password);

        if (!match) {
            return res.status(400).json({ "message": "Invalid Credentials" });
        }

        const token = createToken(exists._id);
        return res.status(200).json({ token, email, _id: exists._id, name: exists.name });
    }
    catch (error) {
        console.log(error);
    }

}