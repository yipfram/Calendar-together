import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    requireTLS: process.env.SMTP_SECURE !== "true", // Use STARTTLS for non-465 ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        // Don't fail on invalid certs in development
        rejectUnauthorized: process.env.NODE_ENV === "production",
    },
});

export async function sendInviteEmail(
    to: string,
    inviteLink: string,
    roomName: string,
    inviterName: string
): Promise<void> {
    const appName = "Calendar Together";

    const mailOptions = {
        from: `"${appName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: `You've been invited to join "${roomName}" on ${appName}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #7c3aed;">You're Invited!</h1>
                <p><strong>${inviterName}</strong> has invited you to join the room <strong>"${roomName}"</strong> on <strong>${appName}</strong>.</p>
                <p>Click the button below to accept the invitation:</p>
                <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(to right, #7c3aed, #db2777); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">
                    Accept Invitation
                </a>
                <p style="color: #666; font-size: 14px; margin-top: 24px;">
                    Or copy this link: <a href="${inviteLink}" style="color: #7c3aed;">${inviteLink}</a>
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="color: #999; font-size: 12px;">
                    This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
                </p>
            </div>
        `,
        text: `${inviterName} has invited you to join "${roomName}" on ${appName}.\n\nAccept the invitation: ${inviteLink}\n\nThis invitation expires in 7 days.`,
    };

    await transporter.sendMail(mailOptions);
}

export async function sendAddedToRoomEmail(
    to: string,
    roomName: string,
    roomLink: string,
    inviterName: string
): Promise<void> {
    const appName = "Calendar Together";

    const mailOptions = {
        from: `"${appName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: `You've been added to "${roomName}" on ${appName}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #7c3aed;">You've Been Added!</h1>
                <p><strong>${inviterName}</strong> has added you to the room <strong>"${roomName}"</strong> on <strong>${appName}</strong>.</p>
                <p>You can now view everyone's availability and coordinate schedules with your team.</p>
                <a href="${roomLink}" style="display: inline-block; background: linear-gradient(to right, #7c3aed, #db2777); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">
                    View Room
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="color: #999; font-size: 12px;">
                    If you didn't expect this email, you can leave the room from the app.
                </p>
            </div>
        `,
        text: `${inviterName} has added you to "${roomName}" on ${appName}.\n\nView the room: ${roomLink}`,
    };

    await transporter.sendMail(mailOptions);
}
