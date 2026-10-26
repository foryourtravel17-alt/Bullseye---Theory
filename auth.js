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

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Bullseye login error:", error);
      const normalizedError = (error.message || "").toLowerCase();
      const message = error.message === "Failed to fetch"
        ? "Unable to reach Supabase Auth from this site. Please refresh and try again."
        : normalizedError.includes("invalid login credentials")
          ? "Login failed. Check the exact email and password. If you just created this account, email confirmation may still be enabled in Supabase. Use Forgot password if needed."
          : normalizedError.includes("email not confirmed")
            ? "Your email is not confirmed yet. Instant entry requires disabling Confirm email in Supabase project settings."
            : (error.message || "Login failed.");
      setMessage(message, "error");
      return;
    }

    if (!data.session) {
      setMessage("Login completed but no session was returned. Please try again.", "error");
      return;
    }

    window.location.href = redirectTarget();
  } catch (err) {
    console.error("Bullseye login network exception:", err);
    setMessage("Unable to reach Supabase Auth. Please refresh the page and try again.", "error");
  }
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

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: redirectTarget()
      }
    });

    if (error) {
      console.error("Bullseye signup error:", error);
      setMessage(error.message || "Signup failed.", "error");
      return;
    }

    if (data.session) {
      window.location.href = redirectTarget();
    } else {
      setMessage("Account created, but Supabase did not start a signed-in session. Email confirmation is enabled in Supabase, so instant entry is not possible until Confirm email is disabled in project settings. Do not create the account again; after that setting is changed, sign in with this account.", "success");
    }
  } catch (err) {
    console.error("Bullseye signup network exception:", err);
    setMessage("Supabase connection failed. Please refresh and try again. If this continues, the live site is not reaching the Supabase Auth server.", "error");
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

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && location.pathname.endsWith("/auth.html")) {
    // A signed-in user can still open auth.html, but we send them to their dashboard.
      window.location.href = redirectTarget();
      return;
    }
  } catch (err) {
    console.error("Bullseye session check failed:", err);
    setMessage("Unable to connect to Supabase Auth. Make sure you are using the current Bullseye Theory site.", "error");
  }

  $("loginForm")?.addEventListener("submit", handleSignIn);
  $("signupForm")?.addEventListener("submit", handleSignUp);
  $("resetForm")?.addEventListener("submit", handleReset);
});


async function runSupabaseConnectionCheck() {
  try {
    const response = await fetch(window.BULLSEYE_SUPABASE_URL + "/auth/v1/settings", {
      method: "GET",
      headers: {
        apikey: window.BULLSEYE_SUPABASE_PUBLISHABLE_KEY
      },
      cache: "no-store"
    });
    console.log("Bullseye Supabase connection check:", response.status, response.statusText);
    if (!response.ok) {
      console.warn("Supabase Auth settings endpoint returned:", response.status);
    }
  } catch (err) {
    console.error("Bullseye Supabase connection check failed:", err);
  }
}

runSupabaseConnectionCheck();
