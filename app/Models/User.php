<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'is_admin',
        'role',
        'password',
        'social_provider',
        'social_provider_id',
    ];

    /** Admin role tiers, in descending order of power. */
    public const ROLE_OWNER = 'owner';

    public const ROLE_ADMIN = 'admin';

    public const ROLE_SUPPORT = 'support';

    public const ROLES = [self::ROLE_OWNER, self::ROLE_ADMIN, self::ROLE_SUPPORT];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the user's profile.
     */
    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    public function subscription()
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }

    /**
     * Get the user's check-ins.
     */
    public function checkIns()
    {
        return $this->hasMany(CheckIn::class);
    }

    // ── Admin role helpers ─────────────────────────────────────────────────
    // `role` is only meaningful when is_admin is true. Admins created before
    // roles existed were backfilled as owner by the role migration; any
    // admin with a null role is treated as full admin (not owner) so new
    // grants default to the safer tier.

    public function adminRole(): string
    {
        return $this->role ?: self::ROLE_ADMIN;
    }

    public function isOwner(): bool
    {
        return $this->is_admin && $this->adminRole() === self::ROLE_OWNER;
    }

    /** Support tier is read-mostly: may view, may not modify accounts. */
    public function canWriteAdmin(): bool
    {
        return $this->is_admin && $this->adminRole() !== self::ROLE_SUPPORT;
    }

    /** Destructive account actions: delete users, manage admins, set passwords. */
    public function canManageAccounts(): bool
    {
        return $this->isOwner();
    }
}
