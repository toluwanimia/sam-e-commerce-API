const Order = require('../models/Order')
const Product = require('../models/Product')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const { checkPermissions } = require('../utils')

const fakeStripeAPI = async({amount, currency})=>{
    const client_secret = 'someRandomValue'
    return {client_secret, amount}
}

const createOrder = async (req, res) => {
    const { items: cartItems, tax, shippingFee } = req.body
    if(!cartItems || cartItems.length < 1){
        throw new CustomError.BadRequestError('No cart items provided')
    }
    if(!tax || !shippingFee){
        throw new CustomError.BadRequestError('Please provide tax and shipping fee')
    }
    let orderItems = []
    let subtotal = 0;
    // the below is called a for-loop functionality
    // we used this because the awaiting product(s) is an array
    for(const item of cartItems){
        const dbProduct = await Product.findOne({_id: item.product})
        if(!dbProduct){
            throw new CustomError.NotFoundError(`No product with id : ${item.product}`)
        }
        const { name, price, image, _id } = dbProduct
        // construction for singleOrderItem thats in the modal
        const singleOrderItem = {
            amount: item.amount,
            name, //ES6
            price,
            image,
            product: _id,
        }
        // add each item to order
        // orderItems.push(singleOrderItem) //this works as well
        orderItems = [...orderItems, singleOrderItem]
        // calculate subtotal 
        subtotal += item.amount * price
    }
    // calculate total
    const total = tax + shippingFee + subtotal
    // get client secret
    const paymentIntent = await fakeStripeAPI({
        amount: total,
        currency: 'USD'
    })
    const order = await Order.create({
        orderItems, 
        total, 
        subtotal, 
        tax, 
        shippingFee, 
        clientSecret: paymentIntent.client_secret,
        user: req.user.userId
    })
    
    res.status(StatusCodes.CREATED).json({order, clientSecret:order.clientSecret})
};
const getAllOrders = async (req, res) => {
    const orders = await Order.find({})
    if(!orders){
        throw new CustomError.NotFoundError('No Order Yet')
    }
    res.status(StatusCodes.OK).json({orders, count: orders.length})
};
const getCurrentUserOrder = async (req, res) => {
    // const user = req.user.userId
    // if(!user){
    //     throw new CustomError.NotFoundError('user not found')
    // }
    // const order = await Order.findOne({user : user})
    const orders = await Order.findOne({user : req.user.userId})
    if(!orders || orders.length === 0 ){
        throw new CustomError.NotFoundError('No Order Yet')
    }
    res.status(StatusCodes.OK).json({orders, count: orders.length})
};
const getSingleOrder = async (req, res) => {
    const orderId = req.params.id
    if(!orderId){
        throw new CustomError.BadRequestError('Order Id Needed')
    }
    const order = await Order.findOne({_id : orderId})
    if(!order){
        throw new CustomError.NotFoundError(`no order with id of ${orderId}`)
    }
    checkPermissions(req.user, order.user)
    res.status(StatusCodes.OK).json({order})
};
const updateOrder = async (req, res) => {
    const orderId = req.params.id
    const { paymentIntentId } = req.body;
    const order = await Order.findOne({_id : orderId})
    if(!order){
        throw new CustomError.NotFoundError(`Order with id of ${orderId}`)
    }
    checkPermissions(req.user, order.user)
    order.paymentIntentId = paymentIntentId,
    order.status = 'paid'
    await order.save() 

    res.status(StatusCodes.OK).json({order})
};

module.exports = {
    createOrder, 
    getAllOrders,
    getCurrentUserOrder,
    getSingleOrder,
    updateOrder,
}