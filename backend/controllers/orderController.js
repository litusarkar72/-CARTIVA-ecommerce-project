import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'
import razorpay from 'razorpay'
import crypto from "crypto";

// global variables
const currency = 'inr'
const razorpayCurrency = "INR";
const deliveryCharge = 10

//gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET,
}) 

//placing orders using cod method
const placeOrder = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { items, amount, address } = req.body;

        if (!userId || !items?.length || amount == null || !address) {
            return res.status(400).json({
                success: false,
                message: "Missing order details"
            });
        }

        const orderData = {
            userId,
            items,
            amount,
            address,
            paymentMethod: "COD",
            payment: false,
            status: "Order Placed",
            date: Date.now()
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        await userModel.findByIdAndUpdate(userId, {
            cartData: {}
        });

        return res.json({
            success: true,
            message: "Order Placed Successfully"
        });

    } catch (error) {
        console.error("Place COD order error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//placing orders using stripe method
const placeOrderStripe = async (req, res) => {
    let newOrder;

    try {
        const userId = req.userId || req.body.userId;
        const { items, amount, address } = req.body;
        const origin = req.headers.origin;

        if (!userId || !items?.length || amount == null || !address) {
            return res.status(400).json({
                success: false,
                message: "Missing order details"
            });
        }

        const orderData = {
            userId,
            items,
            amount,
            address,
            paymentMethod: "Stripe",
            payment: false,
            status: "Payment Pending",
            date: Date.now()
        };

        // Save the order temporarily
        newOrder = await orderModel.create(orderData);

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: Math.round(Number(item.price) * 100)
            },
            quantity: item.quantity
        }));

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Delivery Charges"
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        });

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: "payment",
            metadata: {
                orderId: newOrder._id.toString()
            }
        });

        return res.json({
            success: true,
            session_url: session.url
        });

    } catch (error) {
        console.error("Stripe order error:", error);

        // Remove the order if checkout-session creation failed
        if (newOrder?._id) {
            try {
                await orderModel.findByIdAndDelete(newOrder._id);
            } catch (cleanupError) {
                console.error("Order cleanup error:", cleanupError);
            }
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// verify stripe


const verifyStripe = async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Stripe session ID is missing"
            });
        }

        // Verify payment directly with Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Payment is not completed"
            });
        }

        const orderId = session.metadata?.orderId;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID missing"
            });
        }

        const order = await orderModel.findById(orderId);

        if (!order || order.paymentMethod !== "Stripe") {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Prevent another user from verifying this order
        if (String(order.userId) !== String(req.userId)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // Verify amount and currency against the order
        if (
            session.currency !== "inr" ||
            session.amount_total !== Math.round(Number(order.amount) * 100)
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment amount mismatch"
            });
        }

        if (!order.payment) {
            order.payment = true;
            order.status = "Order Placed";
            await order.save();

            await userModel.findByIdAndUpdate(order.userId, {
                cartData: {}
            });
        }

        return res.json({
            success: true,
            message: "Stripe payment verified successfully"
        });

    } catch (error) {
        console.error("Stripe verification error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//placing orders using razorpay method
const placeOrderRazorpay = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { items, amount, address } = req.body;

    if (!userId || !items?.length || !amount || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing order details",
      });
    }

    const newOrder = await orderModel.create({
      userId,
      items,
      amount,
      address,
      paymentMethod: "Razorpay",
      payment: false,
      status: "Payment Pending",
      date: Date.now(),
    });

    try {
    const razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        receipt: newOrder._id.toString(),
    });

    return res.json({
        success: true,
        order: razorpayOrder,
    });
} catch (error) {
      await orderModel.findByIdAndDelete(newOrder._id);
      throw error;
    }
  } catch (error) {
    console.error("Razorpay order error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// verify Razorpay

const verifyRazorpay = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing payment details"
            });
        }

        // Generate expected signature
        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        // Secure signature comparison
        const expected = Buffer.from(expectedSignature, "hex");
        const received = Buffer.from(razorpay_signature, "hex");

        if (
            expected.length !== received.length ||
            !crypto.timingSafeEqual(expected, received)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // Fetch payment from Razorpay
        const payment = await razorpayInstance.payments.fetch(
            razorpay_payment_id
        );

        if (
            payment.order_id !== razorpay_order_id ||
            payment.status !== "captured"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment not captured"
            });
        }

        // Fetch Razorpay order
        const razorpayOrder = await razorpayInstance.orders.fetch(
            razorpay_order_id
        );

        const order = await orderModel.findById(
            razorpayOrder.receipt
        );

        if (!order || order.paymentMethod !== "Razorpay") {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (String(order.userId) !== String(req.userId)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (
            razorpayOrder.currency !== "INR" ||
            Number(razorpayOrder.amount) !==
                Math.round(Number(order.amount) * 100)
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment amount mismatch"
            });
        }

        if (!order.payment) {
            order.payment = true;
            order.status = "Order Placed";
            await order.save();

            await userModel.findByIdAndUpdate(order.userId, {
                cartData: {}
            });
        }

        return res.json({
            success: true,
            message: "Razorpay payment verified successfully"
        });

    } catch (error) {
        console.error("Razorpay verification error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



//All orders data for admin panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({
            $or: [
                { paymentMethod: "COD" },
                { payment: true }
            ]
        }).sort({ date: -1 });

        return res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error("All orders error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//user orders data for frontend
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body;

        const orders = await orderModel.find({
            userId,
            $or: [
                { paymentMethod: "COD" },
                { payment: true }
            ]
        }).sort({ date: -1 });

        return res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error("User orders error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//update order status from admin panel
const updateStatus = async (req, res) => {
    try {
        const {
            orderId,
            status
        } = req.body

        await orderModel.findByIdAndUpdate(orderId, {
            status
        })
        res.json({
            success: true,
            message: 'Status Updated'
        })


    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}

export {
    placeOrder,
    placeOrderStripe,
    placeOrderRazorpay,
    allOrders,
    userOrders,
    updateStatus,
    verifyStripe,
    verifyRazorpay
}