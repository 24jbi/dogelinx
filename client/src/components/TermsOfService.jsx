import React, { useState } from "react";

export default function TermsOfService({ onAccept, onDecline, showButtons = true }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = React.useRef(null);

  const handleScroll = (e) => {
    const element = e.target;
    // Check if we're at the bottom (within 5 pixels)
    const isAtBottom = element.scrollHeight - element.scrollTop <= 5;
    setScrolledToBottom(isAtBottom);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          background: "#0f1219",
          color: "#cbd5e1",
          fontSize: "13px",
          lineHeight: "1.6",
          borderBottom: "1px solid #374151",
        }}
      >
        <h1 style={{ color: "#cbd5e1", marginBottom: "20px", fontSize: "24px", fontWeight: "bold" }}>
          DogeLinx Terms of Service
        </h1>

        <p style={{ color: "#9ca3af", marginBottom: "20px" }}>
          <strong>Effective Date:</strong> February 21, 2026<br />
          <strong>Last Updated:</strong> February 21, 2026
        </p>

        <p style={{ marginBottom: "20px" }}>
          These Terms of Service ("Terms") form a legal agreement between you and DogeLinx ("DogeLinx," "we," "us," or "our"). They govern your access to and use of DogeLinx websites, apps, services, and tools, including DogeLinx Studio, chat features, creator tools, and any games/experiences or content made available through DogeLinx (collectively, the "Services").
        </p>

        <p style={{ marginBottom: "20px" }}>
          <strong>By using the Services, you agree to these Terms. If you do not agree, do not use the Services.</strong>
        </p>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          1) Definitions
        </h2>
        <ul style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <li><strong>Account:</strong> Your DogeLinx account.</li>
          <li><strong>Content:</strong> Anything uploaded, created, posted, published, or made available through the Services (including games/experiences, maps, models, scripts/code, text, images, audio, video, and other files).</li>
          <li><strong>Experience:</strong> A game or world published on DogeLinx.</li>
          <li><strong>Creator:</strong> A user who creates or publishes Content or Experiences using DogeLinx Studio or other tools.</li>
          <li><strong>DT / DogeTokens:</strong> DogeLinx's in-platform virtual currency.</li>
          <li><strong>Virtual Items:</strong> Digital items, including avatar items, gamepasses, cosmetics, perks, and similar digital entitlements.</li>
        </ul>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          2) Eligibility and Parental/Guardian Consent
        </h2>
        <p style={{ marginBottom: "20px" }}>
          You must be allowed to use the Services under applicable law. If you are under the age of majority where you live, you may use DogeLinx only with permission of your parent or legal guardian. Your parent/guardian is responsible for your use of the Services and compliance with these Terms.
        </p>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          3) Your Account
        </h2>
        <p style={{ marginBottom: "20px" }}>
          You are responsible for your Account and all activity under it. You agree to:
        </p>
        <ul style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <li>Provide accurate information when requested</li>
          <li>Keep your login credentials secure</li>
          <li>Promptly notify us of unauthorized access</li>
        </ul>
        <p style={{ marginBottom: "20px" }}>
          We may suspend or terminate Accounts as described in these Terms.
        </p>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          4) Community Rules and Safety
        </h2>
        <p style={{ marginBottom: "10px" }}>You agree not to:</p>
        <ul style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <li>Break laws or encourage illegal activity</li>
          <li>Harass, bully, threaten, or target others</li>
          <li>Engage in hate speech or discriminatory harassment</li>
          <li>Post sexual content involving minors, or any content exploiting minors</li>
          <li>Post pornographic content where it is not allowed by our rules</li>
          <li>Post graphic violence intended to shock, or content that encourages real-world harm</li>
          <li>Scam, spam, or attempt to steal Accounts, DT, Virtual Items, or personal information</li>
          <li>Cheat, hack, exploit bugs, or interfere with the Services</li>
          <li>Upload malware or code meant to damage devices or disrupt service</li>
          <li>Impersonate others or misrepresent affiliation</li>
          <li>Upload Content that infringes someone else's rights (copyright/trademark/etc.)</li>
        </ul>
        <p style={{ marginBottom: "20px" }}>
          We may publish additional Community Guidelines; if so, they are part of these Terms.
        </p>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          5) Chat Rules
        </h2>
        <p style={{ marginBottom: "10px" }}>DogeLinx may offer chat, messaging, or communication features. You agree:</p>
        <ul style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <li>Not to share sensitive personal information (address, phone, passwords, school details, etc.)</li>
          <li>Not to ask others for passwords or account access</li>
          <li>Not to send harassment, threats, sexual content to minors, or illegal content</li>
          <li>Not to use chat to coordinate scams or abuse</li>
        </ul>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          6) DogeLinx Studio and Creator Tools
        </h2>
        <p style={{ marginBottom: "20px" }}>
          DogeLinx Studio and creator tools are provided "as-is" and may change over time. We may add, remove, or modify features, APIs, scripting behavior, and publishing flow. You are responsible for testing your Experiences. We do not guarantee compatibility with old projects.
        </p>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          7) User Content: Ownership and License
        </h2>
        <p style={{ marginBottom: "10px" }}>
          <strong>You Keep Ownership:</strong> As between you and DogeLinx, you retain ownership of Content you create and upload, except third-party materials you don't own.
        </p>
        <p style={{ marginBottom: "10px" }}>
          <strong>You Grant DogeLinx a License:</strong> To operate and improve the Services, you grant DogeLinx a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to host, store, reproduce, adapt, modify (for technical reasons), publish, display, perform, distribute, and make your Content available through the Services, including for promotion (e.g., thumbnails, screenshots, trailers).
        </p>
        <p style={{ marginBottom: "20px" }}>
          This license continues until you delete your Content, except: copies may remain temporarily in backups, copies may remain where required to keep other users' Experiences functional, and we may retain copies to comply with legal obligations or enforcement needs.
        </p>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          8) Moderation and Enforcement
        </h2>
        <p style={{ marginBottom: "10px" }}>
          We may investigate and take action if we believe you violated these Terms or our rules. Actions may include:
        </p>
        <ul style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <li>Warnings</li>
          <li>Removal or limitation of Content/Experiences</li>
          <li>Chat restrictions</li>
          <li>Temporary suspension</li>
          <li>Permanent bans</li>
          <li>Withholding or reversing DT, Virtual Items, or creator earnings if tied to abuse/fraud</li>
        </ul>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          9) Copyright (DMCA) and Takedowns
        </h2>
        <p style={{ marginBottom: "20px" }}>
          If you believe content on DogeLinx infringes your copyright, email: <strong>dogeman2090@gmail.com</strong> with identification of the copyrighted work, where the infringing content is located, your contact information, a statement of good faith belief, and your signature.
        </p>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          10) DT (DogeTokens) and Virtual Items
        </h2>
        <p style={{ marginBottom: "10px" }}>
          DogeLinx offers DT (DogeTokens) which may be used to buy gamepasses and avatar items. You understand that DT and Virtual Items are digital items used only within DogeLinx, have no real-world cash value (unless required by law), and their prices and availability may change.
        </p>
        <p style={{ marginBottom: "20px" }}>
          <strong>All purchases are final</strong> except where refunds are required by law or explicitly offered in a DogeLinx refund policy.
        </p>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          11) Creator Earnings
        </h2>
        <p style={{ marginBottom: "20px" }}>
          If you participate in Creator Earnings: you must meet eligibility requirements (which we may update), we may require identity verification and tax information, we may delay or withhold payments to address fraud or abuse, and you are responsible for reporting and paying taxes. If we believe earnings are tied to rule violations or abuse, we may suspend the program and take enforcement actions.
        </p>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          12) Termination
        </h2>
        <p style={{ marginBottom: "20px" }}>
          You can stop using the Services at any time. We may suspend or terminate access if you violate these Terms, create risk or harm, or require removal for legal compliance. Upon termination, you may lose access to Content, DT, Virtual Items, and Creator Earnings.
        </p>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          13) Disclaimers
        </h2>
        <p style={{ marginBottom: "20px", fontStyle: "italic" }}>
          THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, DOGELINX DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not guarantee uninterrupted or error-free operation.
        </p>

        <h2 style={{ color: "#f0fdf4", marginTop: "30px", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
          14) Contact
        </h2>
        <p style={{ marginBottom: "40px" }}>
          DogeLinx<br />
          Email: <strong>dogeman2090@gmail.com</strong>
        </p>
      </div>

      {showButtons && (
        <div style={{ padding: "20px", background: "#1a2a3a", borderTop: "1px solid #374151", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onDecline}
            style={{
              padding: "10px 24px",
              background: "rgba(100, 116, 139, 0.2)",
              color: "#cbd5e1",
              border: "1px solid #475569",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(100, 116, 139, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(100, 116, 139, 0.2)";
            }}
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={!scrolledToBottom}
            style={{
              padding: "10px 24px",
              background: scrolledToBottom ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)" : "rgba(60, 130, 246, 0.4)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: scrolledToBottom ? "pointer" : "not-allowed",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.2s",
              opacity: scrolledToBottom ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (scrolledToBottom) {
                e.target.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
            }}
          >
            {scrolledToBottom ? "I Agree & Accept ToS" : "Scroll to bottom to accept"}
          </button>
        </div>
      )}
    </div>
  );
}
