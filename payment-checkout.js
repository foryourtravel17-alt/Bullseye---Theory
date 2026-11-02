(() => {
  const byId = (id) => document.getElementById(id);
  const button = byId("createOrder");
  const planSelect = byId("planSelect");
  const status = byId("checkoutStatus");
  const orderPanel = byId("orderPanel");
  const amountNode = byId("orderAmount");
  const expiryNode = byId("orderExpiry");
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

  function setStatus(message, kind = "info") {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function formatExpiry(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
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
    if (!data.checkout_enabled) {
      setStatus("Checkout is closed while automatic payment verification is being configured. Do not transfer funds yet.");
      return;
    }
    if (!sessionData.session) {
      setStatus("Payment verification is ready for course checkout. Sign in first to create your personal order.");
      return;
    }
    button.disabled = false;
    if (data.premium_enabled) {
      planSelect.querySelector('option[value="premium"]').disabled = false;
    }
    setStatus("Course checkout is available. Each order gets a unique amount and a 20-minute payment window.", "success");
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
        setStatus("Payment verified on TRON Mainnet. Course access has been activated for your account.", "success");
        paidLink.hidden = false;
        button.disabled = true;
        return;
      }
      if (data.status === "expired") {
        setStatus("This payment order expired without a verified matching transfer. Do not send to this expired order; contact support if you already transferred.", "error");
        button.disabled = false;
        return;
      }
      if (data.status === "manual_review") {
        setStatus("Your transfer needs manual reconciliation. Course access has not been activated yet; contact support with the transaction ID.", "error");
        button.disabled = true;
        return;
      }
      if (Date.now() > pollDeadline) {
        setStatus("This page stopped checking automatically. Your order remains visible in your account; refresh to check again.", "info");
        return;
      }
      setStatus("Waiting for the exact USDT amount and a successful solidified TRON transaction…");
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
    if (selectedPlan !== "course" && selectedPlan !== "premium") {
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
    orderPanel.hidden = false;
    amountNode.textContent = data.usdt_amount + " USDT";
    expiryNode.textContent = formatExpiry(data.expires_at);
    pollDeadline = new Date(data.expires_at).getTime();
    setStatus("Order created. Scan the QR, select TRON Mainnet / TRC-20, and send the exact amount shown. Do not send a rounded amount.");
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
