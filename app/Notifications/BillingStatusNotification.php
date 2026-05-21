<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BillingStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $subjectLine,
        private readonly string $messageLine,
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subjectLine)
            ->greeting('GeneoRx billing update')
            ->line($this->messageLine)
            ->line('You can manage your subscription from your GeneoRx billing page.');
    }
}
