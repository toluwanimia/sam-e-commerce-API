const User = require('../models/User');
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
// const jwt = require('jsonwebtoken')
// const { createJWT, isTokenValid } = require('../utils')
const { attachCookiesToResponse, createTokenUser } = require('../utils')

const register = async (req, res) => {
    const { email, name, password } = req.body;
    const emailAlreadyExists = await User.findOne({email})
    if(emailAlreadyExists){
        throw new CustomError.BadRequestError('email already in use')
    }
    // first registered user is an admin
    const isFirstAccount = await User.countDocuments({}) === 0;
    const role = isFirstAccount? 'admin' : 'user';
    // we distructure just three input so no one can input admin role. we later add that admin role will be added only on first acoount
    const user = await User.create({name, email, password, role})

    const tokenUser = createTokenUser(user)

    attachCookiesToResponse({res, user:tokenUser})

    res.status(StatusCodes.CREATED).json({ user: tokenUser })
};

const login = async (req, res) => {
    const {password} = req.body;
    const email = req.body.email.toLowerCase()
    
    if (!email || !password){
        throw new CustomError.BadRequestError('please, provide all values')
    }
    const user = await User.findOne({email})
    if (!user) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials')
    } 
    const isPasswordCorrect = await user.comparePassword(password)
    if(!isPasswordCorrect) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials')
    }
    const tokenUser = createTokenUser(user)

    attachCookiesToResponse({res, user:tokenUser})
    res.status(StatusCodes.OK).json({ user: tokenUser })
};

const logout = async (req, res) => {
    res.cookie('token', 'loggedout', {
        httpOnly: true,
        expires: new Date(Date.now())
    })
    res.status(StatusCodes.OK).json({msg: 'logout successful'})
};


module.exports = {
    login,
    logout,
    register,
}