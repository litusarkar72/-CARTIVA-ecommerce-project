
import React, { useContext, useState } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

function PlaceOrder() {
  const [method, setMethod] = useState("cod");
  const [loading, setLoading] = useState(false);

  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products,
  } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;

    setFormData((data) => ({
      ...data,
      [name]: value,
    }));
  };

  // =====================================
  // RAZORPAY PAYMENT
  // =====================================

  const initPay = (razorpayOrder) => {
    if (!window.Razorpay) {
      toast.error("Razorpay SDK not loaded.");
      setLoading(false);
      return;
    }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();

    if (!razorpayKey) {
      toast.error("Razorpay Key ID is missing.");
      setLoading(false);
      return;
    }

    if (!razorpayOrder?.id) {
      toast.error("Razorpay order ID is missing.");
      setLoading(false);
      return;
    }

    const options = {
      key: razorpayKey,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "Forever",
      description: "Order Payment",
      order_id: razorpayOrder.id,

      handler: async (paymentResponse) => {
        try {
          const { data } = await axios.post(
            backendUrl + "/api/order/verifyRazorpay",
            {
              razorpay_order_id:
                paymentResponse.razorpay_order_id,

              razorpay_payment_id:
                paymentResponse.razorpay_payment_id,

              razorpay_signature:
                paymentResponse.razorpay_signature,
            },
            {
              headers: { token },
            }
          );

          if (data.success) {
            setCartItems({});
            toast.success("Payment successful! Order placed.");
            navigate("/orders");
          } else {
            toast.error(
              data.message || "Payment verification failed."
            );
          }
        } catch (error) {
          console.error(
            "Razorpay verification error:",
            error.response?.data || error.message
          );

          toast.error(
            error.response?.data?.message ||
            "Payment verification failed. Please contact support."
          );
        } finally {
          setLoading(false);
        }
      },

      modal: {
        ondismiss: () => {
          toast.info("Payment window closed.");
          setLoading(false);
        },
      },

      theme: {
        color: "#3399cc",
      },
    };

    const paymentObject = new window.Razorpay(options);

    paymentObject.on("payment.failed", (response) => {
      console.error("Razorpay payment failed:", response.error);

      toast.error(
        response.error?.description || "Payment failed."
      );

      setLoading(false);
    });

    paymentObject.open();
  };

  // =====================================
  // PLACE ORDER
  // =====================================

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!token) {
      toast.error("Please log in to place your order.");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const orderItems = [];

      for (const productId in cartItems) {
        for (const size in cartItems[productId]) {
          const quantity = cartItems[productId][size];

          if (quantity > 0) {
            const product = products.find(
              (item) => item._id === productId
            );

            if (product) {
              orderItems.push({
                ...product,
                size,
                quantity,
              });
            }
          }
        }
      }

      if (orderItems.length === 0) {
        toast.error("Your cart is empty.");
        setLoading(false);
        return;
      }

      const orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + delivery_fee,
      };

      // =================================
      // CASH ON DELIVERY
      // =================================

      if (method === "cod") {
        const { data } = await axios.post(
          backendUrl + "/api/order/place",
          orderData,
          {
            headers: { token },
          }
        );

        if (data.success) {
          setCartItems({});
          toast.success("Order placed successfully!");
          navigate("/orders");
        } else {
          toast.error(data.message || "Order placement failed.");
        }

        setLoading(false);
        return;
      }

      // =================================
      // STRIPE
      // =================================

      if (method === "stripe") {
        const { data } = await axios.post(
          backendUrl + "/api/order/stripe",
          orderData,
          {
            headers: { token },
          }
        );

        if (data.success && data.session_url) {
          // Keep loading active during redirect
          window.location.href = data.session_url;
          return;
        }

        toast.error(
          data.message || "Unable to start Stripe checkout."
        );

        setLoading(false);
        return;
      }

      // =================================
      // RAZORPAY
      // =================================

      if (method === "razorpay") {
        const { data } = await axios.post(
          backendUrl + "/api/order/razorpay",
          orderData,
          {
            headers: { token },
          }
        );

        if (data.success && data.order) {
          initPay(data.order);
          return;
        }

        toast.error(
          data.message || "Unable to create Razorpay order."
        );

        setLoading(false);
        return;
      }

    } catch (error) {
      console.error(
        "Place order error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
        "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  };

  // =====================================
  // PAGE UI
  // =====================================

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t"
    >
      {/* DELIVERY INFORMATION */}

      <div className="flex flex-col gap-4 w-full sm:max-w-120">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1="DELIVERY" text2="INFORMATION" />
        </div>

        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="firstName"
            value={formData.firstName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="First name"
          />

          <input
            required
            onChange={onChangeHandler}
            name="lastName"
            value={formData.lastName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Last name"
          />
        </div>

        <input
          required
          onChange={onChangeHandler}
          name="email"
          value={formData.email}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="email"
          placeholder="Email address"
        />

        <input
          required
          onChange={onChangeHandler}
          name="street"
          value={formData.street}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text"
          placeholder="Street"
        />

        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="city"
            value={formData.city}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="City"
          />

          <input
            required
            onChange={onChangeHandler}
            name="state"
            value={formData.state}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="State"
          />
        </div>

        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="zipcode"
            value={formData.zipcode}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Zipcode"
          />

          <input
            required
            onChange={onChangeHandler}
            name="country"
            value={formData.country}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Country"
          />
        </div>

        <input
          required
          onChange={onChangeHandler}
          name="phone"
          value={formData.phone}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="tel"
          placeholder="Phone"
        />
      </div>

      {/* PAYMENT INFORMATION */}

      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>

        <div className="mt-12">
          <Title text1="PAYMENT" text2="METHOD" />

          <div className="flex gap-3 flex-col lg:flex-row">

            {/* STRIPE */}

            <div
              onClick={() => !loading && setMethod("stripe")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "stripe" ? "bg-green-400" : ""
                }`}
              />

              <img
                className="h-5 mx-4"
                src={assets.stripe_logo}
                alt="Stripe"
              />
            </div>

            {/* RAZORPAY */}

            <div
              onClick={() => !loading && setMethod("razorpay")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "razorpay" ? "bg-green-400" : ""
                }`}
              />

              <img
                className="h-5 mx-4"
                src={assets.razorpay_logo}
                alt="Razorpay"
              />
            </div>

            {/* COD */}

            <div
              onClick={() => !loading && setMethod("cod")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "cod" ? "bg-green-400" : ""
                }`}
              />

              <p className="text-gray-500 text-sm font-medium mx-4">
                CASH ON DELIVERY
              </p>
            </div>
          </div>

          <div className="w-full text-end mt-8">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-16 py-3 text-sm disabled:opacity-50"
            >
              {loading ? "PROCESSING..." : "PLACE ORDER"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default PlaceOrder;
