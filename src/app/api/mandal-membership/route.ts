import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { fetchModelRecord } from '@/lib/idempiere';

const CC_EMAIL = 'koptodev008@gmail.com';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export async function POST(request: NextRequest) {
  try {
    const { mandalId, name, email, phone, note = '' } = await request.json();
    if (!mandalId || !name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Name, email, and contact number are required' }, { status: 400 });
    }
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    const mandal = await fetchModelRecord('MCS_Mandals', String(mandalId));
    const mandalEmail = String(mandal.EMail || '').trim();
    if (!emailPattern.test(mandalEmail)) {
      return NextResponse.json({ error: 'This Mandal does not have a valid email address' }, { status: 422 });
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT || 587);
    if (!host || !user || !pass) {
      return NextResponse.json({ error: 'Email service is not configured' }, { status: 503 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    const safe = {
      name: escapeHtml(String(name).trim()),
      email: escapeHtml(String(email).trim()),
      phone: escapeHtml(String(phone).trim()),
      note: escapeHtml(String(note).trim()).replace(/\n/g, '<br>'),
      mandal: escapeHtml(String(mandal.Name || 'Mandal')),
    };

    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: CC_EMAIL,
      cc: CC_EMAIL,
      replyTo: String(email).trim(),
      subject: `Membership request for ${String(mandal.Name || 'Mandal')}`,
      text: `New membership request\n\nName: ${name}\nEmail: ${email}\nContact number: ${phone}\n\nNote:\n${note || '-'}`,
      html: `<h2>New membership request</h2><p><strong>Mandal:</strong> ${safe.mandal}</p><p><strong>Name:</strong> ${safe.name}<br><strong>Email:</strong> ${safe.email}<br><strong>Contact number:</strong> ${safe.phone}</p><p><strong>Note:</strong><br>${safe.note || '-'}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mandal membership email failed:', error);
    return NextResponse.json({ error: 'Could not send membership request' }, { status: 500 });
  }
}
