import React from "react";
import styles from "../styles/board.module.css";

interface ResNumberProps {
  number: number;
}

export const ResNumber: React.FC<ResNumberProps> = ({ number }) => {
  return <span className={styles.resNumber}>{number}</span>;
};
