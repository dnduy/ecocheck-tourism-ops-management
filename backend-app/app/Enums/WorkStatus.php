<?php

namespace App\Enums;

/**
 * WorkStatus — Trạng thái workflow của một checklist run.
 *
 * Flow: pending → in_progress → completed → needs_review → approved | rejected
 *       rejected → needs_review  (re-submit)
 *
 * Đây là nguồn sự thật duy nhất cho tất cả status string trong hệ thống.
 * Dùng WorkStatus::from($string) để parse, WorkStatus::PENDING->value để lấy string.
 */
enum WorkStatus: string
{
    case PENDING     = 'pending';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED   = 'completed';
    case NEEDS_REVIEW = 'needs_review';
    case APPROVED    = 'approved';
    case REJECTED    = 'rejected';

    /**
     * Các trạng thái hợp lệ trong hệ thống (không kể alias).
     */
    public static function validValues(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Map legacy/alias status strings sang canonical WorkStatus.
     * Dùng khi nhận input từ client hoặc migration dữ liệu cũ.
     */
    public static function fromLegacy(string $status): self
    {
        return match(strtolower(trim($status))) {
            'open', 'draft', 'pending'   => self::PENDING,
            'active', 'in_progress'       => self::IN_PROGRESS,
            'done', 'completed'           => self::COMPLETED,
            'needs_review', 'review'      => self::NEEDS_REVIEW,
            'approved', 'reviewed'        => self::APPROVED,
            'rejected', 'declined'        => self::REJECTED,
            default                       => self::PENDING,
        };
    }

    /**
     * Chuyển sang legacy status (open/done) dùng cho cột `status` cũ.
     */
    public function toLegacyStatus(): string
    {
        return match($this) {
            self::COMPLETED, self::NEEDS_REVIEW, self::APPROVED => 'done',
            default => 'open',
        };
    }

    /**
     * Check xem status này có phải trạng thái cuối (terminal) không.
     */
    public function isTerminal(): bool
    {
        return match($this) {
            self::APPROVED, self::REJECTED => true,
            default => false,
        };
    }

    /**
     * Kiểm tra xem có thể chuyển sang $next status không.
     */
    public function canTransitionTo(self $next): bool
    {
        return match($this) {
            self::PENDING     => $next === self::IN_PROGRESS,
            self::IN_PROGRESS => $next === self::COMPLETED,
            self::COMPLETED   => $next === self::NEEDS_REVIEW,
            self::NEEDS_REVIEW => in_array($next, [self::APPROVED, self::REJECTED]),
            self::REJECTED    => $next === self::NEEDS_REVIEW, // re-submit
            self::APPROVED    => false,
        };
    }

    /**
     * Human-readable label (tiếng Việt).
     */
    public function label(): string
    {
        return match($this) {
            self::PENDING      => 'Chưa làm',
            self::IN_PROGRESS  => 'Đang làm',
            self::COMPLETED    => 'Đã làm',
            self::NEEDS_REVIEW => 'Chờ duyệt',
            self::APPROVED     => 'Đã xác nhận',
            self::REJECTED     => 'Bị từ chối',
        };
    }
}
