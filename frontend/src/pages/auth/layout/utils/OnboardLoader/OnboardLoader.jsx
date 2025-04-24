import React from "react";
import Logo from "../../img/MUNCSMALL.svg";
import styles from "./OnboardLoader.module.css";

const OnboardLoader = () => {
  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        position: "fixed",
        top: "0",
        left: "50%",
        zIndex: "100000",
        cursor: "none",
      }}
      className="d-flex align-items-center justify-content-center"
    >
      <div style={{ height: "15rem", width: "15rem" }}>
        <img
          className={styles.Animateimg}
          style={{ height: "100%", width: "100%", objectFit: "contain" }}
          src={Logo}
          alt="MUNC"
        />
      </div>
    </div>
  );
};

export default OnboardLoader;
