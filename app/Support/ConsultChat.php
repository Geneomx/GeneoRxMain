<?php

namespace App\Support;

use App\Models\ConsultMessage;
use App\Models\DoctorMessage;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * The back-and-forth inside one consult thread, shared by the patient's app,
 * the patient's web page, the doctor's own portal and the admin inbox — so
 * "who said what, and is the doctor still owed a reply" is decided in one
 * place rather than four.
 *
 * A thread's opening question stays on DoctorMessage::body. Everything after
 * it is a ConsultMessage.
 */
final class ConsultChat
{
    /** The whole conversation, oldest first, opening question included. */
    public static function transcript(DoctorMessage $thread): Collection
    {
        // Use the eager-loaded relation when the caller supplied one: the
        // patient's list renders 50 threads, and a query each would be 50.
        $turns = $thread->relationLoaded('turns')
            ? $thread->turns->sortBy('id')->values()
            : $thread->turns()->orderBy('id')->get();

        $conversation = collect([
            self::synthetic($thread, ConsultMessage::PATIENT, $thread->body, $thread->user_id, $thread->created_at),
        ])->concat($turns);

        // A reply written straight onto the thread rather than as a turn. The
        // release migration converts the old ones, but a reply the patient can
        // see must never depend on a migration having run, so it is recovered
        // here too.
        if (filled($thread->reply_body) && ! $turns->contains(fn (ConsultMessage $m) => $m->fromDoctor())) {
            $conversation->push(self::synthetic(
                $thread,
                ConsultMessage::DOCTOR,
                $thread->reply_body,
                $thread->replied_by,
                $thread->replied_at ?? $thread->updated_at,
            ));
        }

        return $conversation->values();
    }

    /**
     * A turn that is not a row of its own — the opening question, or a legacy
     * single reply. Prepending them here is what lets every renderer treat a
     * thread as one flat conversation.
     */
    private static function synthetic(DoctorMessage $thread, string $sender, string $body, ?int $userId, $at): ConsultMessage
    {
        $turn = new ConsultMessage([
            'doctor_message_id' => $thread->id,
            'sender' => $sender,
            'user_id' => $userId,
            'body' => $body,
        ]);
        $turn->created_at = $at;
        $turn->exists = false;

        return $turn;
    }

    /**
     * Add a turn and move the thread's status with it.
     *
     * A patient following up on an answered thread puts it back in the
     * doctor's queue — otherwise a question asked after an answer is never
     * seen again.
     */
    public static function post(DoctorMessage $thread, string $sender, ?User $author, string $body): ConsultMessage
    {
        $turn = $thread->turns()->create([
            'sender' => $sender,
            'user_id' => $author?->id,
            'body' => $body,
        ]);

        if ($sender === ConsultMessage::DOCTOR) {
            $thread->update([
                // reply_body is what app builds before chat read. Keeping the
                // newest doctor turn here means an older phone still shows the
                // current answer instead of a stale first one.
                'reply_body' => $body,
                'status' => 'answered',
                'replied_at' => now(),
                'replied_by' => $author?->id,
            ]);
        } elseif ($thread->status !== 'closed') {
            $thread->update(['status' => 'new']);
        }

        return $turn;
    }

    /** Turns the given side has not seen yet. */
    public static function unreadFor(DoctorMessage $thread, string $side): int
    {
        return $thread->turns()
            ->where('sender', self::otherSide($side))
            ->whereNull('read_at')
            ->count();
    }

    /** Mark everything the other side wrote as seen. */
    public static function markRead(DoctorMessage $thread, string $side): void
    {
        $thread->turns()
            ->where('sender', self::otherSide($side))
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    private static function otherSide(string $side): string
    {
        return $side === ConsultMessage::DOCTOR ? ConsultMessage::PATIENT : ConsultMessage::DOCTOR;
    }
}
