import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import { showToast } from "../components/Toast";
import axios from "axios";
import { TextField, Button } from "@mui/material";

const OTPVerification = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const email = new URLSearchParams(location.search).get("email");

  useEffect(() => {
    if (!email) {
      showToast("No email provided. Redirecting to login...", "error");
      setTimeout(() => navigate("/login"), 1500);
    }
    inputRefs.current[0]?.focus();
  }, [navigate, email]);

  const handleInputChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[3].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 4) {
      setErrors({ api: "Please enter a 4-digit OTP" });
      showToast("Please enter a 4-digit OTP", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-otp`, {
        email,
        otp: otpValue,
      });
      setLoading(false);
      showToast(response.data.message, "success");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.error || "OTP verification failed";
      setErrors({ api: msg });
      showToast(msg, "error");
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
          src="/images/login.png"
          alt="OTP Verification"
          className="w-full max-w-xs lg:max-w-sm lg:w-1/2 object-contain"
        />
        <div className="w-full max-w-md lg:w-7/12">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">OTP Verification</h2>
          <div className="w-16 h-1 bg-[#646cff] mb-6"></div>
          <p className="text-sm mb-4">Enter the 4-digit OTP sent to {email}</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex justify-between">
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  inputRef={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputProps={{ maxLength: 1, style: { textAlign: "center" , color: theme === "light" ? "black" : "white"} }}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  variant="outlined"
                  size="small"
                  className={`w-12 ${
                    theme === "light"
                      ? "border-gray-300 text-black"
                      : "border-gray-600 text-white bg-gray-800"
                  }`}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: theme === "light" ? "#d1d5db" : "#4b5563",
                      },
                      "&:hover fieldset": {
                        borderColor: "#646cff",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#646cff",
                      },
                    },
                  }}
                />
              ))}
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: loading ? "#6b7280" : "#646cff",
                "&:hover": { backgroundColor: loading ? "#6b7280" : "#535bf2" },
                color: "white",
                padding: "8px",
                marginTop: "12px",
              }}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;