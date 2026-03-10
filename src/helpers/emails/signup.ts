export const signupEmailTemplate = (username: string, verificationLink: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NCCC Portal</title>
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
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background-color: #007bff;
                color: #ffffff;
                padding: 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 30px;
                text-align: center;
            }
            .content p {
                color: #666666;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .verification-button {
                display: inline-block;
                background-color: #007bff;
                color: #ffffff;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 4px;
                font-weight: bold;
                margin: 20px 0;
            }
            .verification-button:hover {
                background-color: #0056b3;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #666666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to NCCC Portal</h1>
            </div>
            <div class="content">
                <p>Hello ${username},</p>
                <p>Thank you for signing up for the NCCC Portal! We're excited to have you on board.</p>
                <p>To complete your registration and verify your email address, please click the button below:</p>
                <a href="${verificationLink}" class="verification-button">Verify Email Address</a>
                <p>If you didn't sign up for an account, please ignore this email.</p>
                <p>Best regards,<br>The NCCC Portal Team</p>
            </div>
            <div class="footer">
                <p>This email was sent to ${username}@example.com</p>
                <p>&copy; 2024 NCCC Portal. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
