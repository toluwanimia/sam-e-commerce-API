const express = require('express')
const router = express.Router()
const { authenticateUser, authorizePermissions } = require('../middleware/authentication')
const {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    uploadProduct,
} = require('../controllers/productController')
const { getSingleProductReviews } = require('../controllers/reviewController')


router
    .route('/')
    .post(authenticateUser, authorizePermissions('admin', 'owner'), createProduct)
    .get(getAllProducts)

// upload image must be above /:id
router
    .route('/uploadImage').post(authenticateUser, authorizePermissions('admin', 'owner'), uploadProduct)

router.
    route('/:id')
    .get(getSingleProduct)
    .patch(authenticateUser, authorizePermissions('admin', 'owner'), updateProduct)
    .delete(authenticateUser, authorizePermissions('admin', 'owner'), deleteProduct)

    router.route('/:id/reviews').get(getSingleProductReviews)

module.exports = router