"use client"; // If you're using Next.js 13 app router, this ensures client-side rendering

import React, { useState, FormEvent } from "react";
import { GitHubLogoIcon, GearIcon, FileTextIcon  } from "@radix-ui/react-icons";
const OnboardingPage: React.FC = () => {
  const [formData, setFormData] = useState({
    jobTitle: "",
    jobDescription: "",
    tonePreference: "formal",
  });

  // Handle text/textarea/select changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Placeholder connect functions
  const handleConnectGithub = () => {
    alert("GitHub connection flow goes here.");
    // Later: redirect to GitHub OAuth or token retrieval
  };

  const handleConnectERP = () => {
    alert("ERP connection flow goes here.");
    // Placeholder logic for future integration
  };

  const handleConnectCMS = () => {
    alert("CMS connection flow goes here.");
    // Placeholder logic for future integration
  };

  // Handle form submit
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // For now, just log. Later, you might send this data to your API/database
    console.log("Onboarding Form Data:", formData);
    alert("Form submitted! Check console for details.");
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      <h1>Onboarding Page</h1>
      <p>
        Welcome! Connect your services and provide some details to help our AI
        tools tailor summaries and communication tips for you.
      </p>

      {/* SECTION: Connect to external services */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Connect Your Services</h2>

        {/* GitHub Button */}
        <button
          onClick={handleConnectGithub}
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "green",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Connect GitHub
          <span style={{ marginLeft: "0.5rem" }}>
            <GitHubLogoIcon width={20} height={20} style={{ fill: "#fff" }} />
          </span>
        </button>

        {/* ERP Button */}
        <button
          onClick={handleConnectERP}
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "blue",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Connect ERP
          <span style={{ marginLeft: "0.5rem" }}>
            <GearIcon width={20} height={20} style={{ fill: "#fff" }} />
          </span>
        </button>

        {/* CMS Button */}
        <button
          onClick={handleConnectCMS}
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "purple",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Connect CMS
          <span style={{ marginLeft: "0.5rem" }}>
            <FileTextIcon width={20} height={20} style={{ fill: "#fff" }} />
          </span>
        </button>
      </section>

      {/* SECTION: Form to gather user info */}
      <section>
        <h2>Provide Your Details</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="jobTitle"
              style={{ display: "block", marginBottom: "0.5rem" }}
            >
              Job Title:
            </label>
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="e.g. Customer Support Specialist"
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="jobDescription"
              style={{ display: "block", marginBottom: "0.5rem" }}
            >
              Job Description:
            </label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              placeholder="Briefly describe your responsibilities..."
              style={{ width: "100%", height: "80px", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="tonePreference"
              style={{ display: "block", marginBottom: "0.5rem" }}
            >
              Preferred Tone for Communication:
            </label>
            <select
              id="tonePreference"
              name="tonePreference"
              value={formData.tonePreference}
              onChange={handleChange}
              style={{ width: "100%", padding: "0.5rem" }}
            >
              <option value="formal">Formal</option>
              <option value="friendly">Friendly</option>
              <option value="technical">Technical</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          <button type="submit" style={{ padding: "0.75rem 1.5rem" }}>
            Submit
          </button>
        </form>
      </section>
    </div>
  );
};

export default OnboardingPage;
