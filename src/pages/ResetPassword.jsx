import React, { useState } from "react";
import * as Yup from "yup";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { showToast } from "../components/Toast";
import loginImage from "../../public/images/login.png";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must be less than 100 characters"),
});

const ResetPassword = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({ password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleInputChange = (e) => {
    setFormData({ password: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPasswordSchema.validate(formData, { abortEarly: false });
      setErrors({});
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reset-password`, {
        token,
        password: formData.password,
      });
      setFormData({ password: "" });
      setLoading(false);
      showToast("Password reset successful! Redirecting to login...", "success");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setLoading(false);
      if (error.name === "ValidationError") {
        const errs = {};
        error.inner.forEach((e) => (errs[e.path] = e.message));
        setErrors(errs);
      } else {
        const msg = error.response?.data?.error || "Failed to reset password";
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
          src={loginImage}
          alt="Reset Password"
          className="w-full max-w-xs lg:max-w-sm lg:w-1/2 object-contain"
        />
        <div className="w-full max-w-md lg:w-7/12">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">Reset Password</h2>
          <div className="w-16 h-1 bg-[#646cff] mb-6"></div>
          <p className="text-sm mb-4">Enter your new password.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}
              >
                New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Enter new password"
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
              className={`w-full p-2 mt-3 rounded-md text-white ${
                loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#646cff] hover:bg-[#535bf2]"
              } transition-colors`}
            >
              {loading ? "Loading..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;