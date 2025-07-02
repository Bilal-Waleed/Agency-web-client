import React, { useState } from "react";
import * as Yup from "yup";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { showToast } from "../components/Toast";

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required")
    .max(100, "Email must be less than 100 characters"),
});

const ForgotPassword = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ email: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPasswordSchema.validate(formData, { abortEarly: false });
      setErrors({});
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password`, formData);
      setFormData({ email: "" });
      setLoading(false);
      showToast("Password reset link sent! Check your email.", "success", {
        onClose: () => navigate("/login"),
      });
    } catch (error) {
      setLoading(false);
      if (error.name === "ValidationError") {
        const errs = {};
        error.inner.forEach((e) => (errs[e.path] = e.message));
        setErrors(errs);
      } else {
        const msg = error.response?.data?.error || "Failed to send reset link";
        setErrors({ api: msg });
        showToast(msg, "error");
      }
    }
  };

  return (
    <div
      className={`flex items-center justify-center p-4 ${
        theme === "light" ? "bg-white text-black" : "bg-gray-900 text-white"
      } min-h-[calc(100vh-80px)] pt-12`}
    >
      <div className="flex flex-col lg:flex-row items-center max-w-4xl w-full gap-8 lg:gap-20">
        <img
          src="./images/login.png"
          alt="Forgot Password"
          className="w-full max-w-xs lg:max-w-sm lg:w-1/2 object-contain"
        />
        <div className="w-full max-w-md lg:w-7/12">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">Forgot Password</h2>
          <div className="w-16 h-1 bg-[#646cff] mb-6"></div>
          <p className="text-sm mb-4">Enter your email address to receive a password reset link.</p>
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
            {errors.api && <p className="text-red-500 text-sm text-center mt-2">{errors.api}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`w-full p-2 mt-3 rounded-md text-white ${
                loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#646cff] hover:bg-[#535bf2]"
              } transition-colors`}
            >
              {loading ? "Loading..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;