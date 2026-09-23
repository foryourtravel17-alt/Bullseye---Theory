const supabaseClient = window.supabase.createClient(
  window.BULLSEYE_SUPABASE_URL,
  window.BULLSEYE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

const $ = (id) => document.getElementById(id);

function setMessage(text, type = "info") {
  const el = $("message");
  if (!el) return;
  el.textContent = text;
  el.className = "message " + type;
  el.hidden = !text;
}

function redirectTarget() {
  return new URL("dashboard.html", window.location.href).href;
}

async function handleSignIn(event) {
  event.preventDefault();
  setMessage("");
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    setMessage(error.message, "error");
    return;
  }
  window.location.href = redirectTarget();
}

async function handleSignUp(event) {
  event.preventDefault();
  setMessage("");
  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim();
  const password = $("signupPassword").value;
  const confirm = $("signupConfirm").value;

  if (password.length < 8) {
    setMessage("Password must be at least 8 characters.", "error");
    return;
  }
  if (password !== confirm) {
    setMessage("Passwords do not match.", "error");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: redirectTarget()
    }
  });

  if (error) {
    setMessage(error.message, "error");
    return;
  }

  if (data.session) {
    window.location.href = redirectTarget();
  } else {
    setMessage("Account created. Please check your email and confirm your email address before signing in.", "success");
  }
}

async function handleReset(event) {
  event.preventDefault();
  setMessage("");
  const email = $("loginEmail").value.trim();
  if (!email) {
    setMessage("Enter your email first.", "error");
    return;
  }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: new URL("reset-password.html", window.location.href).href
  });
  if (error) setMessage(error.message, "error");
  else setMessage("Password reset email sent. Check your inbox.", "success");
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!window.BULLSEYE_SUPABASE_PUBLISHABLE_KEY ||
      window.BULLSEYE_SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR")) {
    setMessage("Supabase is not connected yet. Add your publishable key in supabase-config.js.", "error");
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && location.pathname.endsWith("/auth.html")) {
    // A signed-in user can still open auth.html, but we send them to their dashboard.
    window.location.href = redirectTarget();
    return;
  }

  $("loginForm")?.addEventListener("submit", handleSignIn);
  $("signupForm")?.addEventListener("submit", handleSignUp);
  $("resetForm")?.addEventListener("submit", handleReset);
});
