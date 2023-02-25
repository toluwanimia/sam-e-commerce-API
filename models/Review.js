const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    rating : {
        type : Number,
        min: 1,
        max: 5,
        required : [ true, 'please, rate the product']
    },
    title : {
        type : String,
        trim: true,
        maxlength: 100,
        required : [ true, 'title can not be empty']
    },
    comment : {
        type : String,
        maxlength: 500,
        required : [ true, 'please, comment on the product']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
    },
}, {timestamps: true} )
// the below makes it imposible for a user to review a product twice
ReviewSchema.index({product:1, user:1}, {unique: true})

// 

ReviewSchema.statics.calculateAverateRating = async function(productId) {
    const result = await this.aggregate([
        { $match: {product: productId} },
        {$group: {
            _id: null, averageRating:{$avg: '$rating'},
            numOfReviews: {$sum: 1},
        }}
    ])
    console.log(result)
    try {
        await this.model('Product').findOneAndUpdate({_id: productId},{
            averageRating: Math.ceil(result[0]?.averageRating || 0),
            numOfReviews: result[0]?.numOfReviews || 0
        })
    } catch (error) {
        console.log(error)
    }
    
    // ([
    //     {
    //         '$match': {
    //             'product': new ObjectId('63f43d757f875c14439e8af3')
    //         }
    //         }, { 
    //         '$group': {
    //             '_id': null, 
    //             'averageRating': {
    //             '$avg': '$rating'
    //             }, 
    //             'numOfReviews': {
    //             '$sum': 1
    //             }
    //         }
    //         }
    // ])
}

ReviewSchema.post('save', async function(){
    await this.constructor.calculateAverateRating(this.product)
})
ReviewSchema.post('remove', async function(){
    await this.constructor.calculateAverateRating(this.product)
})

module.exports = mongoose.model( 'Review', ReviewSchema)