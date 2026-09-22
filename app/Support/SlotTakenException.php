<?php

namespace App\Support;

use RuntimeException;

/** Thrown by DoctorSchedule::book() when somebody already holds that slot. */
final class SlotTakenException extends RuntimeException
{
    public const MESSAGE = 'That time was just taken. Please pick another.';

    public function __construct()
    {
        parent::__construct(self::MESSAGE);
    }
}
