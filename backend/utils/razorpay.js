import Razorpay from "razorpay"
import crypto from "crypto"

let razorpay = null

// Function to initialize Razorpay only when needed
export const initializeRazorpay = () => {
    console.log('🔍 Initializing Razorpay...')
    
    if (razorpay) {
        console.log('✅ Using existing Razorpay instance')
        return razorpay
    }

    // Debug: Log environment variables (masking sensitive data)
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log("🔍 Debug - Razorpay Credentials:", {
        keyIdExists: !!keyId,
        keyIdLength: keyId?.length,
        keyIdStart: keyId?.substring(0, 8),
        isTestKey: keyId?.startsWith('rzp_test_'),
        isLiveKey: keyId?.startsWith('rzp_live_'),
        keySecretExists: !!keySecret,
        keySecretLength: keySecret?.length,
        keySecretStart: keySecret?.substring(0, 4)
    });

    if (!keyId || !keySecret) {
        console.error("❌ Razorpay credentials missing:", {
            keyIdExists: !!keyId,
            keySecretExists: !!keySecret,
            envFile: '.env',
            expectedFormat: {
                keyId: 'RAZORPAY_KEY_ID=rzp_test_...',
                keySecret: 'RAZORPAY_KEY_SECRET=...'
            }
        });
        throw new Error("Razorpay credentials not configured");
    }

    if (!keyId.startsWith("rzp_")) {
        console.error("❌ Invalid Razorpay key format:", {
            keyIdStart: keyId?.substring(0, 8),
            expectedFormat: 'rzp_test_... or rzp_live_...'
        });
        throw new Error("Invalid Razorpay key format");
    }

    try {
        // Initialize Razorpay with explicit configuration
        razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
            api_endpoint: 'https://api.razorpay.com/v1',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Test the connection
        razorpay.orders.all()
            .then(() => {
                console.log("✅ Razorpay connection test successful");
            })
            .catch((error) => {
                console.error("❌ Razorpay connection test failed:", error);
                throw error;
            });

        console.log("✅ Razorpay initialized successfully");
        return razorpay;
    } catch (error) {
        console.error("❌ Razorpay initialization failed:", {
            message: error.message,
            code: error.code,
            stack: error.stack,
            details: error.error?.description || "No additional details"
        });
        throw error;
    }
};

export const createRazorpayOrder = async(options) => {
    try {
        console.log('🔍 Creating Razorpay order with options:', {
            amount: options.amount,
            currency: options.currency,
            receipt: options.receipt,
            notes: options.notes
        });

        const razorpayInstance = initializeRazorpay();

        // Validate amount
        if (!options.amount || options.amount < 1) {
            throw new Error("Invalid amount. Amount must be greater than 0");
        }

        // Validate currency
        if (!options.currency || options.currency !== "INR") {
            throw new Error("Invalid currency. Only INR is supported");
        }

        // Ensure amount is an integer
        options.amount = Math.round(options.amount);

        const order = await razorpayInstance.orders.create(options);
        console.log("✅ Razorpay order created:", {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            status: order.status
        });
        return order;
    } catch (error) {
        console.error("❌ Razorpay order creation failed:", {
            statusCode: error.statusCode,
            error: error.error,
            message: error.message,
            stack: error.stack,
            details: error.error?.description || "No additional details"
        });
        
        // Provide more specific error messages
        if (error.statusCode === 404) {
            throw new Error("Razorpay API endpoint not found. Please check your API configuration.");
        } else if (error.statusCode === 401) {
            throw new Error("Invalid Razorpay credentials. Please check your API keys.");
        } else if (error.statusCode === 400) {
            throw new Error(`Invalid request: ${error.error?.description || error.message}`);
        }
        
        throw error;
    }
};

export const verifyRazorpayPayment = (orderId, paymentId, signature) => {
    try {
        console.log('🔍 Verifying Razorpay payment:', {
            orderId,
            paymentId,
            signatureLength: signature?.length
        });

        const razorpayInstance = initializeRazorpay();
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(orderId + "|" + paymentId);
        const generatedSignature = hmac.digest("hex");

        const isValid = generatedSignature === signature;
        console.log('🔍 Payment signature verification:', {
            isValid,
            generatedSignatureLength: generatedSignature.length,
            receivedSignatureLength: signature.length
        });

        return isValid;
    } catch (error) {
        console.error("❌ Payment verification error:", {
            message: error.message,
            stack: error.stack
        });
        return false;
    }
};