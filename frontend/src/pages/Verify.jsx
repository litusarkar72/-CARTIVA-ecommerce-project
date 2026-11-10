
import React, { useContext, useEffect, useRef, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Verify = () => {
    const {
        navigate,
        token,
        setCartItems,
        backendUrl
    } = useContext(ShopContext);

    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);

    const sessionId = searchParams.get("session_id");
    const success = searchParams.get("success");

    const started = useRef(false);

    useEffect(() => {
        if (!token || started.current) return;

        started.current = true;

        const verifyPayment = async () => {
            try {
                if (success === "false") {
                    toast.info("Payment cancelled.");
                    navigate("/cart", { replace: true });
                    return;
                }

                if (!sessionId) {
                    toast.error("Stripe session ID missing.");
                    navigate("/cart", { replace: true });
                    return;
                }

                const { data } = await axios.post(
                    backendUrl + "/api/order/verifyStripe",
                    { sessionId },
                    { headers: { token } }
                );

                if (data.success) {
                    setCartItems({});
                    toast.success("Payment successful! Order placed.");
                    navigate("/orders", { replace: true });
                } else {
                    toast.error(data.message || "Payment verification failed.");
                    navigate("/cart", { replace: true });
                }

            } catch (error) {
                console.error(
                    "Stripe verification error:",
                    error.response?.data || error.message
                );

                toast.error(
                    error.response?.data?.message ||
                    "Unable to verify payment."
                );

                navigate("/cart", { replace: true });

            } finally {
                setLoading(false);
            }
        };

        verifyPayment();

    }, [token, sessionId, success, backendUrl, navigate, setCartItems]);

    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <p>
                {loading
                    ? "Verifying your payment, please wait..."
                    : "Payment verification completed."}
            </p>
        </div>
    );
};

export default Verify;
