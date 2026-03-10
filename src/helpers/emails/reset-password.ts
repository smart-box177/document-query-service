export const resetPasswordEmailTemplate = (username: string, resetLink: string) => {
  return `\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #333;
      font-size: 24px;
    }
    .content {
      color: #555;
      line-height: 1.6;
      font-size: 16px;
    }
    .reset-link {
      display: inline-block;
      background-color: #007bff;
      color: #ffffff;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: bold;
    }
    .reset-link:hover {
      background-color: #0056b3;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #999;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hello ${username},</p>
      <p>We received a request to reset your password for your NCCC Portal account. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, please click the button below:</p>
      <a href="${resetLink}" class="reset-link">Reset Password</a>
      <p>This link will expire in a short time for security reasons.</p>
      <p>Thank you,</p>
      <p>NCCC Portal Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email, please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
`;
};
