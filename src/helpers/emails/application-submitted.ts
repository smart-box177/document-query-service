export const applicationSubmittedAdminTemplate = (
  adminName: string,
  applicantName: string,
  applicationId: string,
  contractTitle: string,
  operator: string,
  referenceNumber: string,
  reviewLink: string
) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New NCCC Application Submitted</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background-color: #1d4ed8;
                color: #ffffff;
                padding: 24px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 22px;
                letter-spacing: 0.5px;
            }
            .badge {
                display: inline-block;
                margin-top: 10px;
                background-color: #fbbf24;
                color: #1e1e1e;
                font-size: 12px;
                font-weight: bold;
                padding: 4px 12px;
                border-radius: 999px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .content {
                padding: 30px;
            }
            .content p {
                color: #444444;
                line-height: 1.7;
                margin: 0 0 16px;
            }
            .detail-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 14px;
            }
            .detail-table th {
                text-align: left;
                background-color: #f1f5f9;
                color: #475569;
                padding: 10px 14px;
                font-weight: 600;
                border-bottom: 1px solid #e2e8f0;
            }
            .detail-table td {
                padding: 10px 14px;
                color: #1e293b;
                border-bottom: 1px solid #f1f5f9;
            }
            .cta-wrapper {
                text-align: center;
                margin: 28px 0 12px;
            }
            .cta-button {
                display: inline-block;
                background-color: #1d4ed8;
                color: #ffffff !important;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                font-size: 15px;
                letter-spacing: 0.3px;
            }
            .cta-button:hover {
                background-color: #1e40af;
            }
            .note {
                font-size: 12px;
                color: #94a3b8;
                text-align: center;
                margin-top: 8px;
            }
            .footer {
                background-color: #f8fafc;
                padding: 20px 30px;
                text-align: center;
                color: #94a3b8;
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>NCCC Portal — New Application Submitted</h1>
                <span class="badge">Action Required</span>
            </div>
            <div class="content">
                <p>Hello ${adminName},</p>
                <p>
                    A new Nigerian Content Compliance Certificate (NCCC) application has been submitted
                    and is awaiting your review and approval.
                </p>

                <table class="detail-table">
                    <tr>
                        <th>Field</th>
                        <th>Details</th>
                    </tr>
                    <tr>
                        <td>Reference No.</td>
                        <td><strong>${referenceNumber || applicationId.slice(-10).toUpperCase()}</strong></td>
                    </tr>
                    <tr>
                        <td>Contract Title</td>
                        <td>${contractTitle || "N/A"}</td>
                    </tr>
                    <tr>
                        <td>Operator / Promoter</td>
                        <td>${operator || "N/A"}</td>
                    </tr>
                    <tr>
                        <td>Submitted By</td>
                        <td>${applicantName}</td>
                    </tr>
                    <tr>
                        <td>Application ID</td>
                        <td style="font-family: monospace; font-size: 12px; color: #64748b;">${applicationId}</td>
                    </tr>
                </table>

                <div class="cta-wrapper">
                    <a href="${reviewLink}" class="cta-button">Review Application</a>
                </div>
                <p class="note">
                    This link takes you directly to the application in the admin review queue.<br/>
                    If the button doesn't work, copy and paste the link below into your browser:
                </p>
                <p class="note" style="word-break: break-all; color: #64748b;">${reviewLink}</p>

                <p>Please action this application at your earliest convenience.</p>
                <p>Best regards,<br/><strong>NCCC Portal System</strong></p>
            </div>
            <div class="footer">
                <p>You are receiving this email because you are a registered NCDMB admin on the NCCC Portal.</p>
                <p>&copy; ${new Date().getFullYear()} NCCC Portal. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
