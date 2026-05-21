<?php

namespace App\Policies;

use App\Models\CheckIn;
use App\Models\User;

class CheckInPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CheckIn $checkIn): bool
    {
        return $user->id === $checkIn->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, CheckIn $checkIn): bool
    {
        return $user->id === $checkIn->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, CheckIn $checkIn): bool
    {
        return $user->id === $checkIn->user_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, CheckIn $checkIn): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, CheckIn $checkIn): bool
    {
        return false;
    }
}
