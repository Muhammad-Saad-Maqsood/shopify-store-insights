import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);

  return (
    <s-page heading="Settings">
      <s-section heading="Store Insights settings">
        <div className="settings-list">
          <div className="setting">
            <div>
              <strong>Order notifications</strong>
              <p>
                Receive notifications when new orders are available.
              </p>
            </div>

            <s-button
              variant={notifications ? "primary" : "secondary"}
              onClick={() => setNotifications(!notifications)}
            >
              {notifications ? "Enabled" : "Disabled"}
            </s-button>
          </div>

          <div className="setting">
            <div>
              <strong>Data source</strong>
              <p>
                Shopify Admin GraphQL API
              </p>
            </div>

            <span className="status">
              Connected
            </span>
          </div>
        </div>
      </s-section>

      <s-section heading="Application">
        <s-paragraph>
          Store Insights is an embedded Shopify application built
          with React Router, Polaris and the Shopify Admin GraphQL API.
        </s-paragraph>
      </s-section>

      <style>{`
        .settings-list {
          display: flex;
          flex-direction: column;
        }

        .setting {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 18px 0;
          border-bottom: 1px solid #e1e3e5;
        }

        .setting:last-child {
          border-bottom: 0;
        }

        p {
          margin: 6px 0 0;
          color: #6d7175;
          font-size: 14px;
        }

        .status {
          padding: 5px 10px;
          border-radius: 999px;
          background: #e3f1df;
          font-size: 12px;
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .setting {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </s-page>
  );
}