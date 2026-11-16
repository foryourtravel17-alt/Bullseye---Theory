/* Defensive no-network guard for the closed manual-only checkout. */
(() => {
  const get = (id) => document.getElementById(id);
  const hide = (element) => { if (element) element.hidden = true; };

  const createOrder = get('createOrder');
  if (createOrder) {
    createOrder.disabled = true;
    createOrder.textContent = 'ENROLLMENT CLOSED';
  }

  for (const id of ['orderPanel', 'paidDashboard', 'paymentForm', 'secureCheckout']) {
    hide(get(id));
  }

  const wallet = get('walletAddress');
  if (wallet) {
    wallet.textContent = '';
    hide(wallet);
  }

  for (const id of ['copyWallet', 'copyOrderWallet']) {
    const button = get(id);
    if (button) {
      button.disabled = true;
      hide(button);
    }
  }

  for (const id of ['checkoutStatus', 'topPaymentStatus', 'paymentState', 'paymentStateNote']) {
    const node = get(id);
    if (node) node.textContent = 'Enrollment is closed. Do not transfer funds. Payment verification and access activation remain manual.';
  }

  if (typeof document.querySelectorAll === 'function') {
    document.querySelectorAll('.qr-card, .payment-grid, .wallet-card, [data-payment-qr], [data-wallet-address]').forEach(hide);
  }
})();
