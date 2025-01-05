import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your email',
    html: `
      <div>
        <h1>Verify your email</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Now</a>
      </div>
    `,
  })
}

export async function sendMagicLinkEmail(email: string, token: string) {
  const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/magic-link/callback?token=${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Sign in to your account',
    html: `
      <div>
        <h1>Sign in to your account</h1>
        <p>Click the link below to sign in to your account:</p>
        <a href="${magicLinkUrl}">Sign in</a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request this email, you can safely ignore it.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset your password',
    html: `
      <div>
        <h1>Reset your password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      </div>
    `,
  })
}
