import { useState, useEffect } from "react";
import LoginImage from "./img/LoginPage.jpeg";
import OnboardLoader from "./utils/OnboardLoader/OnboardLoader.jsx";
import KASPLOGO from "./img/munclogotm.png";

const AuthLayout = ({children}) => {
  const [OnboardLoading, setOnboardLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOnboardLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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
            <div className="w-full md:w-1/3 bg-white md:bg-white flex flex-col justify-center relative border order-0 md:order-last bg-white/90">
              <div
                className="text-black font-semibold flex flex-col gap-4"
              >
                <div className="flex justify-center items-center absolute z-10">
                  <img
                    src={KASPLOGO}
                    alt="KASP Logo"
                    className="w-3/4 md:w-full"
                  />
                </div>
                {children}

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
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthLayout;
