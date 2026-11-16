(() => {
  const byId = (id) => document.getElementById(id);
  const button = byId("createOrder");
  const planSelect = byId("planSelect");
  const status = byId("checkoutStatus");
  const orderPanel = byId("orderPanel");
  const amountNode = byId("orderAmount");
  const expiryNode = byId("orderExpiry");
  const expiryLabel = byId("orderExpiryLabel");
  const copyButton = byId("copyOrderWallet");
  const paidLink = byId("paidDashboard");
  if (!button || !window.supabase || !window.BULLSEYE_SUPABASE_URL || !window.BULLSEYE_SUPABASE_PUBLISHABLE_KEY) {
    if (status) status.textContent = "Payment checkout is not connected. Please use Student Login or contact support.";
    return;
  }

  const client = window.supabase.createClient(
    window.BULLSEYE_SUPABASE_URL,
    window.BULLSEYE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );
  let activeOrderId = null;
  let pollTimer = null;
  let pollDeadline = 0;
  const ACTIVE_ORDER_KEY = "bullseye_active_trc20_order_v1";

  function saveActiveOrder(orderId) {
    try { sessionStorage.setItem(ACTIVE_ORDER_KEY, orderId); } catch { /* storage may be unavailable */ }
  }

  function clearActiveOrder() {
    try { sessionStorage.removeItem(ACTIVE_ORDER_KEY); } catch { /* storage may be unavailable */ }
  }

  function getSavedOrder() {
    try { return sessionStorage.getItem(ACTIVE_ORDER_KEY); } catch { return null; }
  }

  function setStatus(message, kind = "info") {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function formatExpiry(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
  }

  async function restorePendingOrder(checkoutEnabled) {
    const savedOrderId = getSavedOrder();
    if (!savedOrderId) return false;

    const { data, error } = await client.functions.invoke("get-trc20-order-status", {
      body: { order_id: savedOrderId }
    });
    if (error || !data) {
      setStatus("Your saved order could not be checked right now. Do not send again; refresh or contact support.", "error");
      button.disabled = true;
      return true;
    }

    activeOrderId = savedOrderId;
    orderPanel.hidden = false;
    amountNode.textContent = data.usdt_amount + " USDT";
    expiryNode.textContent = formatExpiry(data.expires_at);

    if (data.status === "paid") {
      clearActiveOrder();
      if (data.plan === "indicator") {
        if (!data.indicator_access_active) {
          setStatus("Payment is marked paid, but the 365-day indicator entitlement could not be confirmed. Do not send again; contact support with your order reference.", "error");
          button.disabled = true;
          return true;
        }
        if (data.indicator_access_expires_at) expiryNode.textContent = formatExpiry(data.indicator_access_expires_at);
        if (expiryLabel) expiryLabel.textContent = "INDICATOR ACCESS EXPIRES";
        setStatus("Payment verified. Your 365-day website analyzer entitlement is active.", "success");
        paidLink.hidden = true;
      } else {
        if (!data.course_access_active) {
          setStatus("Payment is marked paid, but course entitlement could not be confirmed. Do not send again; contact support with your order reference.", "error");
          button.disabled = true;
          return true;
        }
        if (data.course_access_expires_at) expiryNode.textContent = formatExpiry(data.course_access_expires_at);
        if (expiryLabel) expiryLabel.textContent = "COURSE ACCESS EXPIRES";
        setStatus("This order is already paid and verified. Course access is active for your account.", "success");
        paidLink.hidden = false;
      }
      button.disabled = true;
      return true;
    }
    if (data.status === "expired") {
      clearActiveOrder();
      setStatus("Your previous order expired. Do not send funds to it. You may create a new order.", "error");
      button.disabled = false;
      return true;
    }
    if (data.status === "manual_review") {
      setStatus("Your previous payment needs manual reconciliation. Do not send again; contact support with your order reference.", "error");
      button.disabled = true;
      return true;
    }

    button.disabled = true;
    if (!checkoutEnabled) {
      setStatus("Checkout is closed. Do not transfer funds to this pending order. If you already sent funds, do not send again; contact support with the order reference.", "error");
      return true;
    }

    pollDeadline = new Date(data.expires_at).getTime() + 60 * 60 * 1000;
    setStatus("Your pending order has been restored. Send only the exact amount shown before its expiry; do not create another order.");
    pollOrder(savedOrderId);
    return true;
  }

  async function loadConfiguration() {
    button.disabled = true;
    setStatus("Checking secure payment readiness…");
    const { data, error } = await client.functions.invoke("get-trc20-payment-config");
    if (error || !data) {
      setStatus("Payment service is not reachable. Checkout stays closed; no payment has been created.", "error");
      return;
    }
    if (data.network !== "TRON Mainnet · TRC-20" ||
        data.wallet_address !== "TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV" ||
        data.token_contract !== "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t") {
      setStatus("Payment configuration did not match the approved wallet and token. Checkout is blocked.", "error");
      return;
    }
    const { data: sessionData } = await client.auth.getSession();
    const paymentState = byId("paymentState");
    const paymentStateNote = byId("paymentStateNote");
    const topPaymentStatus = byId("topPaymentStatus");
    if (sessionData.session) {
      const restored = await restorePendingOrder(data.checkout_enabled);
      if (restored) {
        if (paymentState) paymentState.textContent = data.checkout_enabled ? "ORDER IN PROGRESS" : "CHECKOUT CLOSED";
        if (paymentStateNote) paymentStateNote.textContent = "Your existing order is being checked. Do not create a second payment.";
        if (topPaymentStatus) topPaymentStatus.textContent = data.checkout_enabled ? "EXISTING ORDER RESTORED" : "CHECKOUT CLOSED · EXISTING ORDER CHECKING";
        return;
      }
    }
    if (!data.checkout_enabled) {
      if (paymentState) paymentState.textContent = "CHECKOUT CLOSED";
      if (paymentStateNote) paymentStateNote.textContent = "Automatic verifier secrets are not configured or checkout has not been enabled.";
      if (topPaymentStatus) topPaymentStatus.textContent = "PAYMENT CHECKOUT CLOSED · DO NOT TRANSFER";
      setStatus("Checkout is closed while automatic payment verification is being configured. Do not transfer funds yet.");
      return;
    }
    if (paymentState) paymentState.textContent = "COURSE CHECKOUT AVAILABLE";
    if (paymentStateNote) paymentStateNote.textContent = "Create an order first and transfer only the exact amount shown before its expiry.";
    if (topPaymentStatus) topPaymentStatus.textContent = "COURSE CHECKOUT AVAILABLE · CREATE AN ORDER FIRST";
    if (!sessionData.session) {
      setStatus("Payment verification is ready for course checkout. Sign in first to create your personal order.");
      return;
    }
    button.disabled = false;
    if (data.premium_enabled) {
      planSelect.querySelector('option[value="premium"]').disabled = false;
    }
    if (data.indicator_enabled) {
      planSelect.querySelector('option[value="indicator"]').disabled = false;
    }
    setStatus(data.indicator_enabled
      ? "Course and annual website analyzer checkout are available. Indicator access is a separate 365-day entitlement."
      : "Course checkout is available. Annual indicator checkout remains closed until its separate entitlement and invitation process are approved.", "success");
  }

  async function pollOrder(orderId) {
    if (pollTimer) clearTimeout(pollTimer);
    const tick = async () => {
      const { data, error } = await client.functions.invoke("get-trc20-order-status", {
        body: { order_id: orderId }
      });
      if (error || !data) {
        setStatus("Payment status check failed temporarily. Your order remains on the server; refresh or try again.", "error");
        return;
      }
      if (data.status === "paid") {
        clearActiveOrder();
        if (data.plan === "indicator") {
          if (!data.indicator_access_active) {
            setStatus("Payment is marked paid, but indicator entitlement is not confirmed. Do not send again; contact support with your order reference.", "error");
            button.disabled = true;
            return;
          }
          if (data.indicator_access_expires_at) expiryNode.textContent = formatExpiry(data.indicator_access_expires_at);
          if (expiryLabel) expiryLabel.textContent = "INDICATOR ACCESS EXPIRES";
          setStatus("Payment verified on TRON Mainnet. Your annual website analyzer entitlement is active.", "success");
          paidLink.hidden = true;
        } else {
          if (!data.course_access_active) {
            setStatus("Payment is marked paid, but course entitlement is not confirmed. Do not send again; contact support with your order reference.", "error");
            button.disabled = true;
            return;
          }
          if (data.course_access_expires_at) expiryNode.textContent = formatExpiry(data.course_access_expires_at);
          if (expiryLabel) expiryLabel.textContent = "COURSE ACCESS EXPIRES";
          setStatus("Payment verified on TRON Mainnet. Course access has been activated for your account.", "success");
          paidLink.hidden = false;
        }
        button.disabled = true;
        return;
      }
      if (data.status === "expired") {
        clearActiveOrder();
        setStatus("This payment order expired without a verified matching transfer. Do not send to this expired order; contact support if you already transferred.", "error");
        button.disabled = false;
        return;
      }
      if (data.status === "manual_review") {
        setStatus("Your transfer needs manual reconciliation. No course or analyzer access has been activated. Contact support with the transaction ID.", "error");
        button.disabled = true;
        return;
      }
      if (Date.now() > pollDeadline) {
        setStatus("This page stopped checking automatically. Your order remains visible in your account; refresh to check again.", "info");
        return;
      }
      if (Date.now() > new Date(data.expires_at).getTime()) {
        setStatus("The order window has closed. If you sent the exact amount before expiry, keep waiting for the chain's final confirmation; do not send again.");
      } else {
        setStatus("Waiting for the exact USDT amount and a successful solidified TRON transaction…");
      }
      pollTimer = setTimeout(tick, 10000);
    };
    await tick();
  }

  button.addEventListener("click", async () => {
    button.disabled = true;
    paidLink.hidden = true;
    setStatus("Creating your secure payment order…");
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      setStatus("Sign in first, then return to this page to create a payment order.", "error");
      button.disabled = false;
      return;
    }
    const selectedPlan = planSelect.value;
    if (selectedPlan !== "course" && selectedPlan !== "premium" && selectedPlan !== "indicator") {
      setStatus("Choose a valid plan.", "error");
      button.disabled = false;
      return;
    }
    const { data, error } = await client.functions.invoke("create-trc20-order", {
      body: { plan: selectedPlan }
    });
    if (error || !data?.order_id) {
      setStatus(data?.error || error?.message || "Could not create an order. No payment is due.", "error");
      button.disabled = false;
      return;
    }
    activeOrderId = data.order_id;
    saveActiveOrder(activeOrderId);
    orderPanel.hidden = false;
    amountNode.textContent = data.usdt_amount + " USDT";
    expiryNode.textContent = formatExpiry(data.expires_at);
    pollDeadline = new Date(data.expires_at).getTime() + 60 * 60 * 1000;
    setStatus(data.plan === "indicator"
      ? "Website analyzer order created. Send only the exact amount shown on TRON Mainnet / TRC-20 before expiry. After verified payment, the separate 365-day analyzer entitlement is activated."
      : "Order created. Scan the QR, select TRON Mainnet / TRC-20, and send the exact amount shown. Do not send a rounded amount.");
    button.disabled = true;
    pollOrder(activeOrderId);
  });

  copyButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV");
      copyButton.textContent = "Wallet copied";
    } catch {
      copyButton.textContent = "Select the address above";
    }
  });

  loadConfiguration().catch((error) => {
    console.error("Bullseye payment setup check failed:", error);
    setStatus("Payment readiness check failed. Checkout remains closed.", "error");
  });
})();
