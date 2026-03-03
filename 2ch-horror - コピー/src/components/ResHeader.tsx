import React from "react";
import styles from "../styles/board.module.css";

interface ResHeaderProps {
  number: number;
  name: string;
  id: string;
  date: string;
}

/**
 * メタデータ行 — シネマティック版。
 * 2ch準拠の配色（緑の名前・水色の日付・灰色のID）。
 */
export const ResHeader: React.FC<ResHeaderProps> = ({
  number,
  name,
  id,
  date,
}) => {
  return (
    <div className={styles.metaRow}>
      <span className={styles.metaNumber}>{number}</span>
      <span className={styles.metaName}>{name}</span>
      <span className={styles.metaDate}>{date}</span>
      <span className={styles.metaId}>ID:{id}</span>
    </div>
  );
};
