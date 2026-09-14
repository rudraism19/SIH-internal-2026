import React from 'react';
import { Check } from 'lucide-react';

export default function VerificationBadge({ verified, grounded, citationsCount = 0 }) {
  // Strict Rule: verified === true AND grounded === true AND citationsCount > 0
  const isVerified = Boolean(verified === true && grounded === true && citationsCount > 0);

  if (isVerified) {
    return (
      <div className="verification-badge badge-verified" title="Grounding confirmed against verified BIS gazette / Indian Standards repository">
        <Check size={13} className="badge-icon text-emerald-600" />
        <span className="badge-text">VERIFIED AGAINST BIS SOURCE</span>
      </div>
    );
  }

  // Do not show any badge for general/conversational/unverified queries
  return null;
}

