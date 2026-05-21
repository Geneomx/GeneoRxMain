<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $resetUrl) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Reset your GeneoRx password')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('We received a request to reset the password for your GeneoRx account.')
            ->action('Reset password', $this->resetUrl)
            ->line('This link will expire in 60 minutes.')
            ->line('If you did not request a password reset, no action is needed   your password remains unchanged.')
            ->salutation('The GeneoRx team');
    }
}
