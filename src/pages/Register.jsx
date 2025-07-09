import React, { useState } from "react";
import * as Yup from "yup";
import { useTheme } from "../context/ThemeContext";
import { Google } from "@mui/icons-material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { showToast } from "../components/Toast";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const registerSchema = Yup.object().shape({
  name: Yup.string()
    .required("Name is required")
    .max(50, "Name must be less than 50 characters"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required")
    .max(100, "Email must be less than 100 characters"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must be less than 100 characters"),
  isAdmin: Yup.boolean(),
});

const Register = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    isAdmin: false,
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
      await registerSchema.validate(formData, { abortEarly: false });
      setErrors({});
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, {
        ...formData,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}`,
      });
      setFormData({
        name: "",
        email: "",
        password: "",
        isAdmin: false,
      });
      setLoading(false);
      showToast("Registration successful! Redirecting to login...", "success");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setLoading(false);
      if (error.name === "ValidationError") {
        const errs = {};
        error.inner.forEach((e) => (errs[e.path] = e.message));
        setErrors(errs);
      } else {
        const msg = error.response?.data?.error || "Registration failed";
        setErrors({ api: msg });
        showToast(msg, "error");
        if (msg.includes("Account already exists")) {
          setTimeout(() => navigate("/login"), 1500);
        }
      }
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      setLoading(true);
      const { credential } = response;
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google-register`, { credential });
      setLoading(false);
      showToast(res.data.message, "success");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.error || "Google registration failed";
      setErrors({ api: msg });
      showToast(msg, "error");
      if (msg.includes("Account already exists")) {
        setTimeout(() => navigate("/login"), 1500);
      }
    }
  };

  const handleGoogleFailure = () => {
    setErrors({ api: "Google registration failed" });
    showToast("Google registration failed", "error");
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
            src="/images/register.png"
            alt="Registration"
            className="w-full max-w-xs lg:max-w-sm lg:w-1/2 object-contain"
          />
          <div className="w-full max-w-md lg:w-7/12">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">Registration</h2>
            <div className="w-16 h-1 bg-[#646cff] mb-6"></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="name"
                  className={`block text-sm font-medium ${
                    theme === "light" ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  placeholder="Enter your name"
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`mt-1 block w-full p-2 border rounded-md ${
                    theme === "light"
                      ? "border-gray-300 text-black"
                      : "border-gray-600 text-white bg-gray-800"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""} focus:outline-none focus:ring-2 focus:ring-[#646cff]`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
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
                roll="submit"
                disabled={loading}
                className={`w-full p-2 mt-3 rounded-md text-white ${
                  loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#646cff] hover:bg-[#535bf2]"
                } transition-colors`}
              >
                {loading ? "Loading..." : "Register"}
              </button>
            </form>
            <div className="flex justify-center mt-5">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                disabled={loading}
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

export default Register;