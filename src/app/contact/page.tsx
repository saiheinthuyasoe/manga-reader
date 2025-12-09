"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitted(true);
    setSubmitting(false);
    setFormData({ name: "", email: "", subject: "", message: "" });

    // Reset success message after 5 seconds
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Have a question or feedback? We&apos;d love to hear from you. Send us a
            message and we&apos;ll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-green-500" />
                Send us a Message
              </h2>

              {submitted && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg">
                  <p className="text-green-500 font-semibold">
                    Thank you! Your message has been sent successfully.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-2"
                    >
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-2"
                    >
                      Your Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium mb-2"
                  >
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                    placeholder="What is this about?"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium mb-2"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
                >
                  <Send className="w-5 h-5" />
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Email */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Mail className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-lg">Email</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-2">
                Send us an email anytime
              </p>
              <a
                href="mailto:butee69@gmail.com"
                className="text-green-500 hover:text-green-400 transition"
              >
                butee69@gmail.com
              </a>
            </div>

            {/* Phone */}
            {/* <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Phone className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-lg">Phone</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-2">
                Call us during business hours
              </p>
              <a
                href="tel:+1234567890"
                className="text-green-500 hover:text-green-400 transition"
              >
                +1 (234) 567-890
              </a>
              <p className="text-zinc-500 text-xs mt-2">
                Mon-Fri: 9:00 AM - 6:00 PM
              </p>
            </div> */}

            {/* Address */}
            {/* <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <MapPin className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-lg">Address</h3>
              </div>
              <p className="text-zinc-400 text-sm">
                123 Manga Street
                <br />
                Reading City, RC 12345
                <br />
                Myanmar
              </p>
            </div> */}

            {/* Response Time */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-green-500">
                Quick Response
              </h3>
              <p className="text-zinc-300 text-sm">
                We typically respond to all inquiries within 24-48 hours during
                business days.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-green-500">
                How do I request a manga?
              </h3>
              <p className="text-zinc-400 text-sm">
                You can request manga through your profile menu by clicking
                &quot;Request Manga&quot; and filling out the form with details.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-green-500">
                How do I report an issue?
              </h3>
              <p className="text-zinc-400 text-sm">
                Use the contact form above to report any technical issues or
                problems you encounter while using our platform.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-green-500">
                Can I become a translator?
              </h3>
              <p className="text-zinc-400 text-sm">
                Yes! Send us an email with your language skills and experience,
                and we&apos;ll get back to you with more information.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-green-500">
                What payment methods do you accept?
              </h3>
              <p className="text-zinc-400 text-sm">
                We use a coin-based system. You can purchase coins through
                various payment methods including credit cards and digital
                wallets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
