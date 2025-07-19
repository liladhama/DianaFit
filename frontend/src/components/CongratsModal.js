
import React from "react";
import ReactDOM from "react-dom";
import Confetti from "react-confetti";

export default function CongratsModal({ isOpen, onClose, icon, title, message }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.35)",
      zIndex: 20000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 0.3s"
    }}>
      {/* Фейерверк поверх overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 21000,
        pointerEvents: 'none',
      }}>
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={700}
          recycle={false}
          gravity={0.35}
          initialVelocityY={22}
          wind={0.01}
          opacity={0.95}
          colors={['#3b82f6','#f59e42','#f43f5e','#10b981','#fbbf24','#6366f1','#f472b6','#facc15','#0ea5e9','#ef4444','#22d3ee','#a21caf']}
          confettiSource={{x: window.innerWidth/2-150, y: 0, w: 300, h: 20}}
          tweenDuration={800}
          friction={0.96}
        />
      </div>
      <div style={{
        width: '100%',
        maxWidth: 340,
        background: "#fff",
        borderRadius: 24,
        boxShadow: "0 8px 32px rgba(59,130,246,0.18), 0 2px 8px rgba(0,0,0,0.08)",
        padding: "36px 0 28px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        animation: "congrats-pop 0.6s cubic-bezier(.68,-0.55,.27,1.55)",
        textAlign: "center",
        position: "relative",
        margin: 0
      }}>
        <style>{`
          @media (max-width: 520px) {
            .congrats-modal-content { max-width: 95vw !important; }
          }
        `}</style>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6", marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 18, color: "#222", marginBottom: 8 }}>{message}</div>
        <button
          onClick={onClose}
          style={{
            marginTop: 18,
            padding: "10px 28px",
            borderRadius: 16,
            background: "linear-gradient(90deg, #2196f3 0%, #00c6ff 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "16px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(33,150,243,0.12)",
            transition: "all 0.2s",
            outline: "none"
          }}
        >
          ОК
        </button>
        <style>{`
          @keyframes congrats-pop {
            0% { transform: scale(0.7) translateY(40px); opacity: 0; }
            60% { transform: scale(1.08) translateY(-8px); opacity: 1; }
            80% { transform: scale(0.97) translateY(0); }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
}
