import React, { useState, useContext } from "react";
import * as Yup from "yup";
import { useTheme } from "../context/ThemeContext";
import { Google } from "@mui/icons-material";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Cookies from "js-cookie";
import { useNavigate, Link } from "react-router-dom";
import { showToast } from "../components/Toast";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required")
    .max(100, "Email must be less than 100 characters"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must be less than 100 characters"),
});

const Login = () => {
  const { theme } = useTheme();
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginSchema.validate(formData, { abortEarly: false });
      setErrors({});
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, formData);
      const { token, data } = response.data;
      Cookies.set("token", token, { expires: 7 });
      setUser({ ...data, avatar: data.avatar });
      setFormData({ email: "", password: "" });
      setLoading(false);
      showToast(`Welcome back, ${data.name}! Redirecting to home...`, "success");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      setLoading(false);
      if (error.name === "ValidationError") {
        const errs = {};
        error.inner.forEach((e) => (errs[e.path] = e.message));
        setErrors(errs);
      } else {
        const msg = error.response?.data?.error || "Login failed";
        setErrors({ api: msg });
        showToast(msg, "error");
      }
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      setLoading(true);
      const { credential } = response;
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google-login`, { credential });
      const { message, token, data } = res.data;
      setLoading(false);
      if (message.includes("login successful")) {
        Cookies.set("token", token, { expires: 7 });
        setUser({ ...data, avatar: data.avatar });
        showToast(`Welcome, ${data.name}! Redirecting to home...`, "success");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.error || "Google login failed";
      setErrors({ api: msg });
      showToast(msg, "error");
      if (msg.includes("No data account")) {
        setTimeout(() => navigate("/register"), 1500);
      }
    }
  };

  const handleGoogleFailure = () => {
    setErrors({ api: "Google login failed" });
    showToast("Google login failed", "error");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_APP_GOOGLE_CLIENT_ID}>
      <div
        className={`flex items-center justify-center p-4 ${
          theme === "light" ? "bg-white text-black" : "bg-gray-900 text-white"
        } min-h-[calc(100vh-80px)] pt-12`}
      >
        <div className="flex flex-col lg:flex-row items-center max-w-4xl w-full gap-8 lg:gap-20">
          <img
            src="./images/login.png"
            alt="Login"
            className="w-full max-w-xs lg:max-w-sm lg:w-1/2 object-contain"
          />
          <div className="w-full max-w-md lg:w-7/12">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">Login</h2>
            <div className="w-16 h-1 bg-[#646cff] mb-6"></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className={`block text-sm font-medium ${
                    theme === "light" ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  placeholder="Enter your email"
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`mt-1 block w-full p-2 border rounded-md ${
                    theme === "light"
                      ? "border-gray-300 text-black"
                      : "border-gray-600 text-white bg-gray-800"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""} focus:outline-none focus:ring-2 focus:ring-[#646cff]`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div className="relative">
                <label
                  htmlFor="password"
                  className={`block text-sm font-medium ${
                    theme === "light" ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={formData.password}
                  placeholder="Enter your password"
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`mt-1 block w-full p-2 pr-10 border rounded-md ${
                    theme === "light"
                      ? "border-gray-300 text-black"
                      : "border-gray-600 text-white bg-gray-800"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""} focus:outline-none focus:ring-2 focus:ring-[#646cff]`}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute top-8 right-3 text-gray-500 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
              {errors.api && <p className="text-red-500 text-sm text-center mt-2">{errors.api}</p>}
              <button
                type="submit"
                disabled={loading}
                className={`w-full p-2 mt-2 rounded-md text-white ${
                  loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#646cff] hover:bg-[#535bf2]"
                } transition-colors`}
              >
                {loading ? "Loading..." : "Login"}
              </button>
              <div className="text-sm text-right">
                <Link
                  to="/forgot-password"
                  className={`hover:underline ${
                    theme === "light" ? "text-[#646cff]" : "text-[#535bf2]"
                  }`}
                >
                  Forgot Password?
                </Link>
              </div>
            </form>
            <div className="flex justify-center mt-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                useOneTap={false}
                render={(renderProps) => (
                  <button
                    onClick={renderProps.onClick}
                    disabled={renderProps.disabled || loading}
                    className={`flex items-center justify-center w-10 h-10 rounded-full border ${
                      theme === "light"
                        ? "border-[#646cff] text-[#646cff] hover:bg-[#646cff] hover:text-white"
                        : "border-white text-white hover:bg-white hover:text-gray-900"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""} transition-colors`}
                  >
                    <Google />
                  </button>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;