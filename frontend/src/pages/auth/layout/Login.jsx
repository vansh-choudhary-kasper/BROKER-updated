// import { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import KASPLOGO from "../../img/munclogotm.png";
// import LoginImage from "../../img/AuthPage/LoginPage.jpeg";
// import OnboardLoader from "../utils/OnboardLoader/OnboardLoader";
// import { RxEyeOpen } from "react-icons/rx";
// import { GoEyeClosed } from "react-icons/go";
// import "./styles/Login.css";

// const Login = () => {
//   const [alertMsg, setAlertMsg] = useState("");
//   const [seePass, setSeePass] = useState(false);
//   const [password, setPassword] = useState("");
//   const token = localStorage.getItem("token");
//   const [OnboardLoading, setOnboardLoading] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setOnboardLoading(false);
//     }, 1500);

//     return () => clearTimeout(timer);
//   }, []);

//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });
//   const [error, setError] = useState("");
//   const { login, isAuthenticated, loading } = useAuth();
//   const navigate = useNavigate();

//   // Redirect if already authenticated
//   useEffect(() => {
//     if (isAuthenticated) {
//       console.log("Already authenticated, redirecting to dashboard");
//       navigate("/", { replace: true });
//     }
//   }, [isAuthenticated, navigate]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       console.log("Submitting login form with:", formData);
//       await login(formData);
//       console.log("Login successful");
//       navigate("/", { replace: true });
//     } catch (err) {
//       console.error("Login error:", err);
//       setError(err.message || "Failed to login");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         Loading...
//       </div>
//     );
//   }

//   return (
//     // new code
//     <>
//       {OnboardLoading ? (
//         <OnboardLoader />
//       ) : (
//         <div
//           style={{
//             height: "100vh",
//             width: "100%",
//             overflow: "auto",
//           }}
//           className="m-0 p-0 bg-light"
//         >
//           <div
//             style={{ height: "100%", width: "100%" }}
//             className="row flex-row-reverse mx-auto bg-white login-container"
//           >
//             <div
//               style={{
//                 height: "100%",
//                 width: "100%",
//                 border: "1px solid lime",
//               }}
//               className="col-12 col-md-4 position-relative px-0 p-md-5  d-flex bg-white flex-column justify-content-center align-items-center"
//             >
//               <form
//                 style={{ height: "fit-content", zIndex: "1" }}
//                 onSubmit={handleSubmit}
//                 className="form my-auto bg-white py-5 px-4 p-md-3 rounded text-black fw-bold d-flex flex-column justify-content-center"
//               >
//                 <div className="d-flex justify-content-center align-items-center">
//                   <img
//                     style={{ width: "100%" }}
//                     src={KASPLOGO}
//                     // className="mx-auto"
//                     alt=""
//                   />
//                 </div>
//                 <h4
//                   style={{ color: "var(--primaryDashColorDark)" }}
//                   className="my-4 text-center text-md-start gap-2"
//                 >
//                   Sign In
//                 </h4>
//                 <div className="d-flex flex-column my-3">
//                   <label htmlFor="email" className="ps-2 fw-normal">
//                     Account
//                   </label>
//                   <input
//                     name="email"
//                     placeholder="Email Address, Phone or UserID"
//                     className="login-input border my-0"
//                     type="text"
//                   />
//                 </div>

//                 <div className="d-flex position-relative flex-column my-3 mb-4 mb-md-3">
//                   <label htmlFor="password" className="ps-2 fw-normal">
//                     Enter your password
//                   </label>
//                   <div className="position-relative">
//                     <input
//                       name="password"
//                       placeholder="**********"
//                       className="login-input border my-0"
//                       type={seePass ? "text" : "password"}
//                       onChange={(e) => setPassword(e.target.value)}
//                     />
//                     <span
//                       style={{
//                         position: "absolute",
//                         top: "50%",
//                         transform: "translateY(-55%)",
//                         right: "3%",
//                         cursor: "pointer",
//                       }}
//                       className="fs-5 text-muted my-0"
//                       onClick={(e) => {
//                         e.preventDefault();
//                         setSeePass(!seePass);
//                       }}
//                     >
//                       {seePass ? <GoEyeClosed /> : <RxEyeOpen />}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="row mx-auto w-100 justify-content-between my-3 row-gap-4">
//                   <input
//                     style={{
//                       background: "var(--primaryDashColorDark)",
//                       color: "var(--primaryDashMenuColor)",
//                     }}
//                     type="submit"
//                     className="btn btn-primary"
//                     value="Login"
//                   />
//                   <Link
//                     to="/forgetPassword"
//                     className="fw-normal text-decoration-none"
//                     style={{ cursor: "pointer" }}
//                   >
//                     Forgot password?
//                   </Link>
//                 </div>

//                 <p
//                   style={{
//                     position: "absolute",
//                     bottom: "0",
//                     left: "50%",
//                     transform: "translate(-50%)",
//                     fontWeight: "normal",
//                     whiteSpace: "pre",
//                   }}
//                   className="d-block bg-white py-1 px-2 text-center text-black"
//                 >
//                   Design and Developed by{" "}
//                   <a
//                     style={{ textDecoration: "none" }}
//                     target="_blank"
//                     href="https://kasperinfotech.com/"
//                   >
//                     Kasper Infotech Pvt. Ltd.
//                   </a>
//                 </p>
//               </form>
//             </div>
//             <div
//               style={{
//                 height: "100%",
//                 zIndex: "0",
//                 backgroundImage: `url(${LoginImage})`,
//                 backgroundSize: "cover",
//                 backgroundRepeat: "no-repeat",
//               }}
//               className="imagePosition col-12 col-md-8 p-5 d-flex flex-column justify-content-center gap-4 "
//             >
//               <p
//                 style={{ position: "absolute", bottom: "10px" }}
//                 className="text-center d-none d-md-flex pt-5 text-white"
//               >
//                 www.kasperinfotech.com
//               </p>
//             </div>
//           </div>
//         </div>
//       )}
//     </>

//     // old Code

//     // <div className="app-container">
//     //   <div className="form-container fade-in">
//     //     <div className="card-header">
//     //       <h1 className="card-title">Login to Your Account</h1>
//     //     </div>

//     //     {error && (
//     //       <div className="error-message" role="alert">
//     //         {error}
//     //       </div>
//     //     )}

//     //     <form onSubmit={handleSubmit} className="space-y-4">
//     //       <div className="form-group">
//     //         <label htmlFor="email" className="form-label">
//     //           Email Address
//     //         </label>
//     //         <input
//     //           type="email"
//     //           id="email"
//     //           name="email"
//     //           value={formData.email}
//     //           onChange={handleChange}
//     //           className="form-input"
//     //           required
//     //           placeholder="Enter your email"
//     //         />
//     //       </div>

//     //       <div className="form-group">
//     //         <label htmlFor="password" className="form-label">
//     //           Password
//     //         </label>
//     //         <input
//     //           type="password"
//     //           id="password"
//     //           name="password"
//     //           value={formData.password}
//     //           onChange={handleChange}
//     //           className="form-input"
//     //           required
//     //           placeholder="Enter your password"
//     //         />
//     //       </div>

//     //       <div className="form-group">
//     //         <button type="submit" className="btn btn-primary w-full">
//     //           Sign In
//     //         </button>
//     //       </div>
//     //     </form>

//     //     <div className="mt-4 text-center">
//     //       <p className="text-sm text-gray-600">
//     //         Don't have an account?{" "}
//     //         <Link to="/register" className="text-blue-600 hover:text-blue-800">
//     //           Register
//     //         </Link>
//     //       </p>
//     //     </div>
//     //   </div>
//     // </div>
//   );
// };

// export default Login;


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
