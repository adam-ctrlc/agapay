<?php

declare(strict_types=1);

namespace App\Enums;

enum ReportStatus: string
{
    case Submitted = 'submitted';
    case Verified = 'verified';
    case Dismissed = 'dismissed';
    case Resolved = 'resolved';

    public function label(): string
    {
        return match ($this) {
            self::Submitted => 'Awaiting review',
            self::Verified => 'Verified',
            self::Dismissed => 'Dismissed',
            self::Resolved => 'Resolved',
        };
    }

    /**
     * What the reporter is told when the status moves. Describes the review
     * decision only, never an agency response this system cannot observe.
     */
    public function reporterMessage(): string
    {
        return match ($this) {
            self::Submitted => 'Reopened for review by your LGU.',
            self::Verified => 'Your LGU verified this report.',
            self::Dismissed => 'Your LGU reviewed this and did not take it forward.',
            self::Resolved => 'Your LGU marked this resolved.',
        };
    }

    public function isOpen(): bool
    {
        return match ($this) {
            self::Submitted, self::Verified => true,
            self::Dismissed, self::Resolved => false,
        };
    }
}
