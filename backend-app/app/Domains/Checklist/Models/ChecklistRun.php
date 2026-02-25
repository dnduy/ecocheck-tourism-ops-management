<?php

namespace App\Domains\Checklist\Models;

/**
 * ChecklistRun - Backward-compatibility alias for App\Models\Run.
 *
 * Lớp này giữ lại để làm việc với ChecklistRunRepository và ChecklistService
 * trong layer Domain cũ. Tất cả logic mới nên dùng App\Models\Run trực tiếp.
 *
 * @deprecated Sử dụng App\Models\Run trực tiếp trong code mới.
 */
class ChecklistRun extends \App\Models\Run
{
    // Inherit all from Run — same table, same relationships, same casts.
    // This alias exists only for backward compatibility with Domains/Checklist layer.
}

