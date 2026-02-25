<?php

namespace App\Support;

use App\Models\Run;
use App\Models\User;

class RunAccess
{
    public static function isAdminOrManager(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'manager']);
    }

    public static function isApprover(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'manager']);
    }

    public static function canView(User $user, Run $run): bool
    {
        if (self::isAdminOrManager($user)) {
            return true;
        }

        // Supervisor can view all runs, not just their own
        if ($user->hasRole('supervisor')) {
            return true;
        }

        // Staff can only view their own assigned runs
        return (int) $run->assigned_to === (int) $user->id;
    }

    public static function canEditEntries(User $user, Run $run): bool
    {
        if (self::isAdminOrManager($user)) {
            return true;
        }

        return (int) $run->assigned_to === (int) $user->id;
    }

    public static function canApprove(User $user, Run $run): bool
    {
        return self::isAdminOrManager($user);
    }
}
