import React from "react";

const Welcome: React.FC = () => {
  return (
    <div
      style={{
        padding: "40px 24px 100px",
        maxWidth: "800px",
        margin: "0 auto",
        minHeight: "calc(100vh - 80px)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "800",
            marginBottom: "16px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Welcome
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#666",
            lineHeight: "1.6",
          }}
        >
          Speak your day. Own your time.
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#fff",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          border: "1px solid #f0f0f0",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            marginBottom: "20px",
            color: "#333",
          }}
        >
          📝 How to Record Your Day
        </h2>
        <p
          style={{
            fontSize: "15px",
            color: "#666",
            lineHeight: "1.8",
            marginBottom: "16px",
          }}
        >
          There are a couple of ways to record your day:
        </p>
        <ul
          style={{
            fontSize: "15px",
            color: "#666",
            lineHeight: "1.8",
            marginBottom: "20px",
            paddingLeft: "20px",
          }}
        >
          <li style={{ marginBottom: "8px" }}>
            <strong>Record directly</strong> on our interface using the Record
            tab
          </li>
          <li>
            <strong>Upload voice memos</strong> from your phone (files need to
            be time-stamped for AI to get an accurate sense of your time)
          </li>
        </ul>

        <div
          style={{
            backgroundColor: "#f0f7ff",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "24px",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "12px",
              color: "#1a73e8",
            }}
          >
            💡 iPhone Automation Tip
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "#333",
              lineHeight: "1.6",
              marginBottom: "16px",
            }}
          >
            You can automate your voice memo to do the work for you! Here are
            short videos to help you set up recording automation and airdrop the
            files to our interface:
          </p>

          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontSize: "15px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#333",
              }}
            >
              1. Create the Shortcut & Add to Home Screen
            </h4>
            <video
              controls
              style={{
                width: "100%",
                maxWidth: "250px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                display: "block",
                margin: "0 auto",
              }}
            >
              <source src="/makeshortcut.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontSize: "15px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#333",
              }}
            >
              2. Home Screen Automation (or say "Hey Siri, create recording")
            </h4>
            <video
              controls
              style={{
                width: "100%",
                maxWidth: "250px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                display: "block",
                margin: "0 auto",
              }}
            >
              <source src="/homescreen.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div style={{ marginBottom: "0" }}>
            <h4
              style={{
                fontSize: "15px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#333",
              }}
            >
              3. Double-Tap Back of Phone Activation
            </h4>
            <video
              controls
              style={{
                width: "100%",
                maxWidth: "250px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                display: "block",
                margin: "0 auto",
              }}
            >
              <source src="/doubletap.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#fff",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          border: "1px solid #f0f0f0",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            marginBottom: "20px",
            color: "#333",
          }}
        >
          🚀 Your Workflow
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div
              style={{
                minWidth: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#667eea",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              1
            </div>
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "4px",
                  color: "#333",
                }}
              >
                Capture Your Day
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  lineHeight: "1.6",
                }}
              >
                Record your thoughts and activities throughout the day
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div
              style={{
                minWidth: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#667eea",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              2
            </div>
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "4px",
                  color: "#333",
                }}
              >
                Generate Schedule
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  lineHeight: "1.6",
                }}
              >
                Go to the Confirm tab and let AI create your schedule
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div
              style={{
                minWidth: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#667eea",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              3
            </div>
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "4px",
                  color: "#333",
                }}
              >
                Review & Refine
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  lineHeight: "1.6",
                }}
              >
                Edit any inaccuracies or refine details through the feedback box
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div
              style={{
                minWidth: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#667eea",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              4
            </div>
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "4px",
                  color: "#333",
                }}
              >
                Confirm & Export
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  lineHeight: "1.6",
                }}
              >
                Confirm your schedule to generate an ICS file for Google Calendar and view insights on how you spent your time
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "32px",
          padding: "24px",
          backgroundColor: "#f8f9fa",
          borderRadius: "16px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "16px",
            color: "#333",
            fontWeight: "600",
            marginBottom: "12px",
          }}
        >
          Ready to get started?
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "#666",
            lineHeight: "1.6",
          }}
        >
          Tap the <strong>Record</strong> tab below to begin capturing your day
        </p>
      </div>
    </div>
  );
};

export default Welcome;
