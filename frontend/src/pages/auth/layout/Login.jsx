import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import KASPLOGO from "../../img/munclogotm.png";
import LoginImage from "../../img/AuthPage/LoginPage.jpeg";
import OnboardLoader from "../utils/OnboardLoader/OnboardLoader";
import { RxEyeOpen } from "react-icons/rx";
import { GoEyeClosed } from "react-icons/go";

const Login = () => {
  const [alertMsg, setAlertMsg] = useState("");
  const [seePass, setSeePass] = useState(false);
  const [OnboardLoading, setOnboardLoading] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setOnboardLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(formData);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to login");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">Loading...</div>
    );
  }

  // Detect screen width (for background image handling)
  const isMobile = window.innerWidth <= 800;

  return (
    <>
      {OnboardLoading ? (
        <OnboardLoader />
      ) : (
        <div
          className={`h-screen w-full overflow-auto bg-gray-100 bg-cover bg-no-repeat ${
            isMobile ? "login-mobile-bg" : ""
          }`}
          style={isMobile ? { backgroundImage: `url(${LoginImage})`, backgroundPosition: "center" } : {}}
        >
          <div className="flex flex-col md:flex-row w-full h-full">
            {/* Left Image Panel (hidden on screens <=800px) */}
            <div
              className="w-full md:w-2/3 bg-cover bg-no-repeat relative hidden md:flex items-center justify-center order-1 md:order-none"
              style={{ backgroundImage: `url(${LoginImage})` }}
            >
              <p className="absolute bottom-4 text-white text-sm">
                www.kasperinfotech.com
              </p>
            </div>

            {/* Right Form Panel */}
            <div className="w-full md:w-1/3 bg-white md:bg-white p-6 md:p-12 flex flex-col justify-center relative border order-0 md:order-last bg-white/90">
              <form
                onSubmit={handleSubmit}
                className="text-black font-semibold flex flex-col gap-4"
              >
                
                <h4 className="text-xl text-center md:text-left text-blue-900 mt-4">
                  Sign In
                </h4>

                <div className="flex flex-col mt-3">
                  <label htmlFor="email" className="pl-2 font-normal">
                    Account
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    className="border rounded px-3 py-2"
                  />
                </div>

                <div className="flex flex-col relative mt-3 mb-6">
                  <label htmlFor="password" className="pl-2 font-normal">
                    Enter your password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="**********"
                      className="border rounded px-3 py-2 w-full"
                      type={seePass ? "text" : "password"}
                    />
                    <span
                      className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-gray-500"
                      onClick={(e) => {
                        e.preventDefault();
                        setSeePass(!seePass);
                      }}
                    >
                      {seePass ? <GoEyeClosed /> : <RxEyeOpen />}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-blue-900 text-white py-2 rounded hover:bg-blue-800"
                >
                  Login
                </button>

                <Link
                  to="/forgetPassword"
                  className="text-sm text-blue-600 hover:underline text-center mt-2"
                >
                  Forgot password?
                </Link>

                <div className="text-center mt-2">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Register
                    </Link>
                  </p>
                </div>

                <p className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-center">
                  Design and Developed by{" "}
                  <a
                    href="https://kasperinfotech.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Kasper Infotech Pvt. Ltd.
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
