import { useState } from "react";
import { auth } from "../../firebase/firebase";
import {
  signInWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiMail } from "react-icons/fi";
import SpinnerOverlay from "../../components/SpinnerOverlay";
import MessageModal from "../../components/Modal/MessageModal";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError("Failed to log in. Check your email and password.");
    }
    setIsLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);
    const authInstance = getAuth();
    try {
      await sendPasswordResetEmail(authInstance, email);
      setMessage("If this email is registered, a reset link has been sent.");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError(error.message);
      }
    }
    setIsLoading(false);
  };

  const clearMessages = () => {
    setError(null);
    setMessage(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200
      bg-[radial-gradient(circle_at_top_left,_#c9c9c9_20%,_transparent_70%),_radial-gradient(circle_at_top_right,_#727272_10%,_transparent_70%),_radial-gradient(circle_at_bottom_left,_#646464_20%,_transparent_70%),_radial-gradient(circle_at_bottom_right,_#c9c9c9_10%,_transparent_70%)] bg-no-repeat">
      <div className="text-5xl font-bold text-gray-800 mb-8 select-none">
        Asset<span className="text-white">ONE</span>
      </div>

      {isLoading && <SpinnerOverlay logo="A" />}

      <MessageModal error={error} message={message} clearMessages={clearMessages} />

      {/* Login Box */}
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-[450px]">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 select-none">
          {isForgotPassword ? "Reset Password" : "Login"}
        </h2>

        <div className="relative overflow-hidden h-[230px]">
          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out
              ${isForgotPassword
                ? "-translate-x-full opacity-0 pointer-events-none"
                : "translate-x-0 opacity-100 pointer-events-auto"
              }`}
          >
            <div className="flex items-center mb-5 border border-gray-300 rounded px-3 py-2">
              <FiUser className="text-gray-600 mr-3" size={20} />
              <input
                type="email"
                placeholder="Email"
                className="w-full outline-none text-gray-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center mb-5 border border-gray-300 rounded px-3 py-2">
              <FiLock className="text-gray-600 mr-3" size={20} />
              <input
                type="password"
                placeholder="Password"
                className="w-full outline-none text-gray-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-700 hover:bg-gray-900 transition-colors duration-300 text-white font-semibold py-2 rounded mb-4 disabled:opacity-60"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
            <p
              className="text-center text-gray-900 cursor-pointer select-none hover:underline"
              onClick={() => setIsForgotPassword(true)}
            >
              Forgot Password?
            </p>
          </form>

          {/* Reset Password Form */}
          <form
            onSubmit={handleReset}
            className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out
              ${isForgotPassword
                ? "translate-x-0 opacity-100 pointer-events-auto"
                : "translate-x-full opacity-0 pointer-events-none"
              }`}
          >
            <div className="flex items-center mb-5 border border-gray-300 rounded px-3 py-2">
              <FiMail className="text-gray-600 mr-3" size={20} />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full outline-none text-gray-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-700 hover:bg-gray-900 transition-colors duration-300 text-white font-semibold py-2 rounded mb-3 disabled:opacity-60"
            >
              {isLoading ? "Sending..." : "Send Reset Email"}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setIsForgotPassword(false)}
              className="w-full bg-gray-500 hover:bg-gray-700 transition-colors duration-300 text-white font-semibold py-2 rounded"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;